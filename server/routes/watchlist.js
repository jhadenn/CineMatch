const express = require('express');
const router = express.Router();
const db = require('../db/database');
const requireAuth = require('../middleware/auth');

function getNextPosition(userId) {
  const row = db
    .prepare('SELECT COALESCE(MAX(position), -1) AS maxPosition FROM watchlist WHERE user_id = ?')
    .get(userId);
  return Number(row?.maxPosition ?? -1) + 1;
}

// GET /api/watchlist
router.get('/', requireAuth, (req, res) => {
  const items = db
    .prepare(
      `SELECT id, tmdb_id, title, poster_path, position, added_at
       FROM watchlist
       WHERE user_id = ?
       ORDER BY position ASC, added_at ASC`
    )
    .all(req.user.id);
  return res.json({ items });
});

// POST /api/watchlist
router.post('/', requireAuth, (req, res) => {
  const tmdbId = Number(req.body?.tmdb_id);
  const title = String(req.body?.title || '').trim();
  const posterPath = req.body?.poster_path ? String(req.body.poster_path) : null;

  if (!tmdbId || !title) {
    return res.status(400).json({ error: 'tmdb_id and title are required.' });
  }

  try {
    const position = getNextPosition(req.user.id);
    const result = db
      .prepare(
        `INSERT INTO watchlist (user_id, tmdb_id, title, poster_path, position)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(req.user.id, tmdbId, title, posterPath, position);

    const item = db
      .prepare(
        `SELECT id, tmdb_id, title, poster_path, position, added_at
         FROM watchlist
         WHERE id = ? AND user_id = ?`
      )
      .get(result.lastInsertRowid, req.user.id);

    return res.status(201).json(item);
  } catch (error) {
    if (String(error?.message || '').includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Movie already exists in your watchlist.' });
    }
    console.error('Watchlist add error:', error);
    return res.status(500).json({ error: 'Failed to add movie to watchlist.' });
  }
});

// DELETE /api/watchlist/:id
router.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid watchlist item id.' });
  }

  const result = db
    .prepare('DELETE FROM watchlist WHERE id = ? AND user_id = ?')
    .run(id, req.user.id);
  if (!result.changes) {
    return res.status(404).json({ error: 'Watchlist item not found.' });
  }

  return res.status(204).send();
});

// PATCH /api/watchlist/order
router.patch('/order', requireAuth, (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length) {
    return res.status(400).json({ error: 'items array is required.' });
  }

  const updateStmt = db.prepare(
    'UPDATE watchlist SET position = ? WHERE id = ? AND user_id = ?'
  );

  const tx = db.transaction((nextItems) => {
    for (const item of nextItems) {
      updateStmt.run(Number(item.position), Number(item.id), req.user.id);
    }
  });

  try {
    tx(items);
    return res.json({ success: true });
  } catch (error) {
    console.error('Watchlist reorder error:', error);
    return res.status(500).json({ error: 'Failed to reorder watchlist.' });
  }
});

// GET /api/watchlist/share/:token
router.get('/share/:token', (req, res) => {
  return res.status(501).json({ error: 'Not implemented yet' });
});

module.exports = router;
