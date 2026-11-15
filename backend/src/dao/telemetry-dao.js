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
async function create(t, db = pool) {
  const { rows } = await db.query(
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

async function getKpis(stationId, from) {
  const { rows } = await pool.query(
    `WITH ordered AS (
       SELECT focus_readiness, co2_state, mode,
              LAG(mode) OVER (ORDER BY measured_at) AS previous_mode
       FROM telemetry
       WHERE station_id = $1 AND measured_at >= $2
     )
     SELECT
       ROUND(AVG(focus_readiness))::int AS "averageFocusScore",
       ROUND(
         100.0 * COUNT(*) FILTER (WHERE co2_state = 'OK')
         / NULLIF(COUNT(*) FILTER (WHERE co2_state <> 'IGNORED'), 0)
       )::int AS "optimalCo2Percentage",
       COUNT(*) FILTER (
         WHERE mode = 'VentilationAssist'
           AND previous_mode IS DISTINCT FROM 'VentilationAssist'
       )::int AS "ventilationCount"
     FROM ordered`,
    [stationId, from]
  );
  return rows[0];
}

// Averages per time bucket
async function getSeries(stationId, from, bucket) {
  const { rows } = await pool.query(
    `SELECT
       date_bin($3::interval, measured_at, TIMESTAMPTZ '2000-01-01') AS "timestamp",
       ROUND(AVG(co2)::numeric, 1)::float8         AS co2,
       ROUND(AVG(voc)::numeric, 1)::float8         AS voc,
       ROUND(AVG(pm25)::numeric, 1)::float8        AS pm25,
       ROUND(AVG(temperature)::numeric, 1)::float8 AS temperature,
       ROUND(AVG(humidity)::numeric, 1)::float8    AS humidity,
       ROUND(AVG(light)::numeric, 1)::float8       AS light,
       ROUND(AVG(pressure)::numeric, 1)::float8    AS pressure,
       ROUND(AVG(focus_readiness))::int            AS "focusReadiness",
       ROUND(AVG(health_comfort))::int             AS "healthComfort"
     FROM telemetry
     WHERE station_id = $1 AND measured_at >= $2
     GROUP BY 1
     ORDER BY 1`,
    [stationId, from, bucket]
  );
  return rows;
}

module.exports = { create, findLatestByStation, getKpis, getSeries };