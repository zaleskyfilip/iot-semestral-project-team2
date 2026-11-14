const { pool } = require('./index');

// A fixed ID
const DEMO_STATION_ID = '11111111-1111-4111-8111-111111111111';

async function seed() {
  await pool.query(
    `INSERT INTO station (id, name)
     VALUES ($1, $2)
     ON CONFLICT (id) DO NOTHING`,
    [DEMO_STATION_ID, 'Demo station']
  );

  await pool.query(
    `INSERT INTO device_config (station_id)
     VALUES ($1)
     ON CONFLICT (station_id) DO NOTHING`,
    [DEMO_STATION_ID]
  );

  console.log(`Demo station ready: ${DEMO_STATION_ID}`);
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());