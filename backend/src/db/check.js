const { pool } = require('./index');

async function main() {
  const { rows } = await pool.query(
    'SELECT version(), current_database(), current_user, now()'
  );
  console.log(rows[0]);
  await pool.end();
}

main().catch((err) => {
  console.error('Database check failed:', err.message);
  process.exit(1);
});