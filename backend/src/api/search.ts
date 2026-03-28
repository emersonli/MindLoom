import { Router, Request, Response } from 'express';
import { getDb } from '../models/database';
import { Note } from '../models/note';

const router = Router();

// Search notes by keyword
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { q, tag } = req.query;

    if (!q && !tag) {
      return res.status(400).json({ error: 'Search query (q) or tag is required' });
    }

    let query = `
      SELECT DISTINCT n.* FROM notes n
      LEFT JOIN note_tags nt ON n.id = nt.note_id
      LEFT JOIN tags t ON nt.tag_id = t.id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (q) {
      query += ` AND (n.title LIKE ? OR n.content LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`);
    }

    if (tag) {
      query += ` AND t.name = ?`;
      params.push(tag);
    }

    query += ` ORDER BY n.updated_at DESC`;

    const notes = db.prepare(query).all(...params) as Note[];
    res.json(notes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
