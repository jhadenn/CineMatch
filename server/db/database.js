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

module.exports = db;
