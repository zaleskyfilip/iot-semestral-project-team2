const { pool } = require('../db');

const COLUMNS = `
  id, name, status,
  last_seen_at AS "lastSeenAt",
  created_at   AS "createdAt",
  updated_at   AS "updatedAt"
`;

async function findAll() {
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM station ORDER BY name`);
  return rows;
}

//returns the station
async function findById(id) {
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM station WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

async function updateStatus(id, status, lastSeenAt) {
  const { rows } = await pool.query(
    `UPDATE station
     SET status = $2, last_seen_at = $3, updated_at = now()
     WHERE id = $1
     RETURNING ${COLUMNS}`,
    [id, status, lastSeenAt]
  );
  return rows[0] ?? null;
}

module.exports = { findAll, findById, updateStatus };