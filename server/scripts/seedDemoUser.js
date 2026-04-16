const path = require('path');
const bcrypt = require('bcrypt');

require('dotenv').config({
  path: path.resolve(__dirname, '..', '..', '.env'),
});

const db = require('../db/database');
const { getEmbedding } = require('../services/recommender');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const DEMO_USER = {
  email: 'demo.anime@cinematch.local',
  username: 'John',
  password: 'password',
};

const WATCH_HISTORY_SEEDS = [
  { title: 'Akira', releaseYear: 1988, watchedAt: '2025-09-14 20:00:00' },
  { title: 'Ghost in the Shell', releaseYear: 1995, watchedAt: '2025-09-29 20:00:00' },
  { title: 'Princess Mononoke', releaseYear: 1997, watchedAt: '2025-10-18 20:00:00' },
  { title: 'Spirited Away', releaseYear: 2001, watchedAt: '2025-11-09 20:00:00' },
  { title: 'Perfect Blue', releaseYear: 1998, watchedAt: '2025-12-02 20:00:00' },
  { title: 'Your Name.', releaseYear: 2016, watchedAt: '2026-01-11 20:00:00' },
  { title: 'A Silent Voice: The Movie', releaseYear: 2016, watchedAt: '2026-02-06 20:00:00' },
  { title: 'Jujutsu Kaisen 0', releaseYear: 2021, watchedAt: '2026-02-28 20:00:00' },
  { title: 'Suzume', releaseYear: 2022, watchedAt: '2026-03-22 20:00:00' },
  { title: 'The Boy and the Heron', releaseYear: 2023, watchedAt: '2026-04-09 20:00:00' },
];

const WATCHLIST_SEEDS = [
  { title: "Howl's Moving Castle", releaseYear: 2004, position: 0, addedAt: '2026-04-10 18:00:00' },
  { title: 'Paprika', releaseYear: 2006, position: 1, addedAt: '2026-04-10 18:10:00' },
  { title: 'Wolf Children', releaseYear: 2012, position: 2, addedAt: '2026-04-11 18:00:00' },
  { title: 'Belle', releaseYear: 2021, position: 3, addedAt: '2026-04-12 18:00:00' },
  { title: 'Promare', releaseYear: 2019, position: 4, addedAt: '2026-04-13 18:00:00' },
  { title: 'Redline', releaseYear: 2009, position: 5, addedAt: '2026-04-14 18:00:00' },
];

