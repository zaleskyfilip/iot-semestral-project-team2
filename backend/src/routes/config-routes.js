const express = require('express');
const configService = require('../services/config-service');

const router = express.Router();

// GET /api/config?stationId=...
router.get('/', async (req, res) => {
  const output = await configService.get(req.query);
  res.json(output);
});

// PUT /api/config
router.put('/', async (req, res) => {
  const output = await configService.update(req.body);
  res.json(output);
});

module.exports = router;