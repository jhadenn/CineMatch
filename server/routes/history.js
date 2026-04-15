const express = require('express');
const router = express.Router();
const db = require('../db/database');
const requireAuth = require('../middleware/auth');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const selectHistoryStmt = db.prepare(
  `SELECT id, tmdb_id, title, overview, poster_path, genres, director, release_year, runtime, vote_average, watched_at
   FROM watch_history
   WHERE user_id = ?
   ORDER BY watched_at DESC`
);
const insertHistoryStmt = db.prepare(
  `INSERT OR IGNORE INTO watch_history (user_id, tmdb_id, title, overview, poster_path, genres, director, release_year, runtime, vote_average)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const deleteHistoryStmt = db.prepare(
  'DELETE FROM watch_history WHERE id = ? AND user_id = ?'
);
const selectStatsRowsStmt = db.prepare(
  `SELECT id, tmdb_id, genres, release_year, runtime, vote_average, watched_at
   FROM watch_history
   WHERE user_id = ?`
);
const updateHistoryMetadataStmt = db.prepare(
  'UPDATE watch_history SET genres = ?, release_year = ?, runtime = ?, vote_average = ? WHERE id = ? AND user_id = ?'
);

const MOOD_GENRE_MAP = {
  'Thought-provoking': ['Drama', 'History', 'Documentary', 'War', 'Science Fiction', 'Mystery'],
  Thrilling: ['Action', 'Thriller', 'Crime', 'Adventure'],
  Heartwarming: ['Romance', 'Family', 'Animation', 'Fantasy', 'Music'],
  Dark: ['Horror', 'Crime', 'Thriller', 'Mystery', 'War'],
  'Light-hearted': ['Comedy', 'Animation', 'Family', 'Music', 'Adventure'],
};

function normalizeReleaseYear(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
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

function parseGenres(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
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

function toResponseItem(row) {
  return {
    ...row,
    genres: normalizeGenres(parseGenres(row.genres)),
    runtime: normalizeRuntime(row.runtime),
    vote_average: normalizeVoteAverage(row.vote_average),
    release_year: normalizeReleaseYear(row.release_year),
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
    genres: normalizeGenres(payload?.genres),
    release_year: typeof payload?.release_date === 'string'
      ? normalizeReleaseYear(payload.release_date.slice(0, 4))
      : null,
    runtime: normalizeRuntime(payload?.runtime),
    vote_average: normalizeVoteAverage(payload?.vote_average),
  };
}

async function hydrateHistoryRows(rows, userId) {
  const hydratedRows = [];

  for (const row of rows) {
    const storedGenres = normalizeGenres(parseGenres(row.genres));
    const storedReleaseYear = normalizeReleaseYear(row.release_year);
    const storedRuntime = normalizeRuntime(row.runtime);
    const storedVoteAverage = normalizeVoteAverage(row.vote_average);

    if (
      storedGenres.length > 0
      && storedReleaseYear !== null
      && storedRuntime !== null
      && storedVoteAverage !== null
    ) {
      hydratedRows.push({
        ...row,
        genres: storedGenres,
        release_year: storedReleaseYear,
        runtime: storedRuntime,
        vote_average: storedVoteAverage,
      });
      continue;
    }

    let resolvedGenres = storedGenres;
    let resolvedReleaseYear = storedReleaseYear;
    let resolvedRuntime = storedRuntime;
    let resolvedVoteAverage = storedVoteAverage;

    try {
      const metadata = await fetchTmdbMetadata(row.tmdb_id);
      resolvedGenres = storedGenres.length > 0 ? storedGenres : metadata.genres;
      resolvedReleaseYear = storedReleaseYear ?? metadata.release_year;
      resolvedRuntime = storedRuntime ?? metadata.runtime;
      resolvedVoteAverage = storedVoteAverage ?? metadata.vote_average;
    } catch (error) {
      console.error(`History metadata lookup failed for TMDB id ${row.tmdb_id}:`, error);
    }

    const serializedStoredGenres = JSON.stringify(storedGenres);
    const serializedResolvedGenres = JSON.stringify(resolvedGenres);
    if (
      serializedStoredGenres !== serializedResolvedGenres
      || resolvedReleaseYear !== storedReleaseYear
      || resolvedRuntime !== storedRuntime
      || resolvedVoteAverage !== storedVoteAverage
    ) {
      updateHistoryMetadataStmt.run(
        serializedResolvedGenres,
        resolvedReleaseYear,
        resolvedRuntime,
        resolvedVoteAverage,
        row.id,
        userId
      );
    }

    hydratedRows.push({
      ...row,
      genres: resolvedGenres,
      release_year: resolvedReleaseYear,
      runtime: resolvedRuntime,
      vote_average: resolvedVoteAverage,
    });
  }

  return hydratedRows;
}

function extractMonthKey(watchedAt) {
  if (typeof watchedAt !== 'string' || watchedAt.length < 7) return null;
  const prefix = watchedAt.slice(0, 7);
  return /^\d{4}-\d{2}$/.test(prefix) ? prefix : null;
}

function fillMonthGaps(monthCounts) {
  if (monthCounts.size === 0) return [];

  const sortedKeys = [...monthCounts.keys()].sort();
  const [firstYear, firstMonth] = sortedKeys[0].split('-').map(Number);
  const [lastYear, lastMonth] = sortedKeys[sortedKeys.length - 1].split('-').map(Number);

  const result = [];
  let year = firstYear;
  let month = firstMonth;
  while (year < lastYear || (year === lastYear && month <= lastMonth)) {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    result.push({ month: key, count: monthCounts.get(key) || 0 });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return result;
}

function buildMoodPreferences(moodCounts) {
  const moods = Object.keys(MOOD_GENRE_MAP);
  const maxCount = Math.max(0, ...moods.map((mood) => moodCounts.get(mood) || 0));

  return moods.map((mood) => {
    const rawCount = moodCounts.get(mood) || 0;
    return {
      mood,
      rawCount,
      score: maxCount > 0 ? Math.round((rawCount / maxCount) * 100) : 0,
    };
  });
}

function buildStats(rows) {
  const totalWatched = rows.length;
  if (totalWatched === 0) {
    return {
      totalWatched: 0,
      totalRuntimeMinutes: 0,
      averageRating: null,
      watchedThisMonth: 0,
      genreBreakdown: [],
      timeline: [],
      moviesByDecade: [],
      moodPreferences: buildMoodPreferences(new Map()),
    };
  }

  const genreCounts = new Map();
  const decadeCounts = new Map();
  const monthCounts = new Map();
  const moodCounts = new Map(Object.keys(MOOD_GENRE_MAP).map((mood) => [mood, 0]));

  let totalRuntimeMinutes = 0;
  let ratingSum = 0;
  let ratedCount = 0;

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  let watchedThisMonth = 0;

  for (const row of rows) {
    const genres = normalizeGenres(row.genres);

    for (const genre of genres) {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);

      for (const [mood, mappedGenres] of Object.entries(MOOD_GENRE_MAP)) {
        if (mappedGenres.includes(genre)) {
          moodCounts.set(mood, (moodCounts.get(mood) || 0) + 1);
        }
      }
    }

    const releaseYear = normalizeReleaseYear(row.release_year);
    if (releaseYear !== null) {
      const decade = Math.floor(releaseYear / 10) * 10;
      decadeCounts.set(decade, (decadeCounts.get(decade) || 0) + 1);
    }

    const runtime = normalizeRuntime(row.runtime);
    if (runtime !== null) {
      totalRuntimeMinutes += runtime;
    }

    const voteAverage = normalizeVoteAverage(row.vote_average);
    if (voteAverage !== null) {
      ratingSum += voteAverage;
      ratedCount += 1;
    }

    const monthKey = extractMonthKey(row.watched_at);
    if (monthKey) {
      monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
      if (monthKey === currentMonthKey) {
        watchedThisMonth += 1;
      }
    }
  }

  const genreBreakdown = [...genreCounts.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre));

  const moviesByDecade = [...decadeCounts.entries()]
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => a.decade - b.decade);

  return {
    totalWatched,
    totalRuntimeMinutes,
    averageRating: ratedCount > 0 ? Number((ratingSum / ratedCount).toFixed(1)) : null,
    watchedThisMonth,
    genreBreakdown,
    timeline: fillMonthGaps(monthCounts),
    moviesByDecade,
    moodPreferences: buildMoodPreferences(moodCounts),
  };
}

// GET /api/history
router.get('/', requireAuth, async (req, res) => {
  try {
    const rows = selectHistoryStmt.all(req.user.id);
    const hydratedRows = await hydrateHistoryRows(rows, req.user.id);
    return res.json(hydratedRows.map(toResponseItem));
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
  const genres = Array.isArray(req.body?.genres) ? normalizeGenres(req.body.genres) : [];
  const director = req.body?.director ? String(req.body.director) : null;
  const releaseYear = normalizeReleaseYear(req.body?.release_year);
  const runtime = normalizeRuntime(req.body?.runtime);
  const voteAverage = normalizeVoteAverage(req.body?.vote_average);

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
      releaseYear,
      runtime,
      voteAverage
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
      runtime,
      vote_average: voteAverage,
    });
  } catch (error) {
    if (String(error?.message || '').includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Movie already in watch history.' });
    }
    console.error('History add error:', error);
    return res.status(500).json({ error: 'Failed to add to watch history.' });
  }
});

// GET /api/history/stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const rows = selectStatsRowsStmt.all(req.user.id);
    const hydratedRows = await hydrateHistoryRows(rows, req.user.id);
    return res.json(buildStats(hydratedRows));
  } catch (error) {
    console.error('History stats error:', error);
    return res.status(500).json({ error: 'Failed to load watch history stats.' });
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
