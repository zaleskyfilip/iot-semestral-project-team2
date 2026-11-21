const express = require('express');
const controlService = require('../services/control-service');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

// both user and admin can set modes
router.post('/action', authorize('USER', 'ADMIN'), async (req, res) => {
  const output = await controlService.sendAction(req.body, req.role);
  res.status(201).json(output);
});

router.get('/pending', authorize('EDGE'), async (req, res) => {
  const output = await controlService.takePending(req.query);
  res.json(output);
});

module.exports = router;