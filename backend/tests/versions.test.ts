/**
 * 笔记版本历史模块单元测试
 * P2-01: 笔记版本历史
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { initDatabase, closeDatabase, getDb } from '../src/models/database';
import {
  createVersion,
  getVersionsByNoteId,
  getVersionById,
  restoreVersion,
  cleanupOldVersions,
} from '../src/models/noteVersion';
import { v4 as uuidv4 } from 'uuid';

// 测试环境配置
process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';

describe('Note Version Service', () => {
  let testUserId: string;
  let testNoteId: string;

  beforeAll(() => {
    initDatabase();

    // 创建测试用户
    const db = getDb();
    testUserId = uuidv4();
    testNoteId = uuidv4();
    
    const now = Date.now();
    const testEmail = `test-version-${Date.now()}@example.com`;
    
    db.prepare(`
      INSERT INTO users (id, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(testUserId, testEmail, 'hash', now, now);

    // 创建测试笔记
    db.prepare(`
      INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(testNoteId, 'Test Note for Versions', 'Original content', now, now, testUserId);
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('createVersion', () => {
    it('should create a version snapshot successfully', async () => {
      const uniqueNoteId = uuidv4();
      const db = getDb();
      const now = Date.now();
      
      // Create unique test note
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uniqueNoteId, 'Unique Test Note', 'Content', now, now, testUserId);
      
      const version = await createVersion(
        uniqueNoteId,
        'Version 1 Title',
        'Version 1 Content',
        testUserId
      );

      expect(version.id).toBeDefined();
      expect(version.note_id).toBe(uniqueNoteId);
      expect(version.title).toBe('Version 1 Title');
      expect(version.content).toBe('Version 1 Content');
      expect(version.version_number).toBe(1);
      expect(version.created_by).toBe(testUserId);
    });

    it('should increment version number for subsequent versions', async () => {
      const uniqueNoteId = uuidv4();
      const db = getDb();
      const now = Date.now();
      
      // Create unique test note
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uniqueNoteId, 'Increment Test Note', 'Content', now, now, testUserId);
      
      const version1 = await createVersion(uniqueNoteId, 'Title 1', 'Content 1', testUserId);
      const version2 = await createVersion(uniqueNoteId, 'Title 2', 'Content 2', testUserId);
      const version3 = await createVersion(uniqueNoteId, 'Title 3', 'Content 3', testUserId);

      expect(version1.version_number).toBe(1);
      expect(version2.version_number).toBe(2);
      expect(version3.version_number).toBe(3);
    });
  });

  describe('getVersionsByNoteId', () => {
    it('should return all versions for a note in descending order', async () => {
      // Create some versions on testNoteId
      await createVersion(testNoteId, 'GetVersions Test 1', 'Content 1', testUserId);
      await createVersion(testNoteId, 'GetVersions Test 2', 'Content 2', testUserId);
      await createVersion(testNoteId, 'GetVersions Test 3', 'Content 3', testUserId);
      
      const versions = await getVersionsByNoteId(testNoteId);
      
      expect(versions.length).toBeGreaterThanOrEqual(3);
      // Should be ordered by version_number DESC
      expect(versions[0].version_number).toBeGreaterThan(versions[versions.length - 1].version_number);
    });

    it('should return empty array for non-existent note', async () => {
      const versions = await getVersionsByNoteId('non-existent-note-id');
      expect(versions).toEqual([]);
    });
  });

  describe('getVersionById', () => {
    it('should return version by ID', async () => {
      const version = await createVersion(testNoteId, 'Get Test', 'Get Test Content', testUserId);
      const retrieved = await getVersionById(version.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(version.id);
      expect(retrieved!.title).toBe('Get Test');
    });

    it('should return null for non-existent version', async () => {
      const version = await getVersionById('non-existent-version-id');
      expect(version).toBeNull();
    });
  });

  describe('restoreVersion', () => {
    it('should restore a note to a previous version', async () => {
      const db = getDb();
      
      // Create a version
      const version = await createVersion(
        testNoteId,
        'Restore Test Title',
        'Restore Test Content',
        testUserId
      );

      // Modify the note
      db.prepare(`
        UPDATE notes SET title = 'Modified Title', content = 'Modified Content', updated_at = ?
        WHERE id = ?
      `).run(Date.now(), testNoteId);

      // Verify modification
      const modifiedNote = db.prepare('SELECT * FROM notes WHERE id = ?').get(testNoteId) as any;
      expect(modifiedNote.title).toBe('Modified Title');
      expect(modifiedNote.content).toBe('Modified Content');

      // Restore version
      await restoreVersion(version.id, testNoteId);

      // Verify restoration
      const restoredNote = db.prepare('SELECT * FROM notes WHERE id = ?').get(testNoteId) as any;
      expect(restoredNote.title).toBe('Restore Test Title');
      expect(restoredNote.content).toBe('Restore Test Content');
    });

    it('should throw error for non-existent version', async () => {
      await expect(restoreVersion('non-existent-version', testNoteId))
        .rejects.toThrow('Version not found');
    });

    it('should throw error if version does not belong to specified note', async () => {
      const otherNoteId = uuidv4();
      const db = getDb();
      const now = Date.now();

      // Create another note
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(otherNoteId, 'Other Note', 'Content', now, now, testUserId);

      // Create a version for the original note
      const version = await createVersion(testNoteId, 'Test', 'Test', testUserId);

      // Try to restore to a different note
      await expect(restoreVersion(version.id, otherNoteId))
        .rejects.toThrow('Version does not belong to the specified note');
    });
  });

  describe('cleanupOldVersions', () => {
    it('should remove old versions when exceeding max limit', async () => {
      const db = getDb();
      const cleanupTestNoteId = uuidv4();
      const now = Date.now();

      // Create test note
      db.prepare(`
        INSERT INTO notes (id, title, content, created_at, updated_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(cleanupTestNoteId, 'Cleanup Test', 'Content', now, now, testUserId);

      // Create 55 versions
      for (let i = 0; i < 55; i++) {
        await createVersion(cleanupTestNoteId, `Version ${i}`, `Content ${i}`, testUserId);
      }

      // Verify 55 versions exist
      const versionsBefore = await getVersionsByNoteId(cleanupTestNoteId);
      expect(versionsBefore.length).toBe(55);

      // Cleanup (keep max 50)
      await cleanupOldVersions(cleanupTestNoteId, 50);

      // Verify only 50 versions remain
      const versionsAfter = await getVersionsByNoteId(cleanupTestNoteId);
      expect(versionsAfter.length).toBe(50);

      // Verify oldest versions were removed (version 1-5 should be gone)
      const versionNumbers = versionsAfter.map(v => v.version_number);
      expect(versionNumbers).not.toContain(1);
      expect(versionNumbers).not.toContain(5);
      expect(versionNumbers).toContain(6);
      expect(versionNumbers).toContain(55);
    });
  });
});
