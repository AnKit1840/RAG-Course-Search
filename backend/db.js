import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Construct connection config
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'rag_db',
    };

export const pool = new Pool(poolConfig);

// Log unexpected pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

/**
 * Execute a SQL query using the connection pool
 * @param {string} text - SQL Query text
 * @param {Array} [params] - Query parameter values
 * @returns {Promise<import('pg').QueryResult>}
 */
export const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    console.log('Executed query:', { text: text.trim().split('\n')[0], duration: `${duration}ms`, rows: res.rowCount });
  }
  return res;
};

/**
 * Test PostgreSQL connection status
 * @returns {Promise<{ success: boolean, timestamp?: string, version?: string, error?: string }>}
 */
export const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW() as current_time, version() as version;');
    const row = res.rows[0];
    return {
      success: true,
      timestamp: row.current_time,
      version: row.version,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  pool,
  query,
  testConnection,
};
