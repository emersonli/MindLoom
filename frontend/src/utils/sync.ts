import { Note } from '../types';

// Version vector for conflict detection
export interface VersionVector {
  [deviceId: string]: number;
}

// Note metadata for sync
export interface NoteMetadata {
  id: string;
  version: number;
  lastModified: number;
  deviceId: string;
  contentHash: string;
  syncVector: VersionVector;
}

// Conflict types
export type ConflictType = 'none' | 'metadata' | 'content' | 'delete_edit';

// Conflict record
export interface ConflictRecord {
  id: string;
  noteId: string;
  conflictType: ConflictType;
  localVersion: NoteMetadata;
  remoteVersion: NoteMetadata;
  detectedAt: number;
  resolved: boolean;
  resolution?: 'auto_merge' | 'latest_wins' | 'manual' | 'local_wins' | 'remote_wins';
  resolvedAt?: number;
}

// Resolution strategy
export type ResolutionStrategy = 'auto_merge' | 'latest_wins' | 'manual';

/**
 * Generate content hash (simple implementation)
 */
export function generateContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Create note metadata
 */
export function createNoteMetadata(note: Note, deviceId: string): NoteMetadata {
  return {
    id: note.id,
    version: 1,
    lastModified: note.updated_at,
    deviceId,
    contentHash: generateContentHash(note.content),
    syncVector: { [deviceId]: 1 },
  };
}

/**
 * Detect conflict between local and remote versions
 */
export function detectConflict(
  local: NoteMetadata,
  remote: NoteMetadata
): ConflictType {
  // If versions are equal, no conflict
  if (local.version === remote.version) {
    return 'none';
  }

  // If content hash is same, it's a metadata conflict
  if (local.contentHash === remote.contentHash) {
    return 'metadata';
  }

  // Content is different - conflict
  return 'content';
}

/**
 * Auto-merge metadata changes (Level 1)
 * @deprecated - Not currently used, kept for future implementation
 */
export function _autoMergeMetadata(local: NoteMetadata, remote: NoteMetadata): NoteMetadata {
  // Take the latest version
  const merged: NoteMetadata = {
    ...local,
    version: Math.max(local.version, remote.version) + 1,
    lastModified: Math.max(local.lastModified, remote.lastModified),
    // Merge sync vectors
    syncVector: {
      ...local.syncVector,
      ...remote.syncVector,
      [local.deviceId]: (local.syncVector[local.deviceId] || 0) + 1,
    },
  };

  return merged;
}

/**
 * Resolve based on latest timestamp (Level 2)
 */
function resolveByTimestamp(local: NoteMetadata, remote: NoteMetadata): 'local' | 'remote' {
  return local.lastModified > remote.lastModified ? 'local' : 'remote';
}

/**
 * Resolve conflict based on strategy
 */
export function resolveConflict(
  localNote: Note,
  remoteNote: Note,
  localMeta: NoteMetadata,
  remoteMeta: NoteMetadata,
  strategy: ResolutionStrategy
): {
  resolvedNote: Note;
  winner: 'local' | 'remote' | 'merge';
} {
  const conflictType = detectConflict(localMeta, remoteMeta);

  // No conflict
  if (conflictType === 'none') {
    return {
      resolvedNote: localNote,
      winner: 'local',
    };
  }

  // Auto-merge for metadata conflicts
  if (conflictType === 'metadata' && strategy === 'auto_merge') {
    return {
      resolvedNote: localNote,
      winner: 'merge',
    };
  }

  // Timestamp-based resolution
  if (strategy === 'latest_wins') {
    const winner = resolveByTimestamp(localMeta, remoteMeta);
    return {
      resolvedNote: winner === 'local' ? localNote : remoteNote,
      winner,
    };
  }

  // Manual resolution - keep local by default
  return {
    resolvedNote: localNote,
    winner: 'local',
  };
}

/**
 * Get sync status for a note
 */
export function getSyncStatus(
  localMeta: NoteMetadata,
  remoteMeta: NoteMetadata | null
): 'synced' | 'behind' | 'ahead' | 'conflict' {
  if (!remoteMeta) {
    return localMeta.version === 1 ? 'synced' : 'ahead';
  }

  const conflictType = detectConflict(localMeta, remoteMeta);
  if (conflictType !== 'none') {
    return 'conflict';
  }

  const localVersion = localMeta.syncVector[localMeta.deviceId] || 0;
  const remoteVersion = remoteMeta.syncVector[remoteMeta.deviceId] || 0;

  if (localVersion > remoteVersion) {
    return 'ahead';
  } else if (localVersion < remoteVersion) {
    return 'behind';
  }

  return 'synced';
}

/**
 * Prepare note for sync
 */
export function prepareForSync(note: Note, deviceId: string): {
  note: Note;
  metadata: NoteMetadata;
} {
  const metadata = createNoteMetadata(note, deviceId);
  return { note, metadata };
}

export default {
  generateContentHash,
  createNoteMetadata,
  detectConflict,
  resolveConflict,
  getSyncStatus,
  prepareForSync,
};