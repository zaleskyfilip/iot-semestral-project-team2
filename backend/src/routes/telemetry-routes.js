const express = require('express');
const telemetryService = require('../services/telemetry-service');

const router = express.Router();

// POST /api/telemetry
router.post('/', async (req, res) => {
  const output = await telemetryService.receive(req.body);
  
  res.status(output.telemetryId ? 201 : 200).json(output);
});

// POST /api/telemetry/batch
router.post('/batch', async (req, res) => {
  const output = await telemetryService.receiveBatch(req.body);
  res.status(output.savedCount > 0 ? 201 : 200).json(output);
});

// GET /api/telemetry/history?stationId=...&range=7d
router.get('/history', async (req, res) => {
  const output = await telemetryService.getHistory(req.query);
  res.json(output);
});

module.exports = router;