import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../models/database';
import { Note, NoteWithTags, CreateNoteDTO, UpdateNoteDTO } from '../models/note';
import { authMiddleware } from '../middleware/auth.middleware';
import { createVersion } from '../models/noteVersion';
import type Database from 'better-sqlite3';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all notes (user's own notes only)
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.userId;
    
    const notes = db.prepare(
      'SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC'
    ).all(userId) as Note[];
    
    res.json(notes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get note by ID with tags and links (user's own note only)
router.get('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.userId;
    const noteId = req.params.id;
    
    // Verify note belongs to user
    const note = db.prepare(
      'SELECT * FROM notes WHERE id = ? AND user_id = ?'
    ).get(noteId, userId) as Note | undefined;
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Get tags
    const tags = db.prepare(`
      SELECT t.* FROM tags t
      JOIN note_tags nt ON t.id = nt.tag_id
      WHERE nt.note_id = ?
    `).all(noteId);

    // Get outgoing links (only user's notes)
    const outgoingLinks = db.prepare(`
      SELECT n.* FROM notes n
      JOIN links l ON n.id = l.target_note_id
      WHERE l.source_note_id = ? AND n.user_id = ?
    `).all(noteId, userId);

    // Get incoming links (backlinks) from user's notes
    const backlinks = db.prepare(`
      SELECT n.* FROM notes n
      JOIN links l ON n.id = l.source_note_id
      WHERE l.target_note_id = ? AND n.user_id = ?
    `).all(noteId, userId);

    res.json({
      ...note,
      tags,
      outgoingLinks,
      backlinks
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new note
router.post('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.userId;
    const { title, content, tags }: CreateNoteDTO = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const id = uuidv4();
    const now = Date.now();

    const insert = db.prepare(`
      INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insert.run(id, title, content || '', now, now, userId);

    // Add tags if provided
    if (tags && tags.length > 0) {
      addTagsToNote(db, id, tags);
    }

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note;
    res.status(201).json(note);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update note (auto-create version snapshot)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.userId;
    const { title, content, tags }: UpdateNoteDTO = req.body;

    // Verify note belongs to user
    const existing = db.prepare(
      'SELECT * FROM notes WHERE id = ? AND user_id = ?'
    ).get(req.params.id, userId) as Note | undefined;
    
    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Auto-create version snapshot before updating
    // Only create version if title or content actually changed
    const titleChanged = title !== undefined && title !== existing.title;
    const contentChanged = content !== undefined && content !== existing.content;
    
    if (titleChanged || contentChanged) {
      await createVersion(
        req.params.id,
        title !== undefined ? title : existing.title,
        content !== undefined ? content : existing.content,
        userId
      );
    }

    const now = Date.now();
    
    const update = db.prepare(`
      UPDATE notes 
      SET title = COALESCE(?, title),
          content = COALESCE(?, content),
          updated_at = ?
      WHERE id = ? AND user_id = ?
    `);

    update.run(title, content, now, req.params.id, userId);

    // Update tags if provided
    if (tags) {
      // Remove existing tags
      db.prepare('DELETE FROM note_tags WHERE note_id = ?').run(req.params.id);
      // Add new tags
      addTagsToNote(db, req.params.id, tags);
    }

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id) as Note;
    res.json(note);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete note
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.userId;
    
    // Verify note belongs to user
    const existing = db.prepare(
      'SELECT * FROM notes WHERE id = ? AND user_id = ?'
    ).get(req.params.id, userId);
    
    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }

    db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to add tags to a note
function addTagsToNote(db: Database.Database, noteId: string, tagNames: string[]): void {
  const insertTag = db.prepare('INSERT OR IGNORE INTO tags (id, name, created_at) VALUES (?, ?, ?)');
  const linkTag = db.prepare('INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)');

  for (const tagName of tagNames) {
    const tagId = uuidv4();
    insertTag.run(tagId, tagName.toLowerCase(), Date.now());
    
    const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName.toLowerCase()) as { id: string } | undefined;
    if (tag) {
      linkTag.run(noteId, tag.id);
    }
  }
}

export default router;
