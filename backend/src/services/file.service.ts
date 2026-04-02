import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { getDb } from '../models/database';
import { FileRecord, UploadFileDTO, ALLOWED_MIME_TYPES, MAX_FILE_SIZE, ALLOWED_EXTENSIONS } from '../models/file';

// 上传目录配置
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const FILES_SUBDIR = 'files';

/**
 * 确保上传目录存在
 */
export function ensureUploadDir(): void {
  const uploadPath = path.join(UPLOAD_DIR, FILES_SUBDIR);
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
}

/**
 * 验证文件类型
 */
export function validateFileType(mimeType: string, originalName: string): boolean {
  // 检查 MIME 类型
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return false;
  }

  // 检查扩展名
  const ext = path.extname(originalName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return false;
  }

  return true;
}

/**
 * 验证文件大小
 */
export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

/**
 * 生成安全的文件名
 */
export function generateSafeFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const uuid = uuidv4();
  return `${uuid}${ext}`;
}

/**
 * 上传文件
 */
export function uploadFile(file: Express.Multer.File, noteId: string, userId: string): FileRecord {
  const db = getDb();

  // 验证文件类型
  if (!validateFileType(file.mimetype, file.originalname)) {
    throw new Error('File type not allowed. Allowed types: images (jpg, png, gif, webp) and PDF');
  }

  // 验证文件大小
  if (!validateFileSize(file.size)) {
    throw new Error(`File size exceeds limit. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // 验证 note 是否存在且属于当前用户
  const note = db.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?').get(noteId, userId);
  if (!note) {
    throw new Error('Note not found or access denied');
  }

  // 生成安全的文件名
  const safeFilename = generateSafeFilename(file.originalname);
  const uploadPath = path.join(UPLOAD_DIR, FILES_SUBDIR, safeFilename);

  // 确保上传目录存在
  ensureUploadDir();

  // 移动文件到上传目录
  fs.renameSync(file.path, uploadPath);

  // 创建文件记录
  const id = uuidv4();
  const now = Date.now();

  const fileRecord: UploadFileDTO = {
    note_id: noteId,
    filename: safeFilename,
    original_name: file.originalname,
    mime_type: file.mimetype,
    size: file.size,
    path: uploadPath,
  };

  db.prepare(`
    INSERT INTO files (id, note_id, filename, original_name, mime_type, size, path, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, fileRecord.note_id, fileRecord.filename, fileRecord.original_name, 
         fileRecord.mime_type, fileRecord.size, fileRecord.path, now);

  return {
    id,
    ...fileRecord,
    created_at: now,
  };
}

/**
 * 获取文件信息
 */
export function getFile(fileId: string, userId: string): FileRecord | null {
  const db = getDb();

  // 获取文件并验证用户权限（通过 note 的 user_id）
  const file = db.prepare(`
    SELECT f.* FROM files f
    JOIN notes n ON f.note_id = n.id
    WHERE f.id = ? AND n.user_id = ?
  `).get(fileId, userId) as FileRecord | undefined;

  return file || null;
}

/**
 * 获取笔记的所有文件
 */
export function getFilesByNoteId(noteId: string, userId: string): FileRecord[] {
  const db = getDb();

  // 验证 note 属于当前用户
  const note = db.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?').get(noteId, userId);
  if (!note) {
    return [];
  }

  return db.prepare('SELECT * FROM files WHERE note_id = ? ORDER BY created_at DESC').all(noteId) as FileRecord[];
}

/**
 * 删除文件
 */
export function deleteFile(fileId: string, userId: string): void {
  const db = getDb();

  // 获取文件并验证用户权限
  const file = db.prepare(`
    SELECT f.* FROM files f
    JOIN notes n ON f.note_id = n.id
    WHERE f.id = ? AND n.user_id = ?
  `).get(fileId, userId) as FileRecord | undefined;

  if (!file) {
    throw new Error('File not found or access denied');
  }

  // 删除物理文件
  if (fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }

  // 删除数据库记录
  db.prepare('DELETE FROM files WHERE id = ?').run(fileId);
}

/**
 * 获取文件访问 URL
 */
export function getFileUrl(fileId: string): string {
  return `/api/files/${fileId}`;
}

export default {
  uploadFile,
  getFile,
  getFilesByNoteId,
  deleteFile,
  getFileUrl,
  validateFileType,
  validateFileSize,
  generateSafeFilename,
  ensureUploadDir,
};
