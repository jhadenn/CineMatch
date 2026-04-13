-- Users
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  username    TEXT NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Watchlist
CREATE TABLE IF NOT EXISTS watchlist (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  tmdb_id     INTEGER NOT NULL,
  title       TEXT NOT NULL,
  poster_path TEXT,
  position    INTEGER NOT NULL DEFAULT 0,
  added_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, tmdb_id)
);

-- Watch history
CREATE TABLE IF NOT EXISTS watch_history (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  tmdb_id      INTEGER NOT NULL,
  title        TEXT NOT NULL,
  poster_path  TEXT,
  genres       TEXT NOT NULL,
  director     TEXT,
  release_year INTEGER,
  watched_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, tmdb_id)
);

-- Shared watchlist tokens
CREATE TABLE IF NOT EXISTS watchlist_shares (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  token      TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cached OpenAI embedding vectors (1536 dimensions, stored as JSON)
CREATE TABLE IF NOT EXISTS movie_embeddings (
  tmdb_id   INTEGER PRIMARY KEY,
  embedding TEXT NOT NULL
);
