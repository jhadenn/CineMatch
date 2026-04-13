const express = require('express');
const router = express.Router();
const db = require('../db/database');
const requireAuth = require('../middleware/auth');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const selectWatchlistItemsStmt = db.prepare(
  `SELECT id, tmdb_id, title, poster_path, release_year, genres, position, added_at
   FROM watchlist
   WHERE user_id = ?
   ORDER BY position ASC, added_at ASC`
);
const selectWatchlistItemStmt = db.prepare(
  `SELECT id, tmdb_id, title, poster_path, release_year, genres, position, added_at
   FROM watchlist
   WHERE id = ? AND user_id = ?`
);
const insertWatchlistItemStmt = db.prepare(
  `INSERT INTO watchlist (user_id, tmdb_id, title, poster_path, release_year, genres, position)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);
const updateWatchlistMetadataStmt = db.prepare(
  'UPDATE watchlist SET release_year = ?, genres = ? WHERE id = ? AND user_id = ?'
);

function getNextPosition(userId) {
  const row = db
    .prepare('SELECT COALESCE(MAX(position), -1) AS maxPosition FROM watchlist WHERE user_id = ?')
    .get(userId);
  return Number(row?.maxPosition ?? -1) + 1;
}

function normalizeReleaseYear(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function releaseYearFromDate(releaseDate) {
  if (typeof releaseDate !== 'string') return null;
  return normalizeReleaseYear(releaseDate.slice(0, 4));
}

function normalizeGenres(value) {
  if (!Array.isArray(value)) return [];

  const seen = new Set();
  const normalized = [];
  for (const entry of value) {
    const genreName = typeof entry === 'string'
      ? entry.trim()
      : typeof entry?.name === 'string'
        ? entry.name.trim()
        : '';

    if (!genreName) continue;

    const dedupeKey = genreName.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    normalized.push(genreName);
  }

  return normalized;
}

function parseStoredGenres(value) {
  if (Array.isArray(value)) return normalizeGenres(value);
  if (typeof value !== 'string' || !value.trim()) return [];

  try {
    return normalizeGenres(JSON.parse(value));
  } catch {
    return [];
  }
}

function serializeGenres(genres) {
  return JSON.stringify(normalizeGenres(genres));
}

function toResponseItem(item) {
  return {
    ...item,
    release_year: normalizeReleaseYear(item.release_year),
    genres: parseStoredGenres(item.genres),
  };
}

async function fetchTmdbMetadata(tmdbId) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not configured.');
  }

  const query = new URLSearchParams({ api_key: apiKey });
  const response = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`TMDB metadata lookup failed with status ${response.status}.`);
  }

  const payload = await response.json();
  return {
    release_year: releaseYearFromDate(payload?.release_date),
    genres: normalizeGenres(payload?.genres),
  };
}

async function resolveWatchlistMetadata({ tmdbId, releaseYear, genres }) {
  const normalizedReleaseYear = normalizeReleaseYear(releaseYear);
  const normalizedGenres = normalizeGenres(genres);

  if (normalizedReleaseYear !== null && normalizedGenres.length > 0) {
    return {
      release_year: normalizedReleaseYear,
      genres: normalizedGenres,
    };
  }

  try {
    const fetchedMetadata = await fetchTmdbMetadata(tmdbId);
    return {
      release_year: normalizedReleaseYear ?? fetchedMetadata.release_year,
      genres: normalizedGenres.length > 0 ? normalizedGenres : fetchedMetadata.genres,
    };
  } catch (error) {
    console.error(`Watchlist metadata lookup failed for TMDB id ${tmdbId}:`, error);
    return {
      release_year: normalizedReleaseYear,
      genres: normalizedGenres,
    };
  }
}

async function hydrateWatchlistItem(item, userId) {
  const storedReleaseYear = normalizeReleaseYear(item.release_year);
  const storedGenres = parseStoredGenres(item.genres);
  const resolvedMetadata = await resolveWatchlistMetadata({
    tmdbId: item.tmdb_id,
    releaseYear: storedReleaseYear,
    genres: storedGenres,
  });

  const serializedStoredGenres = serializeGenres(storedGenres);
  const serializedResolvedGenres = serializeGenres(resolvedMetadata.genres);
  const releaseYearChanged = resolvedMetadata.release_year !== storedReleaseYear;
  const genresChanged = serializedResolvedGenres !== serializedStoredGenres;

  if (releaseYearChanged || genresChanged) {
    updateWatchlistMetadataStmt.run(
      resolvedMetadata.release_year,
      serializedResolvedGenres,
      item.id,
      userId
    );
  }

  return {
    ...item,
    release_year: resolvedMetadata.release_year,
    genres: resolvedMetadata.genres,
  };
}

// GET /api/watchlist
router.get('/', requireAuth, async (req, res) => {
  try {
    const items = selectWatchlistItemsStmt.all(req.user.id);
    const hydratedItems = [];

    for (const item of items) {
      hydratedItems.push(await hydrateWatchlistItem(item, req.user.id));
    }

    return res.json({ items: hydratedItems });
  } catch (error) {
    console.error('Watchlist load error:', error);
    return res.status(500).json({ error: 'Failed to load watchlist.' });
  }
});

// POST /api/watchlist
router.post('/', requireAuth, async (req, res) => {
  const tmdbId = Number(req.body?.tmdb_id);
  const title = String(req.body?.title || '').trim();
  const posterPath = req.body?.poster_path ? String(req.body.poster_path) : null;
  const requestedReleaseYear = normalizeReleaseYear(req.body?.release_year);
  const requestedGenres = normalizeGenres(req.body?.genres);

  if (!tmdbId || !title) {
    return res.status(400).json({ error: 'tmdb_id and title are required.' });
  }

  try {
    const metadata = await resolveWatchlistMetadata({
      tmdbId,
      releaseYear: requestedReleaseYear,
      genres: requestedGenres,
    });
    const position = getNextPosition(req.user.id);
    const result = insertWatchlistItemStmt.run(
      req.user.id,
      tmdbId,
      title,
      posterPath,
      metadata.release_year,
      serializeGenres(metadata.genres),
      position
    );

    const item = selectWatchlistItemStmt.get(result.lastInsertRowid, req.user.id);

    return res.status(201).json(toResponseItem(item));
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
