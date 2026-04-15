/**
 * Bootstraps the Express API.
 *
 * The server exposes the app's own REST routes and proxies TMDB calls so the
 * browser never needs direct access to the TMDB API key.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const authRoutes = require('./routes/auth');
const watchlistRoutes = require('./routes/watchlist');
const historyRoutes = require('./routes/history');
const recommendationsRoutes = require('./routes/recommendations');

const app = express();
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');
const hasClientBuild = fs.existsSync(clientIndexPath);
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// In development the Vite client runs on a separate origin. In production the
// compiled SPA is served by this same Express app.
if (!hasClientBuild || process.env.CLIENT_ORIGIN) {
  app.use(cors({ origin: clientOrigin }));
}
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// TMDB proxy — never exposes the API key to the frontend
/**
 * Forward TMDB requests through the backend so frontend code can call
 * `/api/tmdb/...` without embedding secrets in the browser bundle.
 */
app.get('/api/tmdb/*', async (req, res) => {
  try {
    // Express stores the wildcard portion of `/api/tmdb/*` in `params[0]`.
    const tmdbPath = req.params[0];
    const query = new URLSearchParams(req.query);
    query.set('api_key', process.env.TMDB_API_KEY);

    const url = `https://api.themoviedb.org/3/${tmdbPath}?${query.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (err) {
    console.error('TMDB proxy error:', err);
    res.status(500).json({ error: 'Failed to fetch from TMDB' });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

if (hasClientBuild) {
  app.use(express.static(clientDistPath));

  // Let Vue Router own non-API routes once the built client exists.
  app.get('*', (req, res) => {
    res.sendFile(clientIndexPath);
  });
}

app.listen(PORT, () => {
  console.log(`CineMatch API running on http://localhost:${PORT}`);
});
