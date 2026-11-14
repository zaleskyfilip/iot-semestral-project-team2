const express = require('express');
const { pool } = require('./db');
const stationRoutes = require('./routes/station-routes');

const app = express();

app.use(express.json());

// Health check
app.get('/api/health', async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'OK', database: 'connected' });
});

// Routes
app.use('/api/stations', stationRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status === 500) {
    console.error(err);
  }
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
  });
});

module.exports = app;