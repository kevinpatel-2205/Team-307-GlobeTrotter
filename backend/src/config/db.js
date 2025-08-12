const mysql = require('mysql2/promise');

// Determine if we're in production
const isProd = process.env.NODE_ENV === 'production';

// Check if MySQL configuration is available
if (!process.env.DB_HOST && !process.env.DATABASE_URL) {
  console.log('  MySQL not configured. Database features will be disabled.');
  console.log(' To enable database features, set DB_HOST, DB_USER, DB_NAME in .env file');
  console.log(' Example: DB_HOST=localhost, DB_USER=root, DB_NAME=globetrotter');

  // Export a mock pool for testing
  module.exports = {
    query: () => Promise.reject(new Error('Database not configured')),
    execute: () => Promise.reject(new Error('Database not configured')),
    getConnection: () => Promise.reject(new Error('Database not configured')),
  };
  return;
}

// MySQL database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'globetrotter',
  // Connection pool settings for scalability
  connectionLimit: 20,
  waitForConnections: true,
  queueLimit: 0
};

// Create the MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Test the connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(' MySQL database connected successfully');
    console.log(`Connected to: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
  } catch (error) {
    console.error(' MySQL connection failed:', error.message);
    console.log(' Make sure XAMPP MySQL is running');
    console.log(' Check database configuration in .env file');
    console.log(' Default XAMPP: host=localhost, port=3306, user=root, password=""');
  }
}

// Test connection on startup
testConnection();

// Helper functions for easier database operations
const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
};

const queryOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows[0] || null;
};

// Export pool and helper functions
module.exports = {
  pool,
  query,
  queryOne,
  // For compatibility with existing code
  execute: pool.execute.bind(pool),
  getConnection: pool.getConnection.bind(pool),
};
