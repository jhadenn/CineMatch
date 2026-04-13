const express = require('express');
const router = express.Router();

// History endpoints stay stubbed until persistence rules and the dashboard/
// recommendation integration are finalized.
function respondNotImplemented(res) {
  return res.status(501).json({ error: 'Not implemented yet' });
}

// GET /api/history
router.get('/', (req, res) => {
  return respondNotImplemented(res);
});

// POST /api/history
router.post('/', (req, res) => {
  return respondNotImplemented(res);
});

// DELETE /api/history/:id
router.delete('/:id', (req, res) => {
  return respondNotImplemented(res);
});

module.exports = router;
