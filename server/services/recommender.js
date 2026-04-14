const crypto = require('crypto');
const OpenAI = require('openai');
const db = require('../db/database');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const selectEmbeddingStmt = db.prepare(
  'SELECT embedding, content_hash FROM movie_embeddings WHERE tmdb_id = ?'
);
const upsertEmbeddingStmt = db.prepare(
  `INSERT INTO movie_embeddings (tmdb_id, embedding, content_hash)
   VALUES (?, ?, ?)
   ON CONFLICT(tmdb_id) DO UPDATE SET
     embedding = excluded.embedding,
     content_hash = excluded.content_hash`
);

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeDirector(value) {
  const director = normalizeString(value);
  return director || null;
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

function buildEmbeddingInput(movie) {
  const genres = normalizeGenres(movie.genres).join(', ');
  const director = normalizeDirector(movie.director) ?? 'Unknown';
  return `${movie.title}. ${normalizeString(movie.overview)}. Genres: ${genres}. Director: ${director}.`;
}

function hashEmbeddingInput(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

async function tmdbFetch(path, params = {}) {
  if (!process.env.TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not configured.');
  }

  const query = new URLSearchParams(params);
  query.set('api_key', process.env.TMDB_API_KEY);
  const url = `${TMDB_BASE_URL}/${path}?${query.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB ${path} failed: ${response.status}`);
  }
  return response.json();
}

async function fetchMovieMetadata(tmdbId) {
  const data = await tmdbFetch(`movie/${tmdbId}`, { append_to_response: 'credits' });
  const director = (data.credits?.crew || []).find((person) => person.job === 'Director');

  return {
    title: normalizeString(data.title),
    overview: normalizeString(data.overview),
    genres: normalizeGenres(data.genres),
    director: normalizeDirector(director?.name),
    release_date: data.release_date || null,
    poster_path: data.poster_path || null,
    vote_average: data.vote_average,
    vote_count: data.vote_count,
  };
}

function needsHydration(movie) {
  // Only hit TMDB when we're missing the core semantic content. Director is
  // nice-to-have but the overview + genres are what actually drive
  // similarity, and fetching director for every candidate would cost one
  // TMDB call per candidate per request.
  return !normalizeString(movie.overview)
    || normalizeGenres(movie.genres).length === 0;
}

async function hydrateMovieForEmbedding(movie) {
  let metadata = null;

  if (movie.tmdb_id && needsHydration(movie)) {
    try {
      metadata = await fetchMovieMetadata(movie.tmdb_id);
    } catch (error) {
      console.warn(`TMDB hydration failed for ${movie.tmdb_id}:`, error.message);
    }
  }

  const title = normalizeString(movie.title) || normalizeString(metadata?.title) || 'Untitled';
  const overview = normalizeString(movie.overview) || normalizeString(metadata?.overview);
  const genres = normalizeGenres(movie.genres).length
    ? normalizeGenres(movie.genres)
    : normalizeGenres(metadata?.genres);
  const director = normalizeDirector(movie.director) || normalizeDirector(metadata?.director);

  return {
    ...movie,
    title,
    overview,
    genres,
    director,
    release_date: movie.release_date || metadata?.release_date || null,
    poster_path: movie.poster_path || metadata?.poster_path || null,
    vote_average: movie.vote_average ?? metadata?.vote_average,
    vote_count: movie.vote_count ?? metadata?.vote_count,
  };
}

/**
 * Generate and cache an embedding for a movie.
 * Returns a 1536-dimension vector (array of floats).
 */
async function getEmbedding(movie) {
  const canonicalMovie = await hydrateMovieForEmbedding(movie);
  const input = buildEmbeddingInput(canonicalMovie);
  const contentHash = hashEmbeddingInput(input);
  const existing = selectEmbeddingStmt.get(canonicalMovie.tmdb_id);

  if (existing?.content_hash === contentHash) {
    try {
      return JSON.parse(existing.embedding);
    } catch {
      // Fall through and recompute the embedding if the cached JSON is invalid.
    }
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input,
  });

  const vector = response.data[0].embedding;
  upsertEmbeddingStmt.run(canonicalMovie.tmdb_id, JSON.stringify(vector), contentHash);

  return vector;
}

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

/**
 * Average a list of vectors into one profile vector, optionally weighting
 * stronger preference signals more heavily.
 */
function averageVectors(vectors, weights = []) {
  const len = vectors[0].length;
  const sum = new Array(len).fill(0);
  let totalWeight = 0;

  for (const [index, vec] of vectors.entries()) {
    const weight = Number(weights[index]) > 0 ? Number(weights[index]) : 1;
    totalWeight += weight;
    vec.forEach((value, vectorIndex) => {
      sum[vectorIndex] += value * weight;
    });
  }

  return sum.map((value) => value / totalWeight);
}

/**
 * Score candidate movies against the user's weighted taste profile.
 */
async function getRecommendations(profileMovies, candidates) {
  const weightedVectors = await Promise.all(
    profileMovies.map(async (movie) => ({
      weight: Number(movie.weight) > 0 ? Number(movie.weight) : 1,
      vector: await getEmbedding(movie),
    }))
  );
  const profile = averageVectors(
    weightedVectors.map((entry) => entry.vector),
    weightedVectors.map((entry) => entry.weight)
  );

  const scored = await Promise.all(
    candidates.map(async (movie) => {
      const canonicalMovie = await hydrateMovieForEmbedding(movie);
      return {
        ...canonicalMovie,
        score: cosineSimilarity(profile, await getEmbedding(canonicalMovie)),
      };
    })
  );

  return scored.sort((a, b) => b.score - a.score).slice(0, 20);
}

module.exports = {
  getEmbedding,
  cosineSimilarity,
  averageVectors,
  getRecommendations,
  hydrateMovieForEmbedding,
};
