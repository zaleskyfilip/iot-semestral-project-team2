const express = require('express');
const { pool } = require('./db');
const stationRoutes = require('./routes/station-routes');
const AppError = require('./errors/app-error');
const telemetryRoutes = require('./routes/telemetry-routes');

const app = express();

app.use(express.json());

// Health check
app.get('/api/health', async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'OK', database: 'connected' });
});

// Routes
app.use('/api/stations', stationRoutes);
app.use('/api/telemetry', telemetryRoutes);

// No route matched the request
app.use((req, res) => {
  res.status(404).json({
    error: { code: 'notFound', message: `Route ${req.method} ${req.path} not found.` },
  });
});

// Something went wrong somewhere above
app.use((err, req, res, next) => {
  // Errors we threw on purpose (e.g. invalid input)
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  // Errors from Express itself, e.g. broken JSON in the request body
  if (err.status && err.status < 500) {
    return res.status(err.status).json({
      error: { code: 'badRequest', message: err.message },
    });
  }

  // Everything else is a bug or a database problem
  console.error(err);
  res.status(500).json({
    error: { code: 'internalError', message: 'Internal server error.' },
  });
});

module.exports = app;