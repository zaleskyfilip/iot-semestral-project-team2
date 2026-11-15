const express = require('express');
const dashboardService = require('../services/dashboard-service');

const router = express.Router();

// GET /api/dashboard/current?stationId=...
router.get('/current', async (req, res) => {
  const output = await dashboardService.getCurrent(req.query);
  res.json(output);
});

module.exports = router;