import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  console.log('Testing PG direct connection to Neon...');
  try {
    await client.connect();
    console.log('PG connected successfully to Neon DB!');
    const res = await client.query('SELECT NOW() as current_time, version()');
    console.log('Query result:', res.rows[0]);
  } catch (err) {
    console.error('PG connection error:', err);
  } finally {
    await client.end();
  }
}

main();
