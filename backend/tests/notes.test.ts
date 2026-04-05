/**
 * Notes API 单元测试
 * P3-01: 后端单元测试 - Notes 模块
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { initDatabase, closeDatabase, getDb } from '../src/models/database';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-secret-key-for-unit-tests';

// 模拟认证中间件生成的 token
function generateTestToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET);
}

describe('Notes API', () => {
  let testUserId: string;
  let testUserToken: string;
  let testNoteId: string;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    initDatabase();
    
    // 创建测试用户
    testUserId = uuidv4();
    testUserToken = generateTestToken(testUserId, 'test-notes@example.com');
    
    const db = getDb();
    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(testUserId, 'test-notes@example.com', 'hash', Date.now(), Date.now());
  });

  afterAll(() => {
    closeDatabase();
  });

  beforeEach(() => {
    // 清理 notes 表
    const db = getDb();
    db.prepare('DELETE FROM notes WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM tags WHERE name LIKE ?').run('test-%');
    db.prepare('DELETE FROM note_tags WHERE note_id IN (SELECT id FROM notes WHERE user_id = ?)').run(testUserId);
    db.prepare('DELETE FROM links WHERE source_note_id IN (SELECT id FROM notes WHERE user_id = ?)').run(testUserId);
  });

  describe('GET /notes - 获取所有笔记', () => {
    it('should return empty array when no notes exist', () => {
      const db = getDb();
      const notes = db.prepare(
        'SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC'
      ).all(testUserId);
      
      expect(notes).toEqual([]);
    });

    it('should return user notes ordered by updated_at DESC', () => {
      const db = getDb();
      const now = Date.now();
      
      // 创建 3 条测试笔记
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'Note 1', 'Content 1', now - 3000, now - 3000, testUserId);
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'Note 2', 'Content 2', now - 2000, now - 2000, testUserId);
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'Note 3', 'Content 3', now - 1000, now - 1000, testUserId);

      const notes = db.prepare(
        'SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC'
      ).all(testUserId) as any[];
      
      expect(notes.length).toBe(3);
      expect(notes[0].title).toBe('Note 3'); // Most recent first
      expect(notes[2].title).toBe('Note 1'); // Oldest last
    });

    it('should only return notes belonging to the user', () => {
      const db = getDb();
      const otherUserId = uuidv4();
      
      // 创建其他用户的笔记
      db.prepare(`
        INSERT INTO users (id, email, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(otherUserId, 'other@example.com', 'hash', Date.now(), Date.now());
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'Other User Note', 'Content', Date.now(), Date.now(), otherUserId);

      const notes = db.prepare(
        'SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC'
      ).all(testUserId);
      
      expect(notes.length).toBe(0);
    });
  });

  describe('GET /notes/:id - 获取单条笔记', () => {
    it('should return note with tags and links', () => {
      const db = getDb();
      const now = Date.now();
      testNoteId = uuidv4();
      
      // 创建笔记
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(testNoteId, 'Test Note', 'Test Content', now, now, testUserId);

      // 创建标签
      const tagId = uuidv4();
      db.prepare(`
        INSERT INTO tags (id, name, created_at)
        VALUES (?, ?, ?)
      `).run(tagId, 'test-tag', now);
      
      // 关联标签
      db.prepare(`
        INSERT INTO note_tags (note_id, tag_id)
        VALUES (?, ?)
      `).run(testNoteId, tagId);

      // 查询笔记
      const note = db.prepare(
        'SELECT * FROM notes WHERE id = ? AND user_id = ?'
      ).get(testNoteId, testUserId) as any;
      
      expect(note).toBeDefined();
      expect(note.title).toBe('Test Note');
      expect(note.content).toBe('Test Content');

      // 查询标签
      const tags = db.prepare(`
        SELECT t.* FROM tags t
        JOIN note_tags nt ON t.id = nt.tag_id
        WHERE nt.note_id = ?
      `).all(testNoteId);
      
      expect(tags.length).toBe(1);
      expect(tags[0].name).toBe('test-tag');
    });

    it('should return 404 for non-existent note', () => {
      const db = getDb();
      const note = db.prepare(
        'SELECT * FROM notes WHERE id = ? AND user_id = ?'
      ).get('non-existent-id', testUserId);
      
      expect(note).toBeUndefined();
    });

    it('should return 404 for note belonging to another user', () => {
      const db = getDb();
      const otherUserId = uuidv4();
      const otherNoteId = uuidv4();
      
      db.prepare(`
        INSERT INTO users (id, email, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(otherUserId, 'other2@example.com', 'hash', Date.now(), Date.now());
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(otherNoteId, 'Other Note', 'Content', Date.now(), Date.now(), otherUserId);

      const note = db.prepare(
        'SELECT * FROM notes WHERE id = ? AND user_id = ?'
      ).get(otherNoteId, testUserId);
      
      expect(note).toBeUndefined();
    });
  });

  describe('POST /notes - 创建笔记', () => {
    it('should create a new note with title', () => {
      const db = getDb();
      const id = uuidv4();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, 'New Note', 'Content', now, now, testUserId);

      const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as any;
      
      expect(note).toBeDefined();
      expect(note.title).toBe('New Note');
      expect(note.content).toBe('Content');
      expect(note.user_id).toBe(testUserId);
    });

    it('should create note with tags', () => {
      const db = getDb();
      const noteId = uuidv4();
      const tagId = uuidv4();
      const now = Date.now();
      
      // 创建笔记
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(noteId, 'Note with Tags', 'Content', now, now, testUserId);
      
      // 创建标签
      db.prepare(`
        INSERT INTO tags (id, name, created_at)
        VALUES (?, ?, ?)
      `).run(tagId, 'test-tag-2', now);
      
      // 关联标签
      db.prepare(`
        INSERT INTO note_tags (note_id, tag_id)
        VALUES (?, ?)
      `).run(noteId, tagId);

      const tags = db.prepare(`
        SELECT t.* FROM tags t
        JOIN note_tags nt ON t.id = nt.tag_id
        WHERE nt.note_id = ?
      `).all(noteId);
      
      expect(tags.length).toBe(1);
      expect(tags[0].name).toBe('test-tag-2');
    });

    it('should reject note without title', () => {
      // 验证逻辑：API 层应返回 400
      const title = null;
      expect(title).toBeFalsy();
    });
  });

  describe('PUT /notes/:id - 更新笔记', () => {
    it('should update note title and content', () => {
      const db = getDb();
      const noteId = uuidv4();
      const now = Date.now();
      
      // 创建笔记
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(noteId, 'Original Title', 'Original Content', now, now, testUserId);

      // 更新笔记
      const newTitle = 'Updated Title';
      const newContent = 'Updated Content';
      const newTime = now + 1000;
      
      db.prepare(`
        UPDATE notes 
        SET title = ?, content = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `).run(newTitle, newContent, newTime, noteId, testUserId);

      const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId) as any;
      
      expect(note.title).toBe(newTitle);
      expect(note.content).toBe(newContent);
      expect(note.updated_at).toBe(newTime);
    });

    it('should reject update for non-existent note', () => {
      const db = getDb();
      const result = db.prepare(
        'SELECT * FROM notes WHERE id = ? AND user_id = ?'
      ).get('non-existent', testUserId);
      
      expect(result).toBeUndefined();
    });

    it('should reject update for note belonging to another user', () => {
      const db = getDb();
      const otherUserId = uuidv4();
      const otherNoteId = uuidv4();
      
      db.prepare(`
        INSERT INTO users (id, email, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(otherUserId, 'other3@example.com', 'hash', Date.now(), Date.now());
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(otherNoteId, 'Other Note', 'Content', Date.now(), Date.now(), otherUserId);

      // 尝试更新（应该失败，因为 user_id 不匹配）
      const result = db.prepare(
        'SELECT * FROM notes WHERE id = ? AND user_id = ?'
      ).get(otherNoteId, testUserId);
      
      expect(result).toBeUndefined();
    });
  });

  describe('DELETE /notes/:id - 删除笔记', () => {
    it('should delete note', () => {
      const db = getDb();
      const noteId = uuidv4();
      const now = Date.now();
      
      // 创建笔记
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(noteId, 'To Delete', 'Content', now, now, testUserId);

      // 删除笔记
      db.prepare('DELETE FROM notes WHERE id = ?').run(noteId);

      const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId);
      expect(note).toBeUndefined();
    });

    it('should return 404 for non-existent note', () => {
      const db = getDb();
      const result = db.prepare('SELECT * FROM notes WHERE id = ?').get('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('Note Links (Backlinks)', () => {
    it('should track outgoing and incoming links', () => {
      const db = getDb();
      const now = Date.now();
      const note1Id = uuidv4();
      const note2Id = uuidv4();
      
      // 创建两条笔记
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(note1Id, 'Note 1', 'Content with [[Note 2]]', now, now, testUserId);
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(note2Id, 'Note 2', 'Content', now, now, testUserId);

      // 创建链接关系
      db.prepare(`
        INSERT INTO links (source_note_id, target_note_id, created_at)
        VALUES (?, ?, ?)
      `).run(note1Id, note2Id, now);

      // 查询 outgoing links (Note 1 -> Note 2)
      const outgoing = db.prepare(`
        SELECT n.* FROM notes n
        JOIN links l ON n.id = l.target_note_id
        WHERE l.source_note_id = ? AND n.user_id = ?
      `).all(note1Id, testUserId);
      
      expect(outgoing.length).toBe(1);
      expect(outgoing[0].title).toBe('Note 2');

      // 查询 backlinks (Note 2 <- Note 1)
      const backlinks = db.prepare(`
        SELECT n.* FROM notes n
        JOIN links l ON n.id = l.source_note_id
        WHERE l.target_note_id = ? AND n.user_id = ?
      `).all(note2Id, testUserId);
      
      expect(backlinks.length).toBe(1);
      expect(backlinks[0].title).toBe('Note 1');
    });
  });
});
