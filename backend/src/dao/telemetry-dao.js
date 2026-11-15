const { pool } = require('../db');
function toTelemetry(row) {
  return {
    id: row.id,
    stationId: row.station_id,
    timestamp: row.measured_at,
    mode: row.mode,
    measurements: {
      co2: row.co2,
      voc: row.voc,
      pm25: row.pm25,
      temperature: row.temperature,
      humidity: row.humidity,
      light: row.light,
      pressure: row.pressure,
    },
    states: {
      co2: row.co2_state,
      voc: row.voc_state,
      pm25: row.pm25_state,
      temperature: row.temperature_state,
      humidity: row.humidity_state,
      light: row.light_state,
      pressure: row.pressure_state,
    },
    scores: {
      focusReadiness: row.focus_readiness,
      healthComfort: row.health_comfort,
    },
    insights: row.insights,
  };
}

// Saves one telemetry record
async function create(t) {
  const { rows } = await pool.query(
    `INSERT INTO telemetry (
       station_id, measured_at, mode,
       co2, voc, pm25, temperature, humidity, light, pressure,
       co2_state, voc_state, pm25_state, temperature_state,
       humidity_state, light_state, pressure_state,
       focus_readiness, health_comfort, insights
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
             $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
     ON CONFLICT (station_id, measured_at) DO NOTHING
     RETURNING id`,
    [
      t.stationId, t.timestamp, t.mode,
      t.measurements.co2, t.measurements.voc, t.measurements.pm25, t.measurements.temperature,
      t.measurements.humidity, t.measurements.light, t.measurements.pressure,
      t.states.co2, t.states.voc, t.states.pm25, t.states.temperature,
      t.states.humidity, t.states.light, t.states.pressure,
      t.scores.focusReadiness, t.scores.healthComfort, t.insights,
    ]
  );
  return rows[0] ?? null;
}

async function findLatestByStation(stationId) {
  const { rows } = await pool.query(
    `SELECT * FROM telemetry
     WHERE station_id = $1
     ORDER BY measured_at DESC
     LIMIT 1`,
    [stationId]
  );
  return rows[0] ? toTelemetry(rows[0]) : null;
}

module.exports = { create, findLatestByStation };