const { query, queryOne } = require('../config/db');

/**
 * User model for MySQL database operations
 * Handles all user-related database queries
 */
class UserModel {
  /**
   * Find a user by email address
   * @param {string} email - User's email address
   * @returns {Object|null} User object or null if not found
   */
  static async findByEmail(email) {
    try {
      const sql = 'SELECT * FROM users WHERE email = ?';
      const user = await queryOne(sql, [email]);
      return user;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Database error while finding user');
    }
  }

  /**
   * Find a user by ID
   * @param {number} id - User's ID
   * @returns {Object|null} User object or null if not found
   */
  static async findById(id) {
    try {
      const sql = 'SELECT id, full_name, email, avatar_path, created_at FROM users WHERE id = ?';
      const user = await queryOne(sql, [id]);
      return user;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error('Database error while finding user');
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data object
   * @param {string} userData.full_name - User's full name
   * @param {string} userData.email - User's email address
   * @param {string} userData.password_hash - Hashed password
   * @param {string|null} userData.avatar_path - Path to avatar image
   * @returns {Object} Created user object (without password)
   */
  static async createUser({ full_name, email, password_hash, avatar_path = null }) {
    try {
      const sql = `
        INSERT INTO users (full_name, email, password_hash, avatar_path)
        VALUES (?, ?, ?, ?)
      `;
      const result = await query(sql, [full_name, email, password_hash, avatar_path]);

      // Get the created user using insertId
      const userId = result.insertId;
      const createdUser = await this.findById(userId);
      return createdUser;
    } catch (error) {
      console.error('Error creating user:', error);

      // Handle unique constraint violation (duplicate email) - MySQL error code
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Email already exists');
      }

      throw new Error('Database error while creating user');
    }
  }

  /**
   * Update user's avatar path
   * @param {number} userId - User's ID
   * @param {string} avatarPath - New avatar path
   * @returns {Object} Updated user object
   */
  static async updateAvatar(userId, avatarPath) {
    try {
      const query = `
        UPDATE users 
        SET avatar_path = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, full_name, email, avatar_path, updated_at
      `;
      const { rows } = await db.query(query, [avatarPath, userId]);
      return rows[0];
    } catch (error) {
      console.error('Error updating user avatar:', error);
      throw new Error('Database error while updating avatar');
    }
  }

  /**
   * Get user statistics (for admin/analytics)
   * @returns {Object} User statistics
   */
  static async getUserStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30_days,
          COUNT(CASE WHEN avatar_path IS NOT NULL THEN 1 END) as users_with_avatar
        FROM users
      `;
      const { rows } = await db.query(query);
      return rows[0];
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new Error('Database error while getting user statistics');
    }
  }

  /**
   * Check if email exists (for validation)
   * @param {string} email - Email to check
   * @returns {boolean} True if email exists, false otherwise
   */
  static async emailExists(email) {
    try {
      const query = 'SELECT 1 FROM users WHERE email = $1';
      const { rows } = await db.query(query, [email]);
      return rows.length > 0;
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw new Error('Database error while checking email');
    }
  }
  /**
   * Admin methods for user management
   */

  // Get total user count
  static async getTotalCount() {
    try {
      const result = await db.query('SELECT COUNT(*) as count FROM users');
      return result[0].count;
    } catch (error) {
      console.error('Get total count error:', error);
      throw error;
    }
  }

  // Get active users count (last N days)
  static async getActiveUsersCount(days = 30) {
    try {
      const result = await db.query(
        'SELECT COUNT(DISTINCT id) as count FROM users WHERE last_login >= DATE_SUB(NOW(), INTERVAL ? DAY)',
        [days]
      );
      return result[0].count;
    } catch (error) {
      console.error('Get active users count error:', error);
      throw error;
    }
  }

  // Get new users count (last N days)
  static async getNewUsersCount(days = 30) {
    try {
      const result = await db.query(
        'SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)',
        [days]
      );
      return result[0].count;
    } catch (error) {
      console.error('Get new users count error:', error);
      throw error;
    }
  }

  // Get user growth data
  static async getUserGrowthData(months = 12) {
    try {
      const result = await db.query(`
        SELECT
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as users
        FROM users
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
      `, [months]);
      return result;
    } catch (error) {
      console.error('Get user growth data error:', error);
      throw error;
    }
  }

  // Get admin user list with pagination and filters
  static async getAdminUserList(filters = {}) {
    try {
      let query = `
        SELECT id, full_name, email, role, created_at, last_login, avatar_path
        FROM users
        WHERE 1=1
      `;
      const params = [];

      if (filters.search) {
        query += ` AND (full_name LIKE ? OR email LIKE ?)`;
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }

      if (filters.role) {
        query += ` AND role = ?`;
        params.push(filters.role);
      }

      // Add sorting
      const validSortFields = ['created_at', 'full_name', 'email', 'last_login'];
      const sortBy = validSortFields.includes(filters.sortBy) ? filters.sortBy : 'created_at';
      const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
      query += ` ORDER BY ${sortBy} ${sortOrder}`;

      // Add pagination
      const limit = Math.min(filters.limit || 20, 100);
      const offset = ((filters.page || 1) - 1) * limit;
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const users = await db.query(query, params);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
      const countParams = [];

      if (filters.search) {
        countQuery += ` AND (full_name LIKE ? OR email LIKE ?)`;
        const searchTerm = `%${filters.search}%`;
        countParams.push(searchTerm, searchTerm);
      }

      if (filters.role) {
        countQuery += ` AND role = ?`;
        countParams.push(filters.role);
      }

      const totalResult = await db.query(countQuery, countParams);
      const total = totalResult[0].total;

      return { users, total };
    } catch (error) {
      console.error('Get admin user list error:', error);
      throw error;
    }
  }

  // Admin update user
  static async adminUpdateUser(id, updateData) {
    try {
      const allowedFields = ['full_name', 'email', 'role'];
      const updates = [];
      const params = [];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updates.push(`${field} = ?`);
          params.push(updateData[field]);
        }
      }

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      params.push(id);
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

      await db.query(query, params);
      return await this.findById(id);
    } catch (error) {
      console.error('Admin update user error:', error);
      throw error;
    }
  }

  // Get recent users
  static async getRecentUsers(limit = 10) {
    try {
      const query = `
        SELECT id, full_name, email, role, created_at, avatar_path
        FROM users
        ORDER BY created_at DESC
        LIMIT ?
      `;
      return await db.query(query, [limit]);
    } catch (error) {
      console.error('Get recent users error:', error);
      throw error;
    }
  }

  // Get user analytics
  static async getUserAnalytics(period = '30d') {
    try {
      const days = parseInt(period.replace('d', ''));

      const [signups, logins, activeUsers] = await Promise.all([
        db.query(`
          SELECT DATE(created_at) as date, COUNT(*) as count
          FROM users
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `, [days]),

        db.query(`
          SELECT DATE(last_login) as date, COUNT(*) as count
          FROM users
          WHERE last_login >= DATE_SUB(NOW(), INTERVAL ? DAY)
          GROUP BY DATE(last_login)
          ORDER BY date ASC
        `, [days]),

        db.query(`
          SELECT COUNT(DISTINCT id) as count
          FROM users
          WHERE last_login >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `, [days])
      ]);

      return {
        signups,
        logins,
        activeUsers: activeUsers[0].count
      };
    } catch (error) {
      console.error('Get user analytics error:', error);
      throw error;
    }
  }

  /**
   * Update user password
   * @param {number} userId - User ID
   * @param {string} hashedPassword - New hashed password
   * @returns {Object} Updated user info
   */
  static async updatePassword(userId, hashedPassword) {
    try {
      const updateQuery = `
        UPDATE users
        SET password_hash = ?, updated_at = NOW()
        WHERE id = ?
      `;
      await query(updateQuery, [hashedPassword, userId]);

      // Return updated user info
      const selectQuery = `
        SELECT id, full_name, email, updated_at
        FROM users
        WHERE id = ?
      `;
      const updatedUser = await queryOne(selectQuery, [userId]);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user password:', error);
      throw new Error('Database error while updating password');
    }
  }
}

module.exports = UserModel;
