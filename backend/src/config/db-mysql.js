const mysql = require('mysql2/promise');

// Determine if we're in production
const isProd = process.env.NODE_ENV === 'production';

// MySQL configuration for XAMPP
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // XAMPP default is empty password
  database: process.env.DB_NAME || 'globetrotter',
  // Connection pool settings for scalability
  connectionLimit: 20,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  // Handle timezone issues
  timezone: '+00:00',
  // Handle large packets
  maxAllowedPacket: 1024 * 1024 * 16, // 16MB
};

// Create the connection pool
const pool = mysql.createPool(dbConfig);

// Test the connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(' MySQL database connected successfully');
    console.log(` Connected to database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
  } catch (error) {
    console.error(' MySQL connection failed:', error.message);
    console.log(' Make sure XAMPP MySQL is running');
    console.log(' Check database configuration in .env file');
    console.log(' Default XAMPP settings: host=localhost, port=3306, user=root, password=""');
  }
}

// Test connection on startup
testConnection();

// Helper function to execute queries with better error handling
const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
};

// Helper function to get a single row
const queryOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows[0] || null;
};

// Export the pool and helper functions
module.exports = {
  pool,
  query,
  queryOne,
  // For compatibility with existing code
  connect: (callback) => {
    pool.getConnection()
      .then(connection => {
        callback(null, connection, () => connection.release());
      })
      .catch(callback);
  },
  on: () => {},
};
