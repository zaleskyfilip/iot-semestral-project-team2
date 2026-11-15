const express = require('express');
const controlService = require('../services/control-service');

const router = express.Router();

// POST /api/control/action - the admin sends a command
router.post('/action', async (req, res) => {
  const output = await controlService.sendAction(req.body);
  res.status(201).json(output);
});

// GET /api/control/pending?stationId=... - the station picks up its commands
router.get('/pending', async (req, res) => {
  const output = await controlService.takePending(req.query);
  res.json(output);
});

module.exports = router;