const upsertUserStmt = db.prepare(`
  INSERT INTO users (email, password, username)
  VALUES (?, ?, ?)
  ON CONFLICT(email) DO UPDATE SET
    password = excluded.password,
    username = excluded.username
`);
const selectUserStmt = db.prepare(`
  SELECT id, email, username
  FROM users
  WHERE email = ?
`);
const deleteWatchlistStmt = db.prepare('DELETE FROM watchlist WHERE user_id = ?');
const deleteHistoryStmt = db.prepare('DELETE FROM watch_history WHERE user_id = ?');
const insertHistoryStmt = db.prepare(`
  INSERT INTO watch_history (
    user_id,
    tmdb_id,
    title,
    overview,
    poster_path,
    genres,
    director,
    release_year,
    runtime,
    vote_average,
    watched_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertWatchlistStmt = db.prepare(`
  INSERT INTO watchlist (
    user_id,
    tmdb_id,
    title,
    poster_path,
    release_year,
    genres,
    runtime,
    vote_average,
    position,
    added_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const countHistoryStmt = db.prepare('SELECT COUNT(*) AS count FROM watch_history WHERE user_id = ?');
const countWatchlistStmt = db.prepare('SELECT COUNT(*) AS count FROM watchlist WHERE user_id = ?');

function requireEnv(name) {
  if (!process.env[name]) {
    throw new Error(`${name} is required to seed the demo user.`);
  }
}

function normalizeTitle(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function normalizeGenres(genres) {
  if (!Array.isArray(genres)) return [];

  const seen = new Set();
  const normalized = [];
  for (const entry of genres) {
    const name = typeof entry?.name === 'string'
      ? entry.name.trim()
      : typeof entry === 'string'
        ? entry.trim()
        : '';

    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(name);
  }

  return normalized;
}

function normalizeReleaseYear(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRuntime(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeVoteAverage(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function extractDirector(credits) {
  return (credits?.crew || []).find((person) => person.job === 'Director')?.name || null;
}

async function tmdbFetch(route, params = {}) {
  const query = new URLSearchParams(params);
  query.set('api_key', process.env.TMDB_API_KEY);

  const response = await fetch(`${TMDB_BASE_URL}/${route}?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`TMDB ${route} failed with status ${response.status}.`);
  }

  return response.json();
}

async function resolveTmdbMovie(seed) {
  const searchPayload = await tmdbFetch('search/movie', {
    query: seed.title,
    include_adult: 'false',
    year: String(seed.releaseYear),
  });

  const normalizedSeedTitle = normalizeTitle(seed.title);
  const exactMatch = (searchPayload.results || []).find((movie) => {
    const releaseYear = normalizeReleaseYear(String(movie.release_date || '').slice(0, 4));
    if (releaseYear !== seed.releaseYear) return false;

    return [movie.title, movie.original_title].some(
      (candidate) => normalizeTitle(candidate) === normalizedSeedTitle
    );
  });

  if (!exactMatch) {
    const candidates = (searchPayload.results || [])
      .slice(0, 5)
      .map((movie) => `${movie.title || 'Untitled'} (${String(movie.release_date || '').slice(0, 4) || '----'})`)
      .join(', ');
    throw new Error(`Could not resolve "${seed.title}" (${seed.releaseYear}). Candidates: ${candidates || 'none'}`);
  }

  const details = await tmdbFetch(`movie/${exactMatch.id}`, {
    append_to_response: 'credits',
  });

  return {
    tmdb_id: details.id,
    title: details.title,
    overview: String(details.overview || '').trim(),
    poster_path: details.poster_path || null,
    genres: normalizeGenres(details.genres),
    director: extractDirector(details.credits),
    release_year: normalizeReleaseYear(String(details.release_date || '').slice(0, 4)) || seed.releaseYear,
    runtime: normalizeRuntime(details.runtime),
    vote_average: normalizeVoteAverage(details.vote_average),
    release_date: details.release_date || null,
    vote_count: Number.isFinite(Number(details.vote_count)) ? Number(details.vote_count) : null,
  };
}

async function resolveSeedMovies() {
  const historyMovies = [];
  for (const seed of WATCH_HISTORY_SEEDS) {
    historyMovies.push({
      ...(await resolveTmdbMovie(seed)),
      watched_at: seed.watchedAt,
    });
  }

  const watchlistMovies = [];
  for (const seed of WATCHLIST_SEEDS) {
    watchlistMovies.push({
      ...(await resolveTmdbMovie(seed)),
      position: seed.position,
      added_at: seed.addedAt,
    });
  }

  return { historyMovies, watchlistMovies };
}

const seedUserTransaction = db.transaction((payload) => {
  upsertUserStmt.run(DEMO_USER.email, payload.passwordHash, DEMO_USER.username);
  const user = selectUserStmt.get(DEMO_USER.email);
  if (!user) {
    throw new Error('Failed to load the seeded demo user after upsert.');
  }

  deleteWatchlistStmt.run(user.id);
  deleteHistoryStmt.run(user.id);

  for (const movie of payload.historyMovies) {
    insertHistoryStmt.run(
      user.id,
      movie.tmdb_id,
      movie.title,
      movie.overview,
      movie.poster_path,
      JSON.stringify(movie.genres),
      movie.director,
      movie.release_year,
      movie.runtime,
      movie.vote_average,
      movie.watched_at
    );
  }

  for (const movie of payload.watchlistMovies) {
    insertWatchlistStmt.run(
      user.id,
      movie.tmdb_id,
      movie.title,
      movie.poster_path,
      movie.release_year,
      JSON.stringify(movie.genres),
      movie.runtime,
      movie.vote_average,
      movie.position,
      movie.added_at
    );
  }

  return user;
});

async function warmEmbeddings(movies) {
  for (const movie of movies) {
    await getEmbedding({
      tmdb_id: movie.tmdb_id,
      title: movie.title,
      overview: movie.overview || '',
      genres: movie.genres,
      director: movie.director,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
    });
  }
}

async function main() {
  requireEnv('TMDB_API_KEY');
  requireEnv('OPENAI_API_KEY');

  const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);
  const { historyMovies, watchlistMovies } = await resolveSeedMovies();
  const user = seedUserTransaction({ passwordHash, historyMovies, watchlistMovies });

  await warmEmbeddings([...historyMovies, ...watchlistMovies]);

  const historyCount = countHistoryStmt.get(user.id).count;
  const watchlistCount = countWatchlistStmt.get(user.id).count;

  console.log(JSON.stringify({
    ok: true,
    user: {
      email: DEMO_USER.email,
      username: DEMO_USER.username,
      password: DEMO_USER.password,
      id: user.id,
    },
    counts: {
      watch_history: historyCount,
      watchlist: watchlistCount,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error('[seed:demo-user] Failed:', error);
  process.exitCode = 1;
});
