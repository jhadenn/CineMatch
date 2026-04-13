const express = require('express');
const router = express.Router();

// Route stubs double as an API contract while the watchlist feature is still
// being connected to auth, database writes, and sharing logic.
function respondNotImplemented(res) {
  return res.status(501).json({ error: 'Not implemented yet' });
}

// GET /api/watchlist
router.get('/', (req, res) => {
  return respondNotImplemented(res);
});

// POST /api/watchlist
router.post('/', (req, res) => {
  return respondNotImplemented(res);
});

// DELETE /api/watchlist/:id
router.delete('/:id', (req, res) => {
  return respondNotImplemented(res);
});

// PATCH /api/watchlist/order
router.patch('/order', (req, res) => {
  return respondNotImplemented(res);
});

// GET /api/watchlist/share/:token
router.get('/share/:token', (req, res) => {
  return respondNotImplemented(res);
});

module.exports = router;
