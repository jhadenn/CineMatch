const express = require('express');
const router = express.Router();
const db = require('../db/database');
const requireAuth = require('../middleware/auth');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const selectWatchlistItemsStmt = db.prepare(
  `SELECT id, tmdb_id, title, poster_path, release_year, genres, runtime, vote_average, position, added_at
   FROM watchlist
   WHERE user_id = ?
   ORDER BY position ASC, added_at ASC`
);
const selectWatchlistItemStmt = db.prepare(
  `SELECT id, tmdb_id, title, poster_path, release_year, genres, runtime, vote_average, position, added_at
   FROM watchlist
   WHERE id = ? AND user_id = ?`
);
const insertWatchlistItemStmt = db.prepare(
  `INSERT INTO watchlist (user_id, tmdb_id, title, poster_path, release_year, genres, runtime, vote_average, position)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const updateWatchlistMetadataStmt = db.prepare(
  'UPDATE watchlist SET release_year = ?, genres = ?, runtime = ?, vote_average = ? WHERE id = ? AND user_id = ?'
);

/**
 * Append new items after the current highest saved position for the user.
 */
function getNextPosition(userId) {
  const row = db
    .prepare('SELECT COALESCE(MAX(position), -1) AS maxPosition FROM watchlist WHERE user_id = ?')
    .get(userId);
  return Number(row?.maxPosition ?? -1) + 1;
}

/**
 * Normalize metadata before persistence and response serialization so the
 * frontend can trust nullable numbers and deduplicated genre names.
 */
function normalizeReleaseYear(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function releaseYearFromDate(releaseDate) {
  if (typeof releaseDate !== 'string') return null;
  return normalizeReleaseYear(releaseDate.slice(0, 4));
}

function normalizeRuntime(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeVoteAverage(value) {
  // SQLite NULLs arrive as JS null, which `Number(null)` coerces to 0 — treat
  // missing values (and TMDB's "unrated" 0) as null so the hydrator re-fetches
  // them instead of baking "0.0" into the UI.
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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
  // SQLite stores JSON text, but callers/tests may pass an array directly.
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
  // Public watchlist rows always expose parsed genres and normalized metadata.
  return {
    ...item,
    release_year: normalizeReleaseYear(item.release_year),
    genres: parseStoredGenres(item.genres),
    runtime: normalizeRuntime(item.runtime),
    vote_average: normalizeVoteAverage(item.vote_average),
  };
}

/**
 * Retrieve TMDB metadata when a saved movie arrives from a sparse search result.
 */
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
    runtime: normalizeRuntime(payload?.runtime),
    vote_average: normalizeVoteAverage(payload?.vote_average),
  };
}

/**
 * Prefer client-provided metadata when it is complete, otherwise fill gaps from
 * TMDB and keep any lookup failure non-fatal to the watchlist action.
 */
async function resolveWatchlistMetadata({ tmdbId, releaseYear, genres, runtime, voteAverage }) {
  const normalizedReleaseYear = normalizeReleaseYear(releaseYear);
  const normalizedGenres = normalizeGenres(genres);
  const normalizedRuntime = normalizeRuntime(runtime);
  const normalizedVoteAverage = normalizeVoteAverage(voteAverage);

  if (
    normalizedReleaseYear !== null
    && normalizedGenres.length > 0
    && normalizedRuntime !== null
    && normalizedVoteAverage !== null
  ) {
    return {
      release_year: normalizedReleaseYear,
      genres: normalizedGenres,
      runtime: normalizedRuntime,
      vote_average: normalizedVoteAverage,
    };
  }

  try {
    const fetchedMetadata = await fetchTmdbMetadata(tmdbId);
    return {
      release_year: normalizedReleaseYear ?? fetchedMetadata.release_year,
      genres: normalizedGenres.length > 0 ? normalizedGenres : fetchedMetadata.genres,
      runtime: normalizedRuntime ?? fetchedMetadata.runtime,
      vote_average: normalizedVoteAverage ?? fetchedMetadata.vote_average,
    };
  } catch (error) {
    console.error(`Watchlist metadata lookup failed for TMDB id ${tmdbId}:`, error);
    return {
      release_year: normalizedReleaseYear,
      genres: normalizedGenres,
      runtime: normalizedRuntime,
      vote_average: normalizedVoteAverage,
    };
  }
}

/**
 * Ensure an existing row has the metadata needed by UI stats and embeddings,
 * persisting any backfilled fields before returning the normalized item.
 */
async function hydrateWatchlistItem(item, userId) {
  const storedReleaseYear = normalizeReleaseYear(item.release_year);
  const storedGenres = parseStoredGenres(item.genres);
  const storedRuntime = normalizeRuntime(item.runtime);
  const storedVoteAverage = normalizeVoteAverage(item.vote_average);
  const resolvedMetadata = await resolveWatchlistMetadata({
    tmdbId: item.tmdb_id,
    releaseYear: storedReleaseYear,
    genres: storedGenres,
    runtime: storedRuntime,
    voteAverage: storedVoteAverage,
  });

  const serializedStoredGenres = serializeGenres(storedGenres);
  const serializedResolvedGenres = serializeGenres(resolvedMetadata.genres);
  const releaseYearChanged = resolvedMetadata.release_year !== storedReleaseYear;
  const genresChanged = serializedResolvedGenres !== serializedStoredGenres;
  const runtimeChanged = resolvedMetadata.runtime !== storedRuntime;
  const voteAverageChanged = resolvedMetadata.vote_average !== storedVoteAverage;

  if (releaseYearChanged || genresChanged || runtimeChanged || voteAverageChanged) {
    updateWatchlistMetadataStmt.run(
      resolvedMetadata.release_year,
      serializedResolvedGenres,
      resolvedMetadata.runtime,
      resolvedMetadata.vote_average,
      item.id,
      userId
    );
  }

  return {
    ...item,
    release_year: resolvedMetadata.release_year,
    genres: resolvedMetadata.genres,
    runtime: resolvedMetadata.runtime,
    vote_average: resolvedMetadata.vote_average,
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
  const requestedRuntime = normalizeRuntime(req.body?.runtime);
  const requestedVoteAverage = normalizeVoteAverage(req.body?.vote_average);

  if (!tmdbId || !title) {
    return res.status(400).json({ error: 'tmdb_id and title are required.' });
  }

  try {
    const metadata = await resolveWatchlistMetadata({
      tmdbId,
      releaseYear: requestedReleaseYear,
      genres: requestedGenres,
      runtime: requestedRuntime,
      voteAverage: requestedVoteAverage,
    });
    const position = getNextPosition(req.user.id);
    const result = insertWatchlistItemStmt.run(
      req.user.id,
      tmdbId,
      title,
      posterPath,
      metadata.release_year,
      serializeGenres(metadata.genres),
      metadata.runtime,
      metadata.vote_average,
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

module.exports = router;
