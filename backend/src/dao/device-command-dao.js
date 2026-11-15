const { pool } = require('../db');

// Stores a new command with status PENDING
async function create(stationId, action, payload) {
  const { rows } = await pool.query(
    `INSERT INTO device_command (station_id, action, payload)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [stationId, action, JSON.stringify(payload)]
  );
  return rows[0];
}

async function takePending(stationId) {
  const { rows } = await pool.query(
    `UPDATE device_command
     SET status = 'DELIVERED', delivered_at = now()
     WHERE station_id = $1 AND status = 'PENDING'
     RETURNING id, action, payload, created_at AS "createdAt"`,
    [stationId]
  );
  // oldest command first
  return rows.sort((a, b) => a.createdAt - b.createdAt);
}

module.exports = { create, takePending };