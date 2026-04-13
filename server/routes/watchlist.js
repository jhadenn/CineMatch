const express = require('express');
const router = express.Router();

// GET /api/watchlist
router.get('/', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

// POST /api/watchlist
router.post('/', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

// DELETE /api/watchlist/:id
router.delete('/:id', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

// PATCH /api/watchlist/order
router.patch('/order', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

// GET /api/watchlist/share/:token
router.get('/share/:token', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

module.exports = router;
