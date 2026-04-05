/**
 * File Service 单元测试
 * P3-01: 后端单元测试 - Services 模块
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { initDatabase, closeDatabase, getDb } from '../src/models/database';
import { v4 as uuidv4 } from 'uuid';
import * as fileService from '../src/services/file.service';
import path from 'path';
import fs from 'fs';

describe('File Service', () => {
  let testUserId: string;
  let testNoteId: string;

  beforeAll(() => {
    initDatabase();
    
    testUserId = uuidv4();
    const db = getDb();
    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(testUserId, 'test-files@example.com', 'hash', Date.now(), Date.now());
  });

  afterAll(() => {
    closeDatabase();
  });

  beforeEach(() => {
    // 清理测试数据
    const db = getDb();
    db.prepare('DELETE FROM files WHERE note_id IN (SELECT id FROM notes WHERE user_id = ?)').run(testUserId);
    db.prepare('DELETE FROM notes WHERE user_id = ?').run(testUserId);
    
    // 创建测试笔记
    testNoteId = uuidv4();
    const now = Date.now();
    db.prepare(`
      INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(testNoteId, 'File Test Note', 'Content', now, now, testUserId);
  });

  describe('validateFileType', () => {
    it('should allow valid image types', () => {
      expect(fileService.validateFileType('image/jpeg', 'photo.jpg')).toBe(true);
      expect(fileService.validateFileType('image/png', 'image.png')).toBe(true);
      expect(fileService.validateFileType('image/gif', 'animation.gif')).toBe(true);
      expect(fileService.validateFileType('image/webp', 'picture.webp')).toBe(true);
    });

    it('should allow PDF files', () => {
      expect(fileService.validateFileType('application/pdf', 'document.pdf')).toBe(true);
    });

    it('should reject invalid MIME types', () => {
      expect(fileService.validateFileType('text/plain', 'file.txt')).toBe(false);
      expect(fileService.validateFileType('application/zip', 'archive.zip')).toBe(false);
      expect(fileService.validateFileType('video/mp4', 'video.mp4')).toBe(false);
    });

    it('should reject mismatched extension', () => {
      // MIME type 是图片但扩展名不对
      expect(fileService.validateFileType('image/jpeg', 'file.txt')).toBe(false);
    });

    it('should handle case-insensitive extensions', () => {
      expect(fileService.validateFileType('image/jpeg', 'photo.JPG')).toBe(true);
      expect(fileService.validateFileType('image/png', 'image.PNG')).toBe(true);
      expect(fileService.validateFileType('application/pdf', 'doc.PDF')).toBe(true);
    });
  });

  describe('validateFileSize', () => {
    it('should accept files under size limit', () => {
      // MAX_FILE_SIZE is typically 10MB = 10 * 1024 * 1024 bytes
      const maxFileSize = 10 * 1024 * 1024;
      
      expect(fileService.validateFileSize(1024)).toBe(true); // 1KB
      expect(fileService.validateFileSize(1024 * 1024)).toBe(true); // 1MB
      expect(fileService.validateFileSize(5 * 1024 * 1024)).toBe(true); // 5MB
      expect(fileService.validateFileSize(maxFileSize)).toBe(true); // Exactly at limit
    });

    it('should reject files over size limit', () => {
      const maxFileSize = 10 * 1024 * 1024;
      
      expect(fileService.validateFileSize(maxFileSize + 1)).toBe(false);
      expect(fileService.validateFileSize(15 * 1024 * 1024)).toBe(false); // 15MB
      expect(fileService.validateFileSize(100 * 1024 * 1024)).toBe(false); // 100MB
    });
  });

  describe('generateSafeFilename', () => {
    it('should generate UUID-based filename with original extension', () => {
      const filename = fileService.generateSafeFilename('my-photo.jpg');
      
      expect(filename).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/i);
    });

    it('should normalize extension to lowercase', () => {
      const filename = fileService.generateSafeFilename('image.PNG');
      expect(filename).toMatch(/\.png$/);
    });

    it('should handle files without extension', () => {
      const filename = fileService.generateSafeFilename('noextension');
      expect(filename).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should generate unique filenames', () => {
      const filename1 = fileService.generateSafeFilename('test.jpg');
      const filename2 = fileService.generateSafeFilename('test.jpg');
      
      expect(filename1).not.toBe(filename2);
    });
  });

  describe('ensureUploadDir', () => {
    it('should create upload directory if not exists', () => {
      const uploadPath = path.join(process.cwd(), 'uploads', 'files');
      
      // 确保目录存在（可能之前测试已创建）
      fileService.ensureUploadDir();
      
      expect(fs.existsSync(uploadPath)).toBe(true);
    });
  });

  describe('getFile', () => {
    it('should return null for non-existent file', () => {
      const file = fileService.getFile('non-existent-id', testUserId);
      expect(file).toBeNull();
    });

    it('should return null for file belonging to another user', () => {
      const db = getDb();
      const otherUserId = uuidv4();
      const otherNoteId = uuidv4();
      const fileId = uuidv4();
      const now = Date.now();
      
      // 创建其他用户和笔记
      db.prepare(`
        INSERT OR IGNORE INTO users (id, email, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(otherUserId, 'other-file@example.com', 'hash', now, now);
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(otherNoteId, 'Other Note', 'Content', now, now, otherUserId);
      
      db.prepare(`
        INSERT INTO files (id, note_id, filename, original_name, mime_type, size, path, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(fileId, otherNoteId, 'file.jpg', 'original.jpg', 'image/jpeg', 1024, '/path', now);

      // 测试用户无法访问
      const file = fileService.getFile(fileId, testUserId);
      expect(file).toBeNull();
    });
  });

  describe('getFilesByNoteId', () => {
    it('should return empty array for note with no files', () => {
      const files = fileService.getFilesByNoteId(testNoteId, testUserId);
      expect(files).toEqual([]);
    });

    it('should return empty array for non-existent note', () => {
      const files = fileService.getFilesByNoteId('non-existent', testUserId);
      expect(files).toEqual([]);
    });

    it('should return files ordered by created_at DESC', () => {
      const db = getDb();
      const now = Date.now();
      
      // 创建多个文件
      const file1Id = uuidv4();
      const file2Id = uuidv4();
      const file3Id = uuidv4();
      
      db.prepare(`
        INSERT INTO files (id, note_id, filename, original_name, mime_type, size, path, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(file1Id, testNoteId, 'file1.jpg', '1.jpg', 'image/jpeg', 1024, '/path1', now - 2000);
      
      db.prepare(`
        INSERT INTO files (id, note_id, filename, original_name, mime_type, size, path, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(file2Id, testNoteId, 'file2.jpg', '2.jpg', 'image/jpeg', 2048, '/path2', now - 1000);
      
      db.prepare(`
        INSERT INTO files (id, note_id, filename, original_name, mime_type, size, path, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(file3Id, testNoteId, 'file3.jpg', '3.jpg', 'image/jpeg', 3072, '/path3', now);

      const files = fileService.getFilesByNoteId(testNoteId, testUserId);
      
      expect(files.length).toBe(3);
      expect(files[0].filename).toBe('file3.jpg'); // Most recent first
      expect(files[2].filename).toBe('file1.jpg'); // Oldest last
    });
  });

  describe('deleteFile', () => {
    it('should throw error for non-existent file', () => {
      expect(() => fileService.deleteFile('non-existent', testUserId))
        .toThrow('File not found or access denied');
    });

    it('should throw error for file belonging to another user', () => {
      const db = getDb();
      const otherUserId = uuidv4();
      const otherNoteId = uuidv4();
      const fileId = uuidv4();
      const now = Date.now();
      
      db.prepare(`
        INSERT OR IGNORE INTO users (id, email, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(otherUserId, 'other-delete@example.com', 'hash', now, now);
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(otherNoteId, 'Other Note', 'Content', now, now, otherUserId);
      
      db.prepare(`
        INSERT INTO files (id, note_id, filename, original_name, mime_type, size, path, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(fileId, otherNoteId, 'file.jpg', 'original.jpg', 'image/jpeg', 1024, '/path', now);

      expect(() => fileService.deleteFile(fileId, testUserId))
        .toThrow('File not found or access denied');
    });
  });

  describe('getFileUrl', () => {
    it('should return correct API URL for file', () => {
      const fileId = uuidv4();
      const url = fileService.getFileUrl(fileId);
      
      expect(url).toBe(`/api/files/${fileId}`);
    });
  });
});
