const { pool } = require('../db');

function toConfig(row) {
  return {
    id: row.id,
    stationId: row.station_id,
    operatingMode: row.operating_mode,
    masks: {
      co2: row.co2_mask,
      voc: row.voc_mask,
      pm25: row.pm25_mask,
      temperature: row.temperature_mask,
      humidity: row.humidity_mask,
      light: row.light_mask,
      pressure: row.pressure_mask,
    },
    thresholds: {
      co2Warn: row.co2_warn,
      co2Crit: row.co2_crit,
    },
    schedule: row.schedule,
    updatedAt: row.updated_at,
  };
}

async function findByStationId(stationId) {
  const { rows } = await pool.query('SELECT * FROM device_config WHERE station_id = $1', [stationId]);
  return rows[0] ? toConfig(rows[0]) : null;
}

async function createDefault(stationId) {
  await pool.query(
    'INSERT INTO device_config (station_id) VALUES ($1) ON CONFLICT (station_id) DO NOTHING',
    [stationId]
  );
}

// Saves all fields of a config
async function update(stationId, config) {
  const { rows } = await pool.query(
    `UPDATE device_config
     SET operating_mode = $2,
         co2_mask = $3, voc_mask = $4, pm25_mask = $5, temperature_mask = $6,
         humidity_mask = $7, light_mask = $8, pressure_mask = $9,
         co2_warn = $10, co2_crit = $11,
         schedule = $12,
         updated_at = now()
     WHERE station_id = $1
     RETURNING *`,
    [
      stationId,
      config.operatingMode,
      config.masks.co2, config.masks.voc, config.masks.pm25, config.masks.temperature,
      config.masks.humidity, config.masks.light, config.masks.pressure,
      config.thresholds.co2Warn, config.thresholds.co2Crit,
      JSON.stringify(config.schedule), 
    ]
  );
  return rows[0] ? toConfig(rows[0]) : null;
}

module.exports = { findByStationId, createDefault, update };