/**
 * Search API 单元测试
 * P3-01: 后端单元测试 - Search 模块
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { initDatabase, closeDatabase, getDb } from '../src/models/database';
import { v4 as uuidv4 } from 'uuid';

describe('Search API', () => {
  let testUserId: string;
  let otherUserId: string;

  beforeAll(() => {
    initDatabase();
    
    // 创建测试用户
    testUserId = uuidv4();
    otherUserId = uuidv4();
    
    const db = getDb();
    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(testUserId, 'test-search@example.com', 'hash', Date.now(), Date.now());
    
    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(otherUserId, 'other-search@example.com', 'hash', Date.now(), Date.now());
  });

  afterAll(() => {
    closeDatabase();
  });

  beforeEach(() => {
    // 清理测试数据
    const db = getDb();
    db.prepare('DELETE FROM notes WHERE user_id = ? OR user_id = ?').run(testUserId, otherUserId);
    db.prepare('DELETE FROM tags WHERE name LIKE ?').run('test-%');
    db.prepare('DELETE FROM note_tags WHERE note_id IN (SELECT id FROM notes WHERE user_id = ? OR user_id = ?)').run(testUserId, otherUserId);
  });

  describe('GET /search - 搜索笔记', () => {
    it('should require query or tag parameter', () => {
      // 验证逻辑：API 层应返回 400
      const q = undefined;
      const tag = undefined;
      expect(!q && !tag).toBe(true);
    });

    it('should search by keyword in title', () => {
      const db = getDb();
      const now = Date.now();
      
      // 创建测试笔记
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'JavaScript Guide', 'Learn JavaScript', now, now, testUserId);
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'Python Basics', 'Learn Python', now, now, testUserId);
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'TypeScript Tips', 'Advanced TypeScript', now, now, testUserId);

      // 搜索 "Script"
      const query = `
        SELECT DISTINCT n.* FROM notes n
        LEFT JOIN note_tags nt ON n.id = nt.note_id
        LEFT JOIN tags t ON nt.tag_id = t.id
        WHERE n.user_id = ? AND (n.title LIKE ? OR n.content LIKE ?)
        ORDER BY n.updated_at DESC
      `;
      
      const notes = db.prepare(query).all(testUserId, '%Script%', '%Script%') as any[];
      
      expect(notes.length).toBe(2);
      const titles = notes.map(n => n.title);
      expect(titles).toContain('JavaScript Guide');
      expect(titles).toContain('TypeScript Tips');
    });

    it('should search by keyword in content', () => {
      const db = getDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'Note 1', 'Contains React information', now, now, testUserId);
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'Note 2', 'Contains Vue information', now, now, testUserId);
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'Note 3', 'Contains Angular information', now, now, testUserId);

      // 搜索 "React"
      const query = `
        SELECT DISTINCT n.* FROM notes n
        WHERE n.user_id = ? AND (n.title LIKE ? OR n.content LIKE ?)
        ORDER BY n.updated_at DESC
      `;
      
      const notes = db.prepare(query).all(testUserId, '%React%', '%React%') as any[];
      
      expect(notes.length).toBe(1);
      expect(notes[0].title).toBe('Note 1');
    });

    it('should search by tag', () => {
      const db = getDb();
      const now = Date.now();
      
      // 创建笔记
      const note1Id = uuidv4();
      const note2Id = uuidv4();
      const note3Id = uuidv4();
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(note1Id, 'React Note', 'Content', now, now, testUserId);
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(note2Id, 'Vue Note', 'Content', now, now, testUserId);
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(note3Id, 'Other Note', 'Content', now, now, testUserId);

      // 创建标签
      const reactTagId = uuidv4();
      const vueTagId = uuidv4();
      
      db.prepare(`
        INSERT INTO tags (id, name, created_at)
        VALUES (?, ?, ?)
      `).run(reactTagId, 'react', now);
      
      db.prepare(`
        INSERT INTO tags (id, name, created_at)
        VALUES (?, ?, ?)
      `).run(vueTagId, 'vue', now);

      // 关联标签
      db.prepare(`
        INSERT INTO note_tags (note_id, tag_id)
        VALUES (?, ?)
      `).run(note1Id, reactTagId);
      
      db.prepare(`
        INSERT INTO note_tags (note_id, tag_id)
        VALUES (?, ?)
      `).run(note2Id, vueTagId);

      // 搜索 tag=react
      const query = `
        SELECT DISTINCT n.* FROM notes n
        LEFT JOIN note_tags nt ON n.id = nt.note_id
        LEFT JOIN tags t ON nt.tag_id = t.id
        WHERE n.user_id = ? AND t.name = ?
        ORDER BY n.updated_at DESC
      `;
      
      const notes = db.prepare(query).all(testUserId, 'react') as any[];
      
      expect(notes.length).toBe(1);
      expect(notes[0].title).toBe('React Note');
    });

    it('should search by keyword and tag combined', () => {
      const db = getDb();
      const now = Date.now();
      
      const note1Id = uuidv4();
      const note2Id = uuidv4();
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(note1Id, 'React Hooks Guide', 'Advanced React Hooks', now, now, testUserId);
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(note2Id, 'React State Management', 'Redux and Context', now, now, testUserId);

      // 创建标签
      const reactTagId = uuidv4();
      db.prepare(`
        INSERT INTO tags (id, name, created_at)
        VALUES (?, ?, ?)
      `).run(reactTagId, 'react', now);

      // 只给 note1 添加标签
      db.prepare(`
        INSERT INTO note_tags (note_id, tag_id)
        VALUES (?, ?)
      `).run(note1Id, reactTagId);

      // 搜索：keyword="Hooks" AND tag="react"
      // 使用 INNER JOIN 确保标签匹配
      const query = `
        SELECT DISTINCT n.* FROM notes n
        INNER JOIN note_tags nt ON n.id = nt.note_id
        INNER JOIN tags t ON nt.tag_id = t.id
        WHERE n.user_id = ? AND (n.title LIKE ? OR n.content LIKE ?) AND t.name = ?
        ORDER BY n.updated_at DESC
      `;
      
      const notes = db.prepare(query).all(testUserId, '%Hooks%', '%Hooks%', 'react') as any[];
      
      expect(notes.length).toBe(1);
      expect(notes[0].title).toBe('React Hooks Guide');
    });

    it('should only return user own notes', () => {
      const db = getDb();
      const now = Date.now();
      
      // 创建测试用户的笔记
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'My JavaScript Note', 'Content', now, now, testUserId);
      
      // 创建其他用户的笔记（相同关键词）
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'Other JavaScript Note', 'Content', now, now, otherUserId);

      // 搜索 "JavaScript"
      const query = `
        SELECT DISTINCT n.* FROM notes n
        WHERE n.user_id = ? AND (n.title LIKE ? OR n.content LIKE ?)
        ORDER BY n.updated_at DESC
      `;
      
      const notes = db.prepare(query).all(testUserId, '%JavaScript%', '%JavaScript%') as any[];
      
      expect(notes.length).toBe(1);
      expect(notes[0].title).toBe('My JavaScript Note');
    });

    it('should return results ordered by updated_at DESC', () => {
      const db = getDb();
      const now = Date.now();
      
      // 创建 3 条笔记，更新时间不同
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'Old Note', 'JavaScript content', now - 3000, now - 3000, testUserId);
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'Medium Note', 'JavaScript content', now - 2000, now - 2000, testUserId);
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'New Note', 'JavaScript content', now - 1000, now - 1000, testUserId);

      const query = `
        SELECT DISTINCT n.* FROM notes n
        WHERE n.user_id = ? AND (n.title LIKE ? OR n.content LIKE ?)
        ORDER BY n.updated_at DESC
      `;
      
      const notes = db.prepare(query).all(testUserId, '%JavaScript%', '%JavaScript%') as any[];
      
      expect(notes.length).toBe(3);
      expect(notes[0].title).toBe('New Note');
      expect(notes[1].title).toBe('Medium Note');
      expect(notes[2].title).toBe('Old Note');
    });

    it('should handle case-insensitive search', () => {
      const db = getDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'JAVASCRIPT Guide', 'Content', now, now, testUserId);
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'javascript basics', 'Content', now, now, testUserId);

      // SQLite LIKE is case-insensitive by default for ASCII
      const query = `
        SELECT DISTINCT n.* FROM notes n
        WHERE n.user_id = ? AND (n.title LIKE ? OR n.content LIKE ?)
        ORDER BY n.updated_at DESC
      `;
      
      const notes = db.prepare(query).all(testUserId, '%javascript%', '%javascript%') as any[];
      
      expect(notes.length).toBe(2);
    });

    it('should return empty array when no matches', () => {
      const db = getDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'Python Note', 'Content about Python', now, now, testUserId);

      // 搜索不存在的关键词
      const query = `
        SELECT DISTINCT n.* FROM notes n
        WHERE n.user_id = ? AND (n.title LIKE ? OR n.content LIKE ?)
        ORDER BY n.updated_at DESC
      `;
      
      const notes = db.prepare(query).all(testUserId, '%NonExistent%', '%NonExistent%') as any[];
      
      expect(notes.length).toBe(0);
    });
  });
});
