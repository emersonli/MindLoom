import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.middleware';
import * as fileService from '../services/file.service';
import { MAX_FILE_SIZE } from '../models/file';

const router = Router();

// 配置 multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 临时存储目录，文件验证后会移动到正式目录
    cb(null, 'uploads/temp/');
  },
  filename: (req, file, cb) => {
    // 使用 UUID 作为临时文件名
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 在 service 层进行更严格的验证
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

// 确保临时目录存在
import fs from 'fs';
const tempDir = path.join(process.cwd(), 'uploads', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * POST /api/files/upload
 * 上传文件
 * 
 * 请求：multipart/form-data
 * - file: 文件
 * - noteId: 关联的笔记 ID
 */
router.post('/upload', authMiddleware, upload.single('file'), (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { noteId } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    if (!noteId) {
      return res.status(400).json({ error: 'noteId is required' });
    }

    const userId = req.user!.userId;
    const fileRecord = fileService.uploadFile(file, noteId, userId);

    res.status(201).json({
      id: fileRecord.id,
      filename: fileRecord.filename,
      originalName: fileRecord.original_name,
      mimeType: fileRecord.mime_type,
      size: fileRecord.size,
      url: `/api/files/${fileRecord.id}`,
      createdAt: fileRecord.created_at,
    });
  } catch (error: any) {
    // 清理上传失败的文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (error.message.includes('File type not allowed')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('File size exceeds')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('Note not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/files/:id
 * 获取/下载文件
 */
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const fileId = req.params.id;

    const file = fileService.getFile(fileId, userId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // 检查文件是否存在
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // 设置响应头
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);
    res.setHeader('Content-Length', file.size);

    // 发送文件
    res.sendFile(file.path);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/files/note/:noteId
 * 获取笔记的所有文件
 */
router.get('/note/:noteId', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const noteId = req.params.noteId;

    const files = fileService.getFilesByNoteId(noteId, userId);

    res.json(files.map(file => ({
      id: file.id,
      filename: file.filename,
      originalName: file.original_name,
      mimeType: file.mime_type,
      size: file.size,
      url: `/api/files/${file.id}`,
      createdAt: file.created_at,
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/files/:id
 * 删除文件
 */
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const fileId = req.params.id;

    fileService.deleteFile(fileId, userId);
    res.status(204).send();
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
