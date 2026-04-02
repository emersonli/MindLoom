/**
 * 文件上传模块单元测试
 * P1-03: 文件/图片上传
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { initDatabase, closeDatabase, getDb } from '../src/models/database';
import * as fileService from '../src/services/file.service';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, ALLOWED_EXTENSIONS } from '../src/models/file';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// 测试环境配置
process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';

describe('File Service', () => {
  let testUserId: string;
  let testNoteId: string;

  beforeAll(() => {
    initDatabase();

    // 创建测试用户（使用唯一邮箱避免冲突）
    const db = getDb();
    testUserId = uuidv4();
    testNoteId = uuidv4();
    
    const now = Date.now();
    const testEmail = `test-file-${Date.now()}@example.com`;
    
    db.prepare(`
      INSERT INTO users (id, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(testUserId, testEmail, 'hash', now, now);

    // 创建测试笔记
    db.prepare(`
      INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(testNoteId, 'Test Note for Files', 'Content', now, now, testUserId);

    // 确保上传目录存在（包括 temp 目录）
    fileService.ensureUploadDir();
    const tempDir = path.join(process.cwd(), 'uploads', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterAll(() => {
    // 清理测试文件
    const uploadDir = path.join(process.cwd(), 'uploads', 'files');
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      files.forEach(file => {
        const filePath = path.join(uploadDir, file);
        if (file.includes('test-')) {
          fs.unlinkSync(filePath);
        }
      });
    }

    closeDatabase();
  });

  describe('validateFileType', () => {
    it('should allow valid image types', () => {
      expect(fileService.validateFileType('image/jpeg', 'test.jpg')).toBe(true);
      expect(fileService.validateFileType('image/png', 'test.png')).toBe(true);
      expect(fileService.validateFileType('image/gif', 'test.gif')).toBe(true);
      expect(fileService.validateFileType('image/webp', 'test.webp')).toBe(true);
    });

    it('should allow valid document types', () => {
      expect(fileService.validateFileType('application/pdf', 'test.pdf')).toBe(true);
    });

    it('should reject invalid mime types', () => {
      expect(fileService.validateFileType('text/plain', 'test.txt')).toBe(false);
      expect(fileService.validateFileType('application/zip', 'test.zip')).toBe(false);
      expect(fileService.validateFileType('video/mp4', 'test.mp4')).toBe(false);
    });

    it('should reject invalid extensions', () => {
      expect(fileService.validateFileType('image/jpeg', 'test.txt')).toBe(false);
      expect(fileService.validateFileType('image/png', 'test.exe')).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('should allow files within size limit', () => {
      expect(fileService.validateFileSize(1024)).toBe(true); // 1KB
      expect(fileService.validateFileSize(1024 * 1024)).toBe(true); // 1MB
      expect(fileService.validateFileSize(MAX_FILE_SIZE)).toBe(true); // 10MB
    });

    it('should reject files exceeding size limit', () => {
      expect(fileService.validateFileSize(MAX_FILE_SIZE + 1)).toBe(false);
      expect(fileService.validateFileSize(20 * 1024 * 1024)).toBe(false); // 20MB
    });
  });

  describe('generateSafeFilename', () => {
    it('should generate UUID-based filename with original extension', () => {
      const filename = fileService.generateSafeFilename('my-photo.jpg');
      expect(filename).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/i);
    });

    it('should preserve extension case-insensitively', () => {
      const filename = fileService.generateSafeFilename('test.PNG');
      expect(filename).toMatch(/\.png$/i);
    });
  });

  describe('uploadFile', () => {
    it('should upload a valid file successfully', () => {
      const db = getDb();
      
      // 创建测试文件
      const testFilename = `test-upload-${Date.now()}.png`;
      const testFilePath = path.join(process.cwd(), 'uploads', 'temp', testFilename);
      
      // 创建简单的 PNG 文件（1x1 pixel）
      const pngHeader = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
        0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,
        0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
        0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
        0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      
      fs.writeFileSync(testFilePath, pngHeader);

      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test-image.png',
        encoding: '7bit',
        mimetype: 'image/png',
        path: testFilePath,
        size: pngHeader.length,
        filename: testFilename,
        destination: path.join(process.cwd(), 'uploads', 'temp'),
        buffer: pngHeader,
        stream: undefined as any,
      };

      const fileRecord = fileService.uploadFile(mockFile, testNoteId, testUserId);

      expect(fileRecord.id).toBeDefined();
      expect(fileRecord.note_id).toBe(testNoteId);
      expect(fileRecord.original_name).toBe('test-image.png');
      expect(fileRecord.mime_type).toBe('image/png');
      expect(fileRecord.size).toBe(pngHeader.length);

      // 验证文件已移动到正式目录
      expect(fs.existsSync(fileRecord.path)).toBe(true);

      // 清理
      if (fs.existsSync(fileRecord.path)) {
        fs.unlinkSync(fileRecord.path);
      }
      db.prepare('DELETE FROM files WHERE id = ?').run(fileRecord.id);
    });

    it('should reject file with invalid type', () => {
      const testFilePath = path.join(process.cwd(), 'uploads', 'temp', `test-${Date.now()}.txt`);
      fs.writeFileSync(testFilePath, 'test content');

      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        path: testFilePath,
        size: 12,
        filename: path.basename(testFilePath),
        destination: path.join(process.cwd(), 'uploads', 'temp'),
        buffer: Buffer.from('test content'),
        stream: undefined as any,
      };

      expect(() => {
        fileService.uploadFile(mockFile, testNoteId, testUserId);
      }).toThrow('File type not allowed');

      // 清理
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    it('should reject file for non-existent note', () => {
      const testFilePath = path.join(process.cwd(), 'uploads', 'temp', `test-${Date.now()}.png`);
      fs.writeFileSync(testFilePath, 'fake png');

      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        path: testFilePath,
        size: 8,
        filename: path.basename(testFilePath),
        destination: path.join(process.cwd(), 'uploads', 'temp'),
        buffer: Buffer.from('fake png'),
        stream: undefined as any,
      };

      expect(() => {
        fileService.uploadFile(mockFile, 'non-existent-note-id', testUserId);
      }).toThrow('Note not found');

      // 清理
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    it('should reject file for note belonging to different user', () => {
      const db = getDb();
      const otherUserId = uuidv4();
      const otherNoteId = uuidv4();
      const now = Date.now();
      const otherEmail = `other-${Date.now()}@example.com`;

      // 创建另一个用户的笔记
      db.prepare(`
        INSERT INTO users (id, email, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(otherUserId, otherEmail, 'hash', now, now);

      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(otherNoteId, 'Other Note', 'Content', now, now, otherUserId);

      const testFilePath = path.join(process.cwd(), 'uploads', 'temp', `test-${Date.now()}.png`);
      fs.writeFileSync(testFilePath, 'fake png');

      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        path: testFilePath,
        size: 8,
        filename: path.basename(testFilePath),
        destination: path.join(process.cwd(), 'uploads', 'temp'),
        buffer: Buffer.from('fake png'),
        stream: undefined as any,
      };

      expect(() => {
        fileService.uploadFile(mockFile, otherNoteId, testUserId);
      }).toThrow('Note not found or access denied');

      // 清理
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
      db.prepare('DELETE FROM notes WHERE id = ?').run(otherNoteId);
      db.prepare('DELETE FROM users WHERE id = ?').run(otherUserId);
    });
  });

  describe('getFile', () => {
    it('should return file info for valid file', () => {
      const db = getDb();
      const fileId = uuidv4();
      const now = Date.now();
      const testFilename = `test-get-${Date.now()}.png`;
      const testPath = path.join(process.cwd(), 'uploads', 'files', testFilename);

      // 创建测试文件
      fs.writeFileSync(testPath, 'fake png content');

      db.prepare(`
        INSERT INTO files (id, note_id, filename, original_name, mime_type, size, path, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(fileId, testNoteId, testFilename, 'test.png', 'image/png', 16, testPath, now);

      const file = fileService.getFile(fileId, testUserId);

      expect(file).not.toBeNull();
      expect(file!.id).toBe(fileId);
      expect(file!.original_name).toBe('test.png');

      // 清理
      db.prepare('DELETE FROM files WHERE id = ?').run(fileId);
      if (fs.existsSync(testPath)) {
        fs.unlinkSync(testPath);
      }
    });

    it('should return null for non-existent file', () => {
      const file = fileService.getFile('non-existent-id', testUserId);
      expect(file).toBeNull();
    });

    it('should return null for file belonging to different user', () => {
      const db = getDb();
      const otherUserId = uuidv4();
      const otherNoteId = uuidv4();
      const fileId = uuidv4();
      const now = Date.now();
      const testFilename = `test-other-${Date.now()}.png`;
      const testPath = path.join(process.cwd(), 'uploads', 'files', testFilename);
      const otherEmail2 = `other2-${Date.now()}@example.com`;

      // 创建另一个用户的笔记和文件
      db.prepare(`
        INSERT INTO users (id, email, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(otherUserId, otherEmail2, 'hash', now, now);

      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(otherNoteId, 'Other Note 2', 'Content', now, now, otherUserId);

      fs.writeFileSync(testPath, 'fake png content');

      db.prepare(`
        INSERT INTO files (id, note_id, filename, original_name, mime_type, size, path, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(fileId, otherNoteId, testFilename, 'test.png', 'image/png', 16, testPath, now);

      const file = fileService.getFile(fileId, testUserId);
      expect(file).toBeNull();

      // 清理
      db.prepare('DELETE FROM files WHERE id = ?').run(fileId);
      db.prepare('DELETE FROM notes WHERE id = ?').run(otherNoteId);
      db.prepare('DELETE FROM users WHERE id = ?').run(otherUserId);
      if (fs.existsSync(testPath)) {
        fs.unlinkSync(testPath);
      }
    });
  });

  describe('getFilesByNoteId', () => {
    it('should return all files for a note', () => {
      const db = getDb();
      const fileId1 = uuidv4();
      const fileId2 = uuidv4();
      const now = Date.now();
      const testFilename1 = `test-list-1-${Date.now()}.png`;
      const testFilename2 = `test-list-2-${Date.now()}.png`;
      const testPath1 = path.join(process.cwd(), 'uploads', 'files', testFilename1);
      const testPath2 = path.join(process.cwd(), 'uploads', 'files', testFilename2);

      fs.writeFileSync(testPath1, 'fake png 1');
      fs.writeFileSync(testPath2, 'fake png 2');

      db.prepare(`
        INSERT INTO files (id, note_id, filename, original_name, mime_type, size, path, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(fileId1, testNoteId, testFilename1, 'test1.png', 'image/png', 10, testPath1, now);

      db.prepare(`
        INSERT INTO files (id, note_id, filename, original_name, mime_type, size, path, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(fileId2, testNoteId, testFilename2, 'test2.png', 'image/png', 10, testPath2, now);

      const files = fileService.getFilesByNoteId(testNoteId, testUserId);

      expect(files.length).toBe(2);

      // 清理
      db.prepare('DELETE FROM files WHERE id IN (?, ?)').run(fileId1, fileId2);
      if (fs.existsSync(testPath1)) fs.unlinkSync(testPath1);
      if (fs.existsSync(testPath2)) fs.unlinkSync(testPath2);
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', () => {
      const db = getDb();
      const fileId = uuidv4();
      const now = Date.now();
      const testFilename = `test-delete-${Date.now()}.png`;
      const testPath = path.join(process.cwd(), 'uploads', 'files', testFilename);

      fs.writeFileSync(testPath, 'fake png content');

      db.prepare(`
        INSERT INTO files (id, note_id, filename, original_name, mime_type, size, path, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(fileId, testNoteId, testFilename, 'test.png', 'image/png', 16, testPath, now);

      // 验证文件存在
      expect(fs.existsSync(testPath)).toBe(true);

      // 删除文件
      fileService.deleteFile(fileId, testUserId);

      // 验证文件已删除
      expect(fs.existsSync(testPath)).toBe(false);

      // 验证数据库记录已删除
      const fileInDb = db.prepare('SELECT id FROM files WHERE id = ?').get(fileId);
      expect(fileInDb).toBeUndefined();
    });

    it('should throw error for non-existent file', () => {
      expect(() => {
        fileService.deleteFile('non-existent-id', testUserId);
      }).toThrow('File not found or access denied');
    });
  });
});
