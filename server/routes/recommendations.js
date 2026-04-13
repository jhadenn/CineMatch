const express = require('express');
const router = express.Router();

// GET /api/recommendations
router.get('/', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

module.exports = router;
