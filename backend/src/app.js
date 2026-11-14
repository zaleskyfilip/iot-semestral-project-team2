const express = require('express');
const { pool } = require('./db');

const app = express();

// Turns the JSON body of incoming requests into a JavaScript object (req.body)
app.use(express.json());

// Health check: "is the server running, and can it reach the database?"
app.get('/api/health', async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'OK', database: 'connected' });
});

// No route matched the request
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Something went wrong somewhere above
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