const fs = require('node:fs');
const path = require('node:path');
const { pool } = require('./index');

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

async function migrate() {
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    text PRIMARY KEY,
      applied_at  timestamptz NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await pool.query('SELECT filename FROM schema_migrations');
  const alreadyApplied = new Set(rows.map((row) => row.filename));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (alreadyApplied.has(file)) {
      continue; 
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');   
      await client.query(sql);       // run the file
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');  
      console.log(`Applied ${file}`);
    } catch (err) {
      await client.query('ROLLBACK'); 
      throw new Error(`Migration ${file} failed: ${err.message}`);
    } finally {
      client.release(); // give the connection back to the pool
    }
  }

  console.log('Database is up to date.');
}

migrate()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());