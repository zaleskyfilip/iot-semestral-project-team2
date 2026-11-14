const express = require('express');
const stationDao = require('../dao/station-dao');

const router = express.Router();

// GET /api/stations
router.get('/', async (req, res) => {
  const stations = await stationDao.findAll();
  res.json({ stations });
});

module.exports = router;