const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'cinematch.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Keep one shared SQLite connection for the lifetime of the server process.
const db = new Database(DB_PATH);

// WAL mode improves local concurrency, and foreign keys enforce relationships.
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Re-run the schema on startup so a fresh clone self-initializes cleanly.
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

/**
 * Check whether a startup migration is still needed.
 * The app uses lightweight additive migrations so local SQLite databases from
 * older project versions continue to boot after schema changes.
 */
function hasColumn(tableName, columnName) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some((column) => column.name === columnName);
}

/**
 * Apply backward-compatible SQLite migrations that cannot be expressed by
 * CREATE TABLE IF NOT EXISTS for databases that already exist.
 */
function runMigrations() {
  const migrations = [];

  if (!hasColumn('watchlist', 'release_year')) {
    migrations.push('ALTER TABLE watchlist ADD COLUMN release_year INTEGER');
  }

  if (!hasColumn('watchlist', 'genres')) {
    migrations.push("ALTER TABLE watchlist ADD COLUMN genres TEXT NOT NULL DEFAULT '[]'");
  }

  if (!hasColumn('watchlist', 'runtime')) {
    migrations.push('ALTER TABLE watchlist ADD COLUMN runtime INTEGER');
  }

  if (!hasColumn('watchlist', 'vote_average')) {
    migrations.push('ALTER TABLE watchlist ADD COLUMN vote_average REAL');
  }

  if (!hasColumn('watch_history', 'overview')) {
    migrations.push("ALTER TABLE watch_history ADD COLUMN overview TEXT NOT NULL DEFAULT ''");
  }

  if (!hasColumn('watch_history', 'runtime')) {
    migrations.push('ALTER TABLE watch_history ADD COLUMN runtime INTEGER');
  }

  if (!hasColumn('watch_history', 'vote_average')) {
    migrations.push('ALTER TABLE watch_history ADD COLUMN vote_average REAL');
  }

  if (!hasColumn('movie_embeddings', 'content_hash')) {
    migrations.push('ALTER TABLE movie_embeddings ADD COLUMN content_hash TEXT');
  }

  for (const migration of migrations) {
    db.exec(migration);
  }
}

runMigrations();

module.exports = db;
