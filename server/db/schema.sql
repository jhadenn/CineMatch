-- Core account table. Each row represents one CineMatch user.
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  username    TEXT NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ordered queue of movies the user wants to watch later.
-- `position` supports drag-and-drop or manual reordering in the UI.
CREATE TABLE IF NOT EXISTS watchlist (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  tmdb_id     INTEGER NOT NULL,
  title       TEXT NOT NULL,
  poster_path TEXT,
  release_year INTEGER,
  genres      TEXT NOT NULL DEFAULT '[]',
  position    INTEGER NOT NULL DEFAULT 0,
  added_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, tmdb_id)
);

-- Movies the user has already watched.
-- Recommendation jobs read the denormalized metadata here directly instead of
-- having to re-fetch every title from TMDB.
CREATE TABLE IF NOT EXISTS watch_history (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  tmdb_id      INTEGER NOT NULL,
  title        TEXT NOT NULL,
  overview     TEXT NOT NULL DEFAULT '',
  poster_path  TEXT,
  genres       TEXT NOT NULL,
  director     TEXT,
  release_year INTEGER,
  watched_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, tmdb_id)
);

-- Tokens backing public/shared watchlist links.
CREATE TABLE IF NOT EXISTS watchlist_shares (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  token      TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cached OpenAI embedding vectors (1536 dimensions, stored as JSON).
-- This avoids paying for the same embedding request more than once.
CREATE TABLE IF NOT EXISTS movie_embeddings (
  tmdb_id   INTEGER PRIMARY KEY,
  embedding TEXT NOT NULL,
  content_hash TEXT
);
