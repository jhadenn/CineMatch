const OpenAI = require('openai');
const db = require('../db/database');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generate and cache an embedding for a movie
async function getEmbedding(movie) {
  const existing = db.prepare(
    'SELECT embedding FROM movie_embeddings WHERE tmdb_id = ?'
  ).get(movie.tmdb_id);

  if (existing) return JSON.parse(existing.embedding);

  const input = `${movie.title}. ${movie.overview}. Genres: ${movie.genres.join(', ')}. Director: ${movie.director ?? 'Unknown'}.`;
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input,
  });

  const vector = response.data[0].embedding;
  db.prepare(
    'INSERT OR IGNORE INTO movie_embeddings (tmdb_id, embedding) VALUES (?, ?)'
  ).run(movie.tmdb_id, JSON.stringify(vector));

  return vector;
}

// Cosine similarity between two vectors
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

// Average a list of vectors into one profile vector
function averageVectors(vectors) {
  const len = vectors[0].length;
  const sum = new Array(len).fill(0);
  for (const vec of vectors) vec.forEach((v, i) => { sum[i] += v; });
  return sum.map(v => v / vectors.length);
}

// Main export — called by GET /api/recommendations
async function getRecommendations(watchedMovies, candidates) {
  if (watchedMovies.length === 0) return candidates.slice(0, 10);

  const watchedVectors = await Promise.all(watchedMovies.map(getEmbedding));
  const profile = averageVectors(watchedVectors);

  const scored = await Promise.all(
    candidates.map(async movie => ({
      ...movie,
      score: cosineSimilarity(profile, await getEmbedding(movie)),
    }))
  );

  return scored.sort((a, b) => b.score - a.score).slice(0, 20);
}

module.exports = { getRecommendations };
