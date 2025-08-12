const { query, queryOne } = require('../config/db-mysql');

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
      
      // Get the created user
      const userId = result.insertId;
      const createdUser = await this.findById(userId);
      return createdUser;
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Handle unique constraint violation (duplicate email)
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
      const sql = 'UPDATE users SET avatar_path = ? WHERE id = ?';
      await query(sql, [avatarPath, userId]);
      
      // Return updated user
      const updatedUser = await this.findById(userId);
      return updatedUser;
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
      const sql = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_30_days,
          COUNT(CASE WHEN avatar_path IS NOT NULL THEN 1 END) as users_with_avatar
        FROM users
      `;
      const stats = await queryOne(sql);
      return stats;
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
      const sql = 'SELECT 1 FROM users WHERE email = ? LIMIT 1';
      const result = await queryOne(sql, [email]);
      return !!result;
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw new Error('Database error while checking email');
    }
  }

  /**
   * Get all users (for admin)
   * @param {number} limit - Number of users to return
   * @param {number} offset - Offset for pagination
   * @returns {Array} Array of user objects
   */
  static async getAllUsers(limit = 50, offset = 0) {
    try {
      const sql = `
        SELECT id, full_name, email, avatar_path, created_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      const users = await query(sql, [limit, offset]);
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error('Database error while getting users');
    }
  }

  /**
   * Delete a user (for admin or user self-deletion)
   * @param {number} userId - User's ID
   * @returns {boolean} True if deleted successfully
   */
  static async deleteUser(userId) {
    try {
      const sql = 'DELETE FROM users WHERE id = ?';
      const result = await query(sql, [userId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Database error while deleting user');
    }
  }
}

module.exports = UserModel;
