import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

const DATA_DIR = process.env.DATA_DIR || './data';

export function initDatabase(): Database.Database {
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const dbPath = path.join(DATA_DIR, 'pkms.db');
  db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create tables
  createTables(db);

  console.log('Database initialized at:', dbPath);
  return db;
}

function createTables(db: Database.Database): void {
  // Notes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      encrypted INTEGER DEFAULT 0,
      checksum TEXT
    )
  `);

  // Tags table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      color TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  // Note-Tags junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS note_tags (
      note_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (note_id, tag_id),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);

  // Links table (for bidirectional links)
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY,
      source_note_id TEXT NOT NULL,
      target_note_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (source_note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (target_note_id) REFERENCES notes(id) ON DELETE CASCADE,
      UNIQUE(source_note_id, target_note_id)
    )
  `);

  // Create indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_note_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_note_id)');
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
