const express = require('express');
const telemetryService = require('../services/telemetry-service');

const router = express.Router();

// POST /api/telemetry
router.post('/', async (req, res) => {
  const output = await telemetryService.receive(req.body);
  
  res.status(output.telemetryId ? 201 : 200).json(output);
});

module.exports = router;