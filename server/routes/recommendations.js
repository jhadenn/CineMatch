const express = require('express');
const router = express.Router();
const db = require('../db/database');
const requireAuth = require('../middleware/auth');
const {
  getRecommendations,
  getEmbedding,
  averageVectors,
  cosineSimilarity,
} = require('../services/recommender');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// In-memory genre map: id → name. Populated once on first request.
let genreMap = null;

async function tmdbFetch(path, params = {}) {
  const query = new URLSearchParams(params);
  query.set('api_key', process.env.TMDB_API_KEY);
  const url = `${TMDB_BASE_URL}/${path}?${query.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${path} failed: ${res.status}`);
  return res.json();
}

async function loadGenreMap() {
  if (genreMap) return genreMap;
  const data = await tmdbFetch('genre/movie/list');
  genreMap = new Map((data.genres || []).map(g => [g.id, g.name]));
  return genreMap;
}

function mapGenreIds(genreIds, gMap) {
  return (genreIds || []).map(id => gMap.get(id)).filter(Boolean);
}

const selectHistoryStmt = db.prepare(
  `SELECT tmdb_id, title, overview, poster_path, genres, director, release_year
   FROM watch_history WHERE user_id = ?`
);
const selectWatchlistProfileStmt = db.prepare(
  `SELECT tmdb_id, title, poster_path, release_year, genres
   FROM watchlist WHERE user_id = ?`
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

function toMovieSummary(movie) {
  return {
    tmdb_id: movie.id,
    title: movie.title,
    overview: movie.overview,
    poster_path: movie.poster_path,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
    vote_count: movie.vote_count,
  };
}

// Cap how many seed movies we fan out from so a huge watch history doesn't
// explode into hundreds of TMDB calls per recommendation request.
const MAX_SEED_MOVIES = 8;
const MAX_CANDIDATES = 120;

async function fetchSeededCandidates(seedIds) {
  // For each taste seed, TMDB knows a set of movies that other viewers of that
  // title also enjoyed. Pulling those in is what makes the candidate pool
  // actually reflect the user's taste instead of just "what's popular".
  const results = await Promise.allSettled(
    seedIds.flatMap((id) => [
      tmdbFetch(`movie/${id}/recommendations`),
      tmdbFetch(`movie/${id}/similar`),
    ])
  );

  const movies = [];
  for (const entry of results) {
    if (entry.status !== 'fulfilled') continue;
    for (const movie of entry.value.results || []) {
      movies.push(movie);
    }
  }
  return movies;
}

function pickSeedIds(profileMovies) {
  const seen = new Set();
  const ids = [];

  // Prefer the most recent / highest-weighted taste signals first.
  const ordered = [...profileMovies].sort((a, b) => (b.weight || 1) - (a.weight || 1));
  for (const movie of ordered) {
    const id = Number(movie.tmdb_id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= MAX_SEED_MOVIES) break;
  }
  return ids;
}

async function buildCandidates(excludeIds, profileMovies = []) {
  const gMap = await loadGenreMap();
  const seedIds = pickSeedIds(profileMovies);

  const tasks = [
    tmdbFetch('trending/movie/week'),
    tmdbFetch('movie/popular'),
    tmdbFetch('movie/popular', { page: 2 }),
    tmdbFetch('movie/top_rated'),
  ];

  const [trendingData, popularData, popularData2, topRatedData] =
    await Promise.all(tasks.map((p) => p.catch(() => ({ results: [] }))));

  const seededMovies = seedIds.length ? await fetchSeededCandidates(seedIds) : [];

  const seen = new Set();
  const candidates = [];

  // Personalized candidates (TMDB similar/recommendations) first so they win
  // the dedupe race against generic popular titles with the same id.
  const pools = [
    seededMovies,
    trendingData.results || [],
    popularData.results || [],
    popularData2.results || [],
    topRatedData.results || [],
  ];

  for (const pool of pools) {
    for (const movie of pool) {
      if (!movie?.id) continue;
      if (seen.has(movie.id) || excludeIds.has(movie.id)) continue;
      seen.add(movie.id);
      candidates.push({
        ...toMovieSummary(movie),
        genres: mapGenreIds(movie.genre_ids, gMap),
        director: null,
      });
      if (candidates.length >= MAX_CANDIDATES) return candidates;
    }
  }

  return candidates;
}

async function fetchPopularFallback(excludeIds = new Set()) {
  const fallback = await tmdbFetch('movie/popular');
  return (fallback.results || [])
    .filter((movie) => !excludeIds.has(movie.id))
    .slice(0, 20)
    .map((movie) => ({
      ...toMovieSummary(movie),
      genres: [],
    }));
}

// GET /api/recommendations
router.get('/', requireAuth, async (req, res) => {
  const excludeIds = new Set();

  try {
    // 1. Load the user's explicit taste signals
    const historyRows = selectHistoryStmt.all(req.user.id);
    const watchedMovies = historyRows.map(row => ({
      ...row,
      genres: parseGenres(row.genres),
    }));
    const watchlistRows = selectWatchlistProfileStmt.all(req.user.id);
    const watchlistMovies = watchlistRows.map(row => ({
      ...row,
      overview: '',
      director: null,
      genres: parseGenres(row.genres),
    }));
    const profileMovies = [
      ...watchedMovies.map(movie => ({ ...movie, weight: 2 })),
      ...watchlistMovies.map(movie => ({ ...movie, weight: 1 })),
    ];

    // 2. Build exclusion set (watched + watchlist)
    for (const movie of watchedMovies) excludeIds.add(movie.tmdb_id);
    for (const movie of watchlistMovies) excludeIds.add(movie.tmdb_id);

    // 3. Fetch candidates from TMDB (trending + popular + seeded similar/recommendations),
    //    dedupe and filter out anything the user has already watched or saved.
    const candidates = await buildCandidates(excludeIds, profileMovies);

    if (profileMovies.length === 0) {
      return res.json({
        items: candidates.slice(0, 20),
        meta: { mode: 'cold_start' },
      });
    }

    // 4. Score and return
    try {
      const items = await getRecommendations(profileMovies, candidates);
      return res.json({
        items,
        meta: { mode: 'personalized' },
      });
    } catch (error) {
      console.error('Recommendation scoring error:', error);
      return res.json({
        items: candidates.slice(0, 20),
        meta: { mode: 'fallback', reason: 'scoring_unavailable' },
      });
    }
  } catch (error) {
    console.error('Recommendations error:', error);

    // Fallback: return TMDB popular movies so the endpoint rarely 500s.
    try {
      const items = await fetchPopularFallback(excludeIds);
      return res.json({
        items,
        meta: { mode: 'fallback', reason: 'scoring_unavailable' },
      });
    } catch {
      return res.status(500).json({ error: 'Failed to load recommendations.' });
    }
  }
});

function loadProfileMovies(userId) {
  const watchedMovies = selectHistoryStmt.all(userId).map((row) => ({
    ...row,
    genres: parseGenres(row.genres),
    weight: 2,
  }));
  const watchlistMovies = selectWatchlistProfileStmt.all(userId).map((row) => ({
    ...row,
    overview: '',
    director: null,
    genres: parseGenres(row.genres),
    weight: 1,
  }));
  return [...watchedMovies, ...watchlistMovies];
}

// Text-embedding cosine scores for related content cluster in a narrow band.
// Stretching [0.2, 0.8] to [0%, 100%] yields a percentage that actually
// varies instead of being perpetually stuck in the 60s and 70s.
function scoreToPercent(score) {
  if (!Number.isFinite(score)) return null;
  const normalized = (score - 0.2) / 0.6;
  const clamped = Math.max(0, Math.min(1, normalized));
  return Math.round(clamped * 100);
}

// GET /api/recommendations/match/:tmdbId
// Returns a personalized "% match" for a single movie against the logged-in
// user's taste profile. The movie detail page calls this to render the pill.
router.get('/match/:tmdbId', requireAuth, async (req, res) => {
  const tmdbId = Number(req.params.tmdbId);
  if (!tmdbId) {
    return res.status(400).json({ error: 'Invalid tmdb_id.' });
  }

  try {
    const profileMovies = loadProfileMovies(req.user.id);
    if (profileMovies.length === 0) {
      return res.json({ score: null, percent: null, mode: 'cold_start' });
    }

    // If the user has already watched or saved this title, surface that
    // directly — a "% match" for something they've already committed to is
    // redundant and can confuse the reader.
    if (profileMovies.some((movie) => Number(movie.tmdb_id) === tmdbId)) {
      return res.json({ score: null, percent: null, mode: 'in_profile' });
    }

    const profileEmbeddings = await Promise.all(profileMovies.map(getEmbedding));
    const profileVector = averageVectors(
      profileEmbeddings,
      profileMovies.map((movie) => movie.weight || 1)
    );

    const movieVector = await getEmbedding({ tmdb_id: tmdbId });
    const score = cosineSimilarity(profileVector, movieVector);
    const percent = scoreToPercent(score);

    return res.json({ score, percent, mode: 'personalized' });
  } catch (error) {
    console.error('Match scoring error:', error);
    return res.status(500).json({ error: 'Failed to compute match.' });
  }
});

module.exports = router;
