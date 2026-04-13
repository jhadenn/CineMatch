const express = require('express');
const router = express.Router();

// GET /api/history
router.get('/', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

// POST /api/history
router.post('/', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

// DELETE /api/history/:id
router.delete('/:id', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

module.exports = router;
