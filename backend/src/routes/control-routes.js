const express = require('express');
const controlService = require('../services/control-service');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

// POST /api/control/action - the admin sends a command
router.post('/action', authorize('ADMIN'), async (req, res) => {
  const output = await controlService.sendAction(req.body);
  res.status(201).json(output);
});

// GET /api/control/pending?stationId=... - the station picks up its commands
router.get('/pending', authorize('EDGE'), async (req, res) => {
  const output = await controlService.takePending(req.query);
  res.json(output);
});

module.exports = router;