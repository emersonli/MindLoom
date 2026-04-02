import { getDb } from './database';

export interface NoteVersion {
  id: string;
  note_id: string;
  title: string;
  content: string;
  version_number: number;
  created_at: number;
  created_by: string;
}

/**
 * 创建笔记版本快照
 */
export async function createVersion(
  noteId: string,
  title: string,
  content: string,
  userId: string
): Promise<NoteVersion> {
  const db = getDb();
  
  // 获取当前最新版本号
  const lastVersion = db.prepare(`
    SELECT MAX(version_number) as max_version FROM note_versions WHERE note_id = ?
  `).get(noteId) as { max_version: number | null };
  
  const versionNumber = (lastVersion?.max_version || 0) + 1;
  const id = crypto.randomUUID();
  const now = Date.now();
  
  db.prepare(`
    INSERT INTO note_versions (id, note_id, title, content, version_number, created_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, noteId, title, content, versionNumber, now, userId);
  
  return { id, note_id: noteId, title, content, version_number: versionNumber, created_at: now, created_by: userId };
}

/**
 * 获取笔记的所有版本
 */
export async function getVersionsByNoteId(noteId: string): Promise<NoteVersion[]> {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM note_versions WHERE note_id = ? ORDER BY version_number DESC
  `).all(noteId) as NoteVersion[];
}

/**
 * 获取特定版本详情
 */
export async function getVersionById(versionId: string): Promise<NoteVersion | null> {
  const db = getDb();
  const version = db.prepare('SELECT * FROM note_versions WHERE id = ?').get(versionId) as NoteVersion | undefined;
  return version ?? null;
}

/**
 * 恢复版本
 */
export async function restoreVersion(versionId: string, noteId: string): Promise<void> {
  const db = getDb();
  const version = await getVersionById(versionId);
  
  if (!version) {
    throw new Error('Version not found');
  }
  
  // 验证版本属于指定笔记
  if (version.note_id !== noteId) {
    throw new Error('Version does not belong to the specified note');
  }
  
  // 更新当前笔记内容
  db.prepare(`
    UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?
  `).run(version.title, version.content, Date.now(), noteId);
}

/**
 * 清理旧版本（保留策略：每个笔记最多保留 50 个版本）
 */
export async function cleanupOldVersions(noteId: string, maxVersions: number = 50): Promise<void> {
  const db = getDb();
  const versions = await getVersionsByNoteId(noteId);
  
  if (versions.length > maxVersions) {
    const toDelete = versions.slice(maxVersions);
    for (const version of toDelete) {
      db.prepare('DELETE FROM note_versions WHERE id = ?').run(version.id);
    }
  }
}

export default {
  createVersion,
  getVersionsByNoteId,
  getVersionById,
  restoreVersion,
  cleanupOldVersions,
};
