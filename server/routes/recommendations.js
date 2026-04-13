const express = require('express');
const router = express.Router();

// The scoring service exists, but the HTTP layer still needs wiring for user
// history lookup and candidate selection.
function respondNotImplemented(res) {
  return res.status(501).json({ error: 'Not implemented yet' });
}

// GET /api/recommendations
router.get('/', (req, res) => {
  return respondNotImplemented(res);
});

module.exports = router;
