const { pool } = require('../db');

async function findAll() {
  const { rows } = await pool.query(`
    SELECT id, name, status, last_seen_at AS "lastSeenAt"
    FROM station
    ORDER BY name
  `);
  return rows;
}

module.exports = { findAll };