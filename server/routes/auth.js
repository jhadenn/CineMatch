const express = require('express');
const router = express.Router();

// These endpoints are scaffolded so the frontend can wire against the intended
// API contract before auth persistence and hashing are implemented.
function respondNotImplemented(res) {
  return res.status(501).json({ error: 'Not implemented yet' });
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  return respondNotImplemented(res);
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  return respondNotImplemented(res);
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  return respondNotImplemented(res);
});

module.exports = router;
