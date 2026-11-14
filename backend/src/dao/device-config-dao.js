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

module.exports = { findByStationId };