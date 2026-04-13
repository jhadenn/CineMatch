require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const watchlistRoutes = require('./routes/watchlist');
const historyRoutes = require('./routes/history');
const recommendationsRoutes = require('./routes/recommendations');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// TMDB proxy — never exposes the API key to the frontend
app.get('/api/tmdb/*', async (req, res) => {
  try {
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

app.listen(PORT, () => {
  console.log(`CineMatch API running on http://localhost:${PORT}`);
});
