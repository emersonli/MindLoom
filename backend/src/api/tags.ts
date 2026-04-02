import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../models/database';
import { Tag, CreateTagDTO } from '../models/note';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all tags (with count of user's own notes)
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.userId;
    
    const tags = db.prepare('SELECT * FROM tags ORDER BY name').all() as Tag[];
    
    // Count notes for each tag (only user's notes)
    const tagsWithCount = tags.map(tag => {
      const count = db.prepare(
        `SELECT COUNT(*) as count FROM note_tags nt
         JOIN notes n ON nt.note_id = n.id
         WHERE nt.tag_id = ? AND n.user_id = ?`
      ).get(tag.id, userId) as { count: number };
      
      return {
        ...tag,
        noteCount: count.count
      };
    });
    
    res.json(tagsWithCount);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get tag by ID with notes (user's own notes only)
router.get('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.userId;
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id) as Tag | undefined;
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Get notes with this tag (only user's notes)
    const notes = db.prepare(`
      SELECT n.* FROM notes n
      JOIN note_tags nt ON n.id = nt.note_id
      WHERE nt.tag_id = ? AND n.user_id = ?
      ORDER BY n.updated_at DESC
    `).all(req.params.id, userId);

    res.json({ ...tag, notes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new tag
router.post('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { name, color }: CreateTagDTO = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    // Check if tag already exists
    const existing = db.prepare('SELECT id FROM tags WHERE name = ?').get(name.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'Tag already exists' });
    }

    const id = uuidv4();
    const now = Date.now();

    db.prepare('INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)')
      .run(id, name.toLowerCase(), color || null, now);

    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as Tag;
    res.status(201).json(tag);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update tag
router.put('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { name, color }: CreateTagDTO = req.body;

    const existing = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    db.prepare('UPDATE tags SET name = COALESCE(?, name), color = COALESCE(?, color) WHERE id = ?')
      .run(name?.toLowerCase(), color, req.params.id);

    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id) as Tag;
    res.json(tag);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete tag
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    
    const existing = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
