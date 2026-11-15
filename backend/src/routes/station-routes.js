const express = require('express');
const stationDao = require('../dao/station-dao');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

// GET /api/stations
router.get('/', authorize('USER', 'ADMIN'), async (req, res) => {
  const stations = await stationDao.findAll();
  res.json({ stations });
});

module.exports = router;