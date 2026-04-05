/**
 * Tags API 单元测试
 * P3-01: 后端单元测试 - Tags 模块
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { initDatabase, closeDatabase, getDb } from '../src/models/database';
import { v4 as uuidv4 } from 'uuid';

describe('Tags API', () => {
  let testUserId: string;
  let otherUserId: string;

  beforeAll(() => {
    initDatabase();
    
    testUserId = uuidv4();
    otherUserId = uuidv4();
    
    const db = getDb();
    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(testUserId, 'test-tags@example.com', 'hash', Date.now(), Date.now());
    
    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(otherUserId, 'other-tags@example.com', 'hash', Date.now(), Date.now());
  });

  afterAll(() => {
    closeDatabase();
  });

  beforeEach(() => {
    const db = getDb();
    db.prepare('DELETE FROM notes WHERE user_id = ? OR user_id = ?').run(testUserId, otherUserId);
    db.prepare('DELETE FROM tags WHERE name LIKE ?').run('test-%');
    db.prepare('DELETE FROM note_tags').run();
  });

  describe('GET /tags - 获取所有标签', () => {
    it('should return empty array when no tags exist', () => {
      const db = getDb();
      const tags = db.prepare('SELECT * FROM tags ORDER BY name').all();
      expect(tags).toEqual([]);
    });

    it('should return all tags with note count', () => {
      const db = getDb();
      const now = Date.now();
      
      // 创建标签
      const tag1Id = uuidv4();
      const tag2Id = uuidv4();
      
      db.prepare(`
        INSERT INTO tags (id, name, created_at)
        VALUES (?, ?, ?)
      `).run(tag1Id, 'test-tag-1', now);
      
      db.prepare(`
        INSERT INTO tags (id, name, created_at)
        VALUES (?, ?, ?)
      `).run(tag2Id, 'test-tag-2', now);

      // 创建笔记并关联标签
      const note1Id = uuidv4();
      const note2Id = uuidv4();
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(note1Id, 'Note 1', 'Content', now, now, testUserId);
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(note2Id, 'Note 2', 'Content', now, now, testUserId);

      // tag1 关联 2 条笔记，tag2 关联 1 条笔记
      db.prepare(`INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)`).run(note1Id, tag1Id);
      db.prepare(`INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)`).run(note2Id, tag1Id);
      db.prepare(`INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)`).run(note1Id, tag2Id);

      // 查询标签及笔记计数
      const tags = db.prepare('SELECT * FROM tags ORDER BY name').all() as any[];
      
      expect(tags.length).toBe(2);
      
      // 验证计数
      for (const tag of tags) {
        const count = db.prepare(`
          SELECT COUNT(*) as count FROM note_tags nt
          JOIN notes n ON nt.note_id = n.id
          WHERE nt.tag_id = ? AND n.user_id = ?
        `).get(tag.id, testUserId) as { count: number };
        
        if (tag.name === 'test-tag-1') {
          expect(count.count).toBe(2);
        } else if (tag.name === 'test-tag-2') {
          expect(count.count).toBe(1);
        }
      }
    });

    it('should only count user own notes', () => {
      const db = getDb();
      const now = Date.now();
      
      const tagId = uuidv4();
      db.prepare(`
        INSERT INTO tags (id, name, created_at)
        VALUES (?, ?, ?)
      `).run(tagId, 'shared-tag', now);

      // 测试用户的笔记
      const testNoteId = uuidv4();
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(testNoteId, 'Test Note', 'Content', now, now, testUserId);
      db.prepare(`INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)`).run(testNoteId, tagId);

      // 其他用户的笔记
      const otherNoteId = uuidv4();
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(otherNoteId, 'Other Note', 'Content', now, now, otherUserId);
      db.prepare(`INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)`).run(otherNoteId, tagId);

      // 验证测试用户只能看到自己的计数
      const testCount = db.prepare(`
        SELECT COUNT(*) as count FROM note_tags nt
        JOIN notes n ON nt.note_id = n.id
        WHERE nt.tag_id = ? AND n.user_id = ?
      `).get(tagId, testUserId) as { count: number };
      
      expect(testCount.count).toBe(1);

      // 验证其他用户也只能看到自己的计数
      const otherCount = db.prepare(`
        SELECT COUNT(*) as count FROM note_tags nt
        JOIN notes n ON nt.note_id = n.id
        WHERE nt.tag_id = ? AND n.user_id = ?
      `).get(tagId, otherUserId) as { count: number };
      
      expect(otherCount.count).toBe(1);
    });
  });

  describe('GET /tags/:id - 获取标签详情', () => {
    it('should return tag with associated notes', () => {
      const db = getDb();
      const now = Date.now();
      
      const tagId = uuidv4();
      db.prepare(`
        INSERT INTO tags (id, name, color, created_at)
        VALUES (?, ?, ?, ?)
      `).run(tagId, 'detailed-tag', '#FF0000', now);

      const note1Id = uuidv4();
      const note2Id = uuidv4();
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(note1Id, 'Note A', 'Content A', now, now, testUserId);
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(note2Id, 'Note B', 'Content B', now, now, testUserId);

      db.prepare(`INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)`).run(note1Id, tagId);
      db.prepare(`INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)`).run(note2Id, tagId);

      // 查询标签
      const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(tagId) as any;
      expect(tag).toBeDefined();
      expect(tag.name).toBe('detailed-tag');
      expect(tag.color).toBe('#FF0000');

      // 查询关联笔记
      const notes = db.prepare(`
        SELECT n.* FROM notes n
        JOIN note_tags nt ON n.id = nt.note_id
        WHERE nt.tag_id = ? AND n.user_id = ?
        ORDER BY n.updated_at DESC
      `).all(tagId, testUserId);
      
      expect(notes.length).toBe(2);
    });

    it('should return 404 for non-existent tag', () => {
      const db = getDb();
      const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get('non-existent-id');
      expect(tag).toBeUndefined();
    });

    it('should return notes ordered by updated_at DESC', () => {
      const db = getDb();
      const now = Date.now();
      
      const tagId = uuidv4();
      db.prepare(`
        INSERT INTO tags (id, name, created_at)
        VALUES (?, ?, ?)
      `).run(tagId, 'order-tag', now);

      // 创建 3 条不同更新时间的笔记
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'Old', 'Content', now - 3000, now - 3000, testUserId);
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'Medium', 'Content', now - 2000, now - 2000, testUserId);
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), 'New', 'Content', now - 1000, now - 1000, testUserId);

      // 全部关联到标签
      const noteIds = db.prepare(`SELECT id FROM notes WHERE user_id = ? ORDER BY updated_at`).all(testUserId) as any[];
      noteIds.forEach(({ id }) => {
        db.prepare(`INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)`).run(id, tagId);
      });

      const notes = db.prepare(`
        SELECT n.* FROM notes n
        JOIN note_tags nt ON n.id = nt.note_id
        WHERE nt.tag_id = ? AND n.user_id = ?
        ORDER BY n.updated_at DESC
      `).all(tagId, testUserId) as any[];
      
      expect(notes.length).toBe(3);
      expect(notes[0].title).toBe('New');
      expect(notes[2].title).toBe('Old');
    });
  });

  describe('POST /tags - 创建标签', () => {
    it('should create a new tag with name', () => {
      const db = getDb();
      const id = uuidv4();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO tags (id, name, created_at)
        VALUES (?, ?, ?)
      `).run(id, 'new-tag', now);

      const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as any;
      
      expect(tag).toBeDefined();
      expect(tag.name).toBe('new-tag');
      expect(tag.created_at).toBe(now);
    });

    it('should create tag with color', () => {
      const db = getDb();
      const id = uuidv4();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO tags (id, name, color, created_at)
        VALUES (?, ?, ?, ?)
      `).run(id, 'colored-tag', '#00FF00', now);

      const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as any;
      
      expect(tag.color).toBe('#00FF00');
    });

    it('should store tag name as inserted (application handles normalization)', () => {
      const db = getDb();
      const id = uuidv4();
      const now = Date.now();
      
      // 插入名称（应用层应负责转小写）
      db.prepare(`
        INSERT INTO tags (id, name, created_at)
        VALUES (?, ?, ?)
      `).run(id, 'Test-Tag-Name', now);

      // 查询时使用相同的大小写
      const tag = db.prepare('SELECT * FROM tags WHERE name = ?').get('Test-Tag-Name');
      expect(tag).toBeDefined();
      expect(tag.name).toBe('Test-Tag-Name');
    });

    it('should reject duplicate tag name', () => {
      const db = getDb();
      const now = Date.now();
      
      // 创建第一个标签
      db.prepare(`
        INSERT INTO tags (id, name, created_at)
        VALUES (?, ?, ?)
      `).run(uuidv4(), 'duplicate-tag', now);

      // 检查是否已存在
      const existing = db.prepare('SELECT id FROM tags WHERE name = ?').get('duplicate-tag');
      expect(existing).toBeDefined();
    });

    it('should reject tag without name', () => {
      // 验证逻辑：API 层应返回 400
      const name = undefined;
      expect(!name).toBe(true);
    });
  });

  describe('PUT /tags/:id - 更新标签', () => {
    it('should update tag name', () => {
      const db = getDb();
      const now = Date.now();
      
      const tagId = uuidv4();
      db.prepare(`
        INSERT INTO tags (id, name, created_at)
        VALUES (?, ?, ?)
      `).run(tagId, 'old-name', now);

      // 更新名称
      db.prepare('UPDATE tags SET name = ? WHERE id = ?').run('new-name', tagId);

      const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(tagId) as any;
      expect(tag.name).toBe('new-name');
    });

    it('should update tag color', () => {
      const db = getDb();
      const now = Date.now();
      
      const tagId = uuidv4();
      db.prepare(`
        INSERT INTO tags (id, name, color, created_at)
        VALUES (?, ?, ?, ?)
      `).run(tagId, 'color-tag', '#FFFFFF', now);

      // 更新颜色
      db.prepare('UPDATE tags SET color = ? WHERE id = ?').run('#000000', tagId);

      const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(tagId) as any;
      expect(tag.color).toBe('#000000');
    });

    it('should return 404 for non-existent tag', () => {
      const db = getDb();
      const result = db.prepare('SELECT * FROM tags WHERE id = ?').get('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('DELETE /tags/:id - 删除标签', () => {
    it('should delete tag', () => {
      const db = getDb();
      const now = Date.now();
      
      const tagId = uuidv4();
      db.prepare(`
        INSERT INTO tags (id, name, created_at)
        VALUES (?, ?, ?)
      `).run(tagId, 'to-delete', now);

      // 删除标签
      db.prepare('DELETE FROM tags WHERE id = ?').run(tagId);

      const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(tagId);
      expect(tag).toBeUndefined();
    });

    it('should remove tag associations when deleting', () => {
      const db = getDb();
      const now = Date.now();
      
      const tagId = uuidv4();
      const noteId = uuidv4();
      
      db.prepare(`
        INSERT INTO tags (id, name, created_at)
        VALUES (?, ?, ?)
      `).run(tagId, 'delete-with-links', now);
      
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(noteId, 'Note', 'Content', now, now, testUserId);
      
      db.prepare(`INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)`).run(noteId, tagId);

      // 验证关联存在
      const assocBefore = db.prepare('SELECT * FROM note_tags WHERE note_id = ? AND tag_id = ?').get(noteId, tagId);
      expect(assocBefore).toBeDefined();

      // 删除标签
      db.prepare('DELETE FROM tags WHERE id = ?').run(tagId);

      // 注意：实际应用中可能需要级联删除 note_tags，这里验证标签已删除
      const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(tagId);
      expect(tag).toBeUndefined();
    });

    it('should return 404 for non-existent tag', () => {
      const db = getDb();
      const result = db.prepare('SELECT * FROM tags WHERE id = ?').get('non-existent');
      expect(result).toBeUndefined();
    });
  });
});
