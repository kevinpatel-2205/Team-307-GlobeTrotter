const db = require('../config/db');

/**
 * Trip Model
 * Handles all trip-related database operations
 */
class TripModel {
  /**
   * Create a new trip
   * @param {Object} tripData - Trip data
   * @returns {Object} Created trip
   */
  static async createTrip(tripData) {
    try {
      const {
        user_id,
        title,
        description,
        start_date,
        end_date,
        cover_photo_path,
        budget,
        status = 'planning'
      } = tripData;

      const query = `
        INSERT INTO trips (user_id, title, description, start_date, end_date, cover_photo_path, budget, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.execute(query, [
        user_id, title, description, start_date, end_date, cover_photo_path, budget, status
      ]);

      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error creating trip:', error);
      throw new Error('Failed to create trip');
    }
  }

  /**
   * Find trip by ID
   * @param {number} id - Trip ID
   * @returns {Object|null} Trip data
   */
  static async findById(id) {
    try {
      const query = `
        SELECT t.*, u.full_name as user_name, u.email as user_email
        FROM trips t
        JOIN users u ON t.user_id = u.id
        WHERE t.id = ?
      `;

      const [rows] = await db.execute(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding trip by ID:', error);
      throw new Error('Failed to find trip');
    }
  }

  /**
   * Find trips by user ID
   * @param {number} userId - User ID
   * @param {Object} options - Query options (limit, offset, status)
   * @returns {Array} Array of trips
   */
  static async findByUserId(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, status } = options;

      let query = `
        SELECT t.*,
               COUNT(DISTINCT tc.city_id) as city_count,
               COUNT(DISTINCT ii.id) as activity_count,
               COALESCE(SUM(ii.cost), 0) as total_cost,
               GROUP_CONCAT(DISTINCT c.name ORDER BY tc.order_index) as cities,
               GROUP_CONCAT(DISTINCT c.country) as countries
        FROM trips t
        LEFT JOIN trip_cities tc ON t.id = tc.trip_id
        LEFT JOIN cities c ON tc.city_id = c.id
        LEFT JOIN itinerary_items ii ON t.id = ii.trip_id
        WHERE t.user_id = ?
      `;

      const params = [userId];

      if (status) {
        query += ' AND t.status = ?';
        params.push(status);
      }

      query += `
        GROUP BY t.id
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
      `;

      params.push(limit, offset);

      const [rows] = await db.execute(query, params);

      // Process the results to convert comma-separated strings to arrays
      return rows.map(trip => ({
        ...trip,
        cities: trip.cities ? trip.cities.split(',') : [],
        countries: trip.countries ? [...new Set(trip.countries.split(','))] : []
      }));
    } catch (error) {
      console.error('Error finding trips by user ID:', error);
      throw new Error('Failed to find trips');
    }
  }

  /**
   * Update trip
   * @param {number} id - Trip ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated trip
   */
  static async updateTrip(id, updateData) {
    try {
      const allowedFields = [
        'title', 'description', 'start_date', 'end_date', 
        'cover_photo_path', 'budget', 'status', 'is_public'
      ];
      
      const updateFields = [];
      const values = [];
      
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      values.push(id);
      
      const query = `
        UPDATE trips 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await db.execute(query, values);
      return await this.findById(id);
    } catch (error) {
      console.error('Error updating trip:', error);
      throw new Error('Failed to update trip');
    }
  }

  /**
   * Delete trip
   * @param {number} id - Trip ID
   * @returns {boolean} Success status
   */
  static async deleteTrip(id) {
    try {
      const query = 'DELETE FROM trips WHERE id = ?';
      const [result] = await db.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting trip:', error);
      throw new Error('Failed to delete trip');
    }
  }

  /**
   * Generate unique public URL for trip sharing
   * @param {number} tripId - Trip ID
   * @returns {string} Public URL
   */
  static async generatePublicUrl(tripId) {
    try {
      const publicUrl = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
      
      const query = 'UPDATE trips SET public_url = ?, is_public = TRUE WHERE id = ?';
      await db.execute(query, [publicUrl, tripId]);
      
      return publicUrl;
    } catch (error) {
      console.error('Error generating public URL:', error);
      throw new Error('Failed to generate public URL');
    }
  }

