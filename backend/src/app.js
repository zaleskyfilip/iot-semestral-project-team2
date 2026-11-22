const express = require('express');
const { pool } = require('./db');
const stationRoutes = require('./routes/station-routes');
const AppError = require('./errors/app-error');
const telemetryRoutes = require('./routes/telemetry-routes');
const configRoutes = require('./routes/config-routes');
const dashboardRoutes = require('./routes/dashboard-routes');
const controlRoutes = require('./routes/control-routes');

const app = express();

app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/v1/health', async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'OK', database: 'connected' });
});

// Routes
app.use('/api/v1/stations', stationRoutes);
app.use('/api/v1/telemetry', telemetryRoutes);
app.use('/api/v1/config', configRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/control', controlRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: { code: 'notFound', message: `Route ${req.method} ${req.path} not found.` },
  });
});


app.use((err, req, res, next) => {

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }


  if (err.status && err.status < 500) {
    return res.status(err.status).json({
      error: { code: 'badRequest', message: err.message },
    });
  }

  console.error(err);
  res.status(500).json({
    error: { code: 'internalError', message: 'Internal server error.' },
  });
});

module.exports = app;