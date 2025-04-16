const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: './config/config.env' });

// config/db.js or wherever you're initializing the database
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'pavithrasekar',
  database: process.env.DB_NAME || 'task_management'
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
