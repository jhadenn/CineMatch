const express = require('express');
const router = express.Router();
const db = require('../db/database');
const requireAuth = require('../middleware/auth');

const selectHistoryStmt = db.prepare(
  `SELECT id, tmdb_id, title, overview, poster_path, genres, director, release_year, watched_at
   FROM watch_history
   WHERE user_id = ?
   ORDER BY watched_at DESC`
);
const insertHistoryStmt = db.prepare(
  `INSERT OR IGNORE INTO watch_history (user_id, tmdb_id, title, overview, poster_path, genres, director, release_year)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);
const deleteHistoryStmt = db.prepare(
  'DELETE FROM watch_history WHERE id = ? AND user_id = ?'
);

function parseGenres(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function toResponseItem(row) {
  return { ...row, genres: parseGenres(row.genres) };
}

// GET /api/history
router.get('/', requireAuth, (req, res) => {
  try {
    const rows = selectHistoryStmt.all(req.user.id);
    return res.json(rows.map(toResponseItem));
  } catch (error) {
    console.error('History load error:', error);
    return res.status(500).json({ error: 'Failed to load watch history.' });
  }
});

// POST /api/history
router.post('/', requireAuth, (req, res) => {
  const tmdbId = Number(req.body?.tmdb_id);
  const title = String(req.body?.title || '').trim();
  const overview = String(req.body?.overview || '').trim();
  const posterPath = req.body?.poster_path ? String(req.body.poster_path) : null;
  const genres = Array.isArray(req.body?.genres) ? req.body.genres : [];
  const director = req.body?.director ? String(req.body.director) : null;
  const releaseYear = Number.isFinite(Number(req.body?.release_year))
    ? Number(req.body.release_year)
    : null;

  if (!tmdbId || !title) {
    return res.status(400).json({ error: 'tmdb_id and title are required.' });
  }

  try {
    const result = insertHistoryStmt.run(
      req.user.id,
      tmdbId,
      title,
      overview,
      posterPath,
      JSON.stringify(genres),
      director,
      releaseYear
    );

    if (!result.changes) {
      return res.status(409).json({ error: 'Movie already in watch history.' });
    }

    return res.status(201).json({
      id: result.lastInsertRowid,
      tmdb_id: tmdbId,
      title,
      overview,
      poster_path: posterPath,
      genres,
      director,
      release_year: releaseYear,
    });
  } catch (error) {
    if (String(error?.message || '').includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Movie already in watch history.' });
    }
    console.error('History add error:', error);
    return res.status(500).json({ error: 'Failed to add to watch history.' });
  }
});

// DELETE /api/history/:id
router.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid history item id.' });
  }

  const result = deleteHistoryStmt.run(id, req.user.id);
  if (!result.changes) {
    return res.status(404).json({ error: 'History item not found.' });
  }

  return res.status(204).send();
});

module.exports = router;
