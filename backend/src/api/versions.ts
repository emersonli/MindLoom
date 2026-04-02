import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  createVersion,
  getVersionsByNoteId,
  getVersionById,
  restoreVersion,
} from '../models/noteVersion';
import { getDb } from '../models/database';

const router = Router();

/**
 * GET /api/versions/notes/:noteId
 * 获取笔记的所有版本
 */
router.get('/notes/:noteId/versions', authMiddleware, (req: Request, res: Response) => {
  try {
    const { noteId } = req.params;
    const userId = (req as any).user.userId;
    
    const db = getDb();
    // 验证笔记属于当前用户
    const note = db.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?').get(noteId, userId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found or access denied' });
    }
    
    const versions = getVersionsByNoteId(noteId);
    res.json(versions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/versions/:versionId
 * 获取特定版本详情
 */
router.get('/versions/:versionId', authMiddleware, (req: Request, res: Response) => {
  try {
    const { versionId } = req.params;
    const userId = (req as any).user.userId;
    
    const version = getVersionById(versionId);
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    // 验证版本所属笔记属于当前用户
    const db = getDb();
    const note = db.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?').get(version.note_id, userId);
    if (!note) {
      return res.status(403).json({ error: 'Access denied to this version' });
    }
    
    res.json(version);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/versions/:versionId/restore
 * 恢复版本
 */
router.post('/versions/:versionId/restore', authMiddleware, (req: Request, res: Response) => {
  try {
    const { versionId } = req.params;
    const { noteId } = req.body;
    const userId = (req as any).user.userId;
    
    if (!noteId) {
      return res.status(400).json({ error: 'noteId required' });
    }
    
    const db = getDb();
    // 验证笔记属于当前用户
    const note = db.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?').get(noteId, userId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found or access denied' });
    }
    
    const version = getVersionById(versionId);
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    // 验证版本属于指定笔记
    if (version.note_id !== noteId) {
      return res.status(400).json({ error: 'Version does not belong to the specified note' });
    }
    
    restoreVersion(versionId, noteId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
