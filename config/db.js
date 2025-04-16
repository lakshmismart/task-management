const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: './config/config.env' });

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

const connectDB = async () => {
  try {
    await pool.connect();
    console.log('✅ Connected to PostgreSQL');
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  pool, // export pool if you need it in routes
};