  /**
   * Find trip by public URL
   * @param {string} publicUrl - Public URL
   * @returns {Object|null} Trip data
   */
  static async findByPublicUrl(publicUrl) {
    try {
      const query = `
        SELECT t.*, u.full_name as user_name
        FROM trips t
        JOIN users u ON t.user_id = u.id
        WHERE t.public_url = ? AND t.is_public = TRUE
      `;

      const [rows] = await db.execute(query, [publicUrl]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding trip by public URL:', error);
      throw new Error('Failed to find trip');
    }
  }

  /**
   * Get trip statistics
   * @param {number} tripId - Trip ID
   * @returns {Object} Trip statistics
   */
  static async getTripStats(tripId) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT tc.city_id) as city_count,
          COUNT(ii.id) as activity_count,
          COALESCE(SUM(ii.cost), 0) as total_cost,
          COALESCE(AVG(ii.cost), 0) as avg_cost_per_activity,
          MIN(ii.start_time) as first_activity,
          MAX(ii.end_time) as last_activity
        FROM trips t
        LEFT JOIN trip_cities tc ON t.id = tc.trip_id
        LEFT JOIN itinerary_items ii ON t.id = ii.trip_id
        WHERE t.id = ?
        GROUP BY t.id
      `;

      const [rows] = await db.execute(query, [tripId]);
      return rows.length > 0 ? rows[0] : {
        city_count: 0,
        activity_count: 0,
        total_cost: 0,
        avg_cost_per_activity: 0,
        first_activity: null,
        last_activity: null
      };
    } catch (error) {
      console.error('Error getting trip stats:', error);
      throw new Error('Failed to get trip statistics');
    }
  }
  /**
   * Admin methods for trip management
   */

  // Get total trip count
  static async getTotalCount() {
    try {
      const result = await db.query('SELECT COUNT(*) as count FROM trips');
      return result[0].count;
    } catch (error) {
      console.error('Get total trip count error:', error);
      throw error;
    }
  }

  // Get public trips count
  static async getPublicTripsCount() {
    try {
      const result = await db.query('SELECT COUNT(*) as count FROM trips WHERE is_public = 1');
      return result[0].count;
    } catch (error) {
      console.error('Get public trips count error:', error);
      throw error;
    }
  }

  // Get completed trips count
  static async getCompletedTripsCount() {
    try {
      const result = await db.query('SELECT COUNT(*) as count FROM trips WHERE status = "completed"');
      return result[0].count;
    } catch (error) {
      console.error('Get completed trips count error:', error);
      throw error;
    }
  }

  // Get average trip duration
  static async getAverageTripDuration() {
    try {
      const result = await db.query(`
        SELECT AVG(DATEDIFF(end_date, start_date)) as avg_duration
        FROM trips
        WHERE start_date IS NOT NULL AND end_date IS NOT NULL
      `);
      return Math.round(result[0].avg_duration || 0);
    } catch (error) {
      console.error('Get average trip duration error:', error);
      throw error;
    }
  }

  // Get trips by month
  static async getTripsByMonth(months = 12) {
    try {
      const result = await db.query(`
        SELECT
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as trips
        FROM trips
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
      `, [months]);
      return result;
    } catch (error) {
      console.error('Get trips by month error:', error);
      throw error;
    }
  }

  // Get admin trip list with pagination and filters
  static async getAdminTripList(filters = {}) {
    try {
      let query = `
        SELECT t.*, u.full_name as user_name, u.email as user_email
        FROM trips t
        JOIN users u ON t.user_id = u.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.search) {
        query += ` AND (t.title LIKE ? OR t.description LIKE ? OR u.full_name LIKE ?)`;
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters.status) {
        query += ` AND t.status = ?`;
        params.push(filters.status);
      }

      if (filters.isPublic !== undefined) {
        query += ` AND t.is_public = ?`;
        params.push(filters.isPublic ? 1 : 0);
      }

      // Add sorting
      const validSortFields = ['created_at', 'title', 'start_date', 'end_date', 'budget'];
      const sortBy = validSortFields.includes(filters.sortBy) ? filters.sortBy : 'created_at';
      const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
      query += ` ORDER BY t.${sortBy} ${sortOrder}`;

      // Add pagination
      const limit = Math.min(filters.limit || 20, 100);
      const offset = ((filters.page || 1) - 1) * limit;
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const trips = await db.query(query, params);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM trips t
        JOIN users u ON t.user_id = u.id
        WHERE 1=1
      `;
      const countParams = [];

      if (filters.search) {
        countQuery += ` AND (t.title LIKE ? OR t.description LIKE ? OR u.full_name LIKE ?)`;
        const searchTerm = `%${filters.search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters.status) {
        countQuery += ` AND t.status = ?`;
        countParams.push(filters.status);
      }

      if (filters.isPublic !== undefined) {
        countQuery += ` AND t.is_public = ?`;
        countParams.push(filters.isPublic ? 1 : 0);
      }

      const totalResult = await db.query(countQuery, countParams);
      const total = totalResult[0].total;

      return { trips, total };
    } catch (error) {
      console.error('Get admin trip list error:', error);
      throw error;
    }
  }

  // Get recent trips
  static async getRecentTrips(limit = 10) {
    try {
      const query = `
        SELECT t.*, u.full_name as user_name
        FROM trips t
        JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
        LIMIT ?
      `;
      return await db.query(query, [limit]);
    } catch (error) {
      console.error('Get recent trips error:', error);
      throw error;
    }
  }

  // Get trip analytics
  static async getAnalytics(period = '30d') {
    try {
      const days = parseInt(period.replace('d', ''));

      const [tripCreations, popularDestinations, budgetAnalysis] = await Promise.all([
        db.query(`
          SELECT DATE(created_at) as date, COUNT(*) as count
          FROM trips
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `, [days]),

        db.query(`
          SELECT destination, COUNT(*) as count
          FROM trips
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          GROUP BY destination
          ORDER BY count DESC
          LIMIT 10
        `, [days]),

        db.query(`
          SELECT
            AVG(budget) as avg_budget,
            MIN(budget) as min_budget,
            MAX(budget) as max_budget
          FROM trips
          WHERE budget > 0 AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `, [days])
      ]);

      return {
        tripCreations,
        popularDestinations,
        budgetAnalysis: budgetAnalysis[0]
      };
    } catch (error) {
      console.error('Get trip analytics error:', error);
      throw error;
    }
  }
}

module.exports = TripModel;
