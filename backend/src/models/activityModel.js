const db = require('../config/db');

/**
 * Activity Model
 * Handles all activity-related database operations
 */
class ActivityModel {
  /**
   * Search activities by city and filters
   * @param {number} cityId - City ID
   * @param {Object} filters - Search filters
   * @returns {Array} Array of activities
   */
  static async searchActivities(cityId, filters = {}) {
    try {
      const { 
        category, 
        minCost, 
        maxCost, 
        minDuration, 
        maxDuration, 
        minRating,
        limit = 20, 
        offset = 0 
      } = filters;
      
      let query = `
        SELECT a.*, c.name as city_name, c.country
        FROM activities a
        JOIN cities c ON a.city_id = c.id
        WHERE a.city_id = ?
      `;
      
      const params = [cityId];
      
      if (category) {
        query += ' AND a.category = ?';
        params.push(category);
      }
      
      if (minCost !== undefined) {
        query += ' AND a.cost_min >= ?';
        params.push(minCost);
      }
      
      if (maxCost !== undefined) {
        query += ' AND a.cost_max <= ?';
        params.push(maxCost);
      }
      
      if (minDuration !== undefined) {
        query += ' AND a.duration_hours >= ?';
        params.push(minDuration);
      }
      
      if (maxDuration !== undefined) {
        query += ' AND a.duration_hours <= ?';
        params.push(maxDuration);
      }
      
      if (minRating !== undefined) {
        query += ' AND a.rating >= ?';
        params.push(minRating);
      }
      
      query += `
        ORDER BY a.rating DESC, a.cost_min ASC
        LIMIT ? OFFSET ?
      `;
      
      params.push(limit, offset);

      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Error searching activities:', error);
      throw new Error('Failed to search activities');
    }
  }

  /**
   * Find activity by ID
   * @param {number} id - Activity ID
   * @returns {Object|null} Activity data
   */
  static async findById(id) {
    try {
      const query = `
        SELECT a.*, c.name as city_name, c.country
        FROM activities a
        JOIN cities c ON a.city_id = c.id
        WHERE a.id = ?
      `;

      const [rows] = await db.execute(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding activity by ID:', error);
      throw new Error('Failed to find activity');
    }
  }

  /**
   * Get popular activities for a city
   * @param {number} cityId - City ID
   * @param {number} limit - Number of activities to return
   * @returns {Array} Array of popular activities
   */
  static async getPopularActivities(cityId, limit = 10) {
    try {
      const query = `
        SELECT a.*, c.name as city_name, c.country
        FROM activities a
        JOIN cities c ON a.city_id = c.id
        WHERE a.city_id = ?
        ORDER BY a.rating DESC, a.cost_min ASC
        LIMIT ?
      `;

      const [rows] = await db.execute(query, [cityId, limit]);
      return rows;
    } catch (error) {
      console.error('Error getting popular activities:', error);
      throw new Error('Failed to get popular activities');
    }
  }

  /**
   * Get activities by category
   * @param {number} cityId - City ID
   * @param {string} category - Activity category
   * @param {number} limit - Number of activities to return
   * @returns {Array} Array of activities
   */
  static async getActivitiesByCategory(cityId, category, limit = 20) {
    try {
      const query = `
        SELECT a.*, c.name as city_name, c.country
        FROM activities a
        JOIN cities c ON a.city_id = c.id
        WHERE a.city_id = ? AND a.category = ?
        ORDER BY a.rating DESC, a.cost_min ASC
        LIMIT ?
      `;

      const [rows] = await db.execute(query, [cityId, category, limit]);
      return rows;
    } catch (error) {
      console.error('Error getting activities by category:', error);
      throw new Error('Failed to get activities by category');
    }
  }

  /**
   * Create a new activity
   * @param {Object} activityData - Activity data
   * @returns {Object} Created activity
   */
  static async createActivity(activityData) {
    try {
      const {
        city_id,
        name,
        description,
        category = 'other',
        duration_hours,
        cost_min,
        cost_max,
        rating,
        image_url,
        website_url
      } = activityData;

      const query = `
        INSERT INTO activities (city_id, name, description, category, duration_hours, cost_min, cost_max, rating, image_url, website_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.execute(query, [
        city_id, name, description, category, duration_hours, cost_min, cost_max, rating, image_url, website_url
      ]);

      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error creating activity:', error);
      throw new Error('Failed to create activity');
    }
  }

  /**
   * Update activity
   * @param {number} id - Activity ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated activity
   */
  static async updateActivity(id, updateData) {
    try {
      const allowedFields = [
        'name', 'description', 'category', 'duration_hours', 
        'cost_min', 'cost_max', 'rating', 'image_url', 'website_url'
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
        UPDATE activities 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      await db.execute(query, values);
      return await this.findById(id);
    } catch (error) {
      console.error('Error updating activity:', error);
      throw new Error('Failed to update activity');
    }
  }

  /**
   * Delete activity
   * @param {number} id - Activity ID
   * @returns {boolean} Success status
   */
  static async deleteActivity(id) {
    try {
      const query = 'DELETE FROM activities WHERE id = ?';
      const [result] = await db.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw new Error('Failed to delete activity');
    }
  }

  /**
   * Get activity categories
   * @returns {Array} Array of categories with counts
   */
  static async getCategories() {
    try {
      const query = `
        SELECT category, COUNT(*) as activity_count
        FROM activities
        GROUP BY category
        ORDER BY activity_count DESC
      `;

      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error('Error getting categories:', error);
      throw new Error('Failed to get categories');
    }
  }

  /**
   * Get activities for multiple cities
   * @param {Array} cityIds - Array of city IDs
   * @param {Object} filters - Search filters
   * @returns {Array} Array of activities grouped by city
   */
  static async getActivitiesForCities(cityIds, filters = {}) {
    try {
      if (!cityIds || cityIds.length === 0) {
        return [];
      }

      const { category, limit = 5 } = filters;
      
      let query = `
        SELECT a.*, c.name as city_name, c.country
        FROM activities a
        JOIN cities c ON a.city_id = c.id
        WHERE a.city_id IN (${cityIds.map(() => '?').join(',')})
      `;
      
      const params = [...cityIds];
      
      if (category) {
        query += ' AND a.category = ?';
        params.push(category);
      }
      
      query += `
        ORDER BY a.city_id, a.rating DESC
      `;

      const [rows] = await db.execute(query, params);
      
      // Group activities by city
      const activitiesByCity = {};
      rows.forEach(activity => {
        if (!activitiesByCity[activity.city_id]) {
          activitiesByCity[activity.city_id] = [];
        }
        if (activitiesByCity[activity.city_id].length < limit) {
          activitiesByCity[activity.city_id].push(activity);
        }
      });
      
      return activitiesByCity;
    } catch (error) {
      console.error('Error getting activities for cities:', error);
      throw new Error('Failed to get activities for cities');
    }
  }
  /**
   * Global activity search
   */
  static async globalSearch(filters = {}) {
    try {
      let query = `
        SELECT a.*, c.name as city_name, c.country
        FROM activities a
        JOIN cities c ON a.city_id = c.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.query) {
        query += ` AND (a.name LIKE ? OR a.description LIKE ? OR c.name LIKE ?)`;
        const searchTerm = `%${filters.query}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters.category) {
        query += ` AND a.category = ?`;
        params.push(filters.category);
      }

      if (filters.minCost !== undefined) {
        query += ` AND a.cost_min >= ?`;
        params.push(filters.minCost);
      }

      if (filters.maxCost !== undefined) {
        query += ` AND a.cost_max <= ?`;
        params.push(filters.maxCost);
      }

      if (filters.minRating !== undefined) {
        query += ` AND a.rating >= ?`;
        params.push(filters.minRating);
      }

      query += ` ORDER BY a.rating DESC, a.name ASC`;

      if (filters.limit) {
        query += ` LIMIT ?`;
        params.push(filters.limit);
      }

      const activities = await db.query(query, params);
      return activities;
    } catch (error) {
      console.error('Global activity search error:', error);
      throw error;
    }
  }

  /**
   * Get popular activities globally
   */
  static async getPopular(limit = 10) {
    try {
      const query = `
        SELECT a.*, c.name as city_name, c.country
        FROM activities a
        JOIN cities c ON a.city_id = c.id
        ORDER BY a.rating DESC, a.name ASC
        LIMIT ?
      `;

      const activities = await db.query(query, [limit]);
      return activities;
    } catch (error) {
      console.error('Get popular activities error:', error);
      throw error;
    }
  }
  /**
   * Global activity search
   */
  static async globalSearch(filters = {}) {
    try {
      let query = `
        SELECT a.*, c.name as city_name, c.country
        FROM activities a
        JOIN cities c ON a.city_id = c.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.query) {
        query += ` AND (a.name LIKE ? OR a.description LIKE ? OR c.name LIKE ?)`;
        const searchTerm = `%${filters.query}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters.category) {
        query += ` AND a.category = ?`;
        params.push(filters.category);
      }

      if (filters.minCost !== undefined) {
        query += ` AND a.cost_min >= ?`;
        params.push(filters.minCost);
      }

      if (filters.maxCost !== undefined) {
        query += ` AND a.cost_max <= ?`;
        params.push(filters.maxCost);
      }

      if (filters.minRating !== undefined) {
        query += ` AND a.rating >= ?`;
        params.push(filters.minRating);
      }

      query += ` ORDER BY a.rating DESC, a.name ASC`;

      if (filters.limit) {
        query += ` LIMIT ?`;
        params.push(filters.limit);
      }

      const activities = await db.query(query, params);
      return activities;
    } catch (error) {
      console.error('Global activity search error:', error);
      throw error;
    }
  }

  /**
   * Get popular activities globally
   */
  static async getPopular(limit = 10) {
    try {
      const query = `
        SELECT a.*, c.name as city_name, c.country
        FROM activities a
        JOIN cities c ON a.city_id = c.id
        ORDER BY a.rating DESC, a.name ASC
        LIMIT ?
      `;

      const activities = await db.query(query, [limit]);
      return activities;
    } catch (error) {
      console.error('Get popular activities error:', error);
      throw error;
    }
  }

  /**
   * Admin methods for activity management
   */

  // Get all activities for admin
  static async getAllActivities() {
    try {
      const query = `
        SELECT a.*, c.name as city_name, c.country
        FROM activities a
        JOIN cities c ON a.city_id = c.id
        ORDER BY a.name ASC
      `;
      return await db.query(query);
    } catch (error) {
      console.error('Get all activities error:', error);
      throw error;
    }
  }

  // Create activity
  static async createActivity(activityData) {
    try {
      const {
        name, description, category, city_id, cost_min, cost_max,
        duration_hours, rating, image_url, address, latitude, longitude
      } = activityData;

      const query = `
        INSERT INTO activities (
          name, description, category, city_id, cost_min, cost_max,
          duration_hours, rating, image_url, address, latitude, longitude
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await db.query(query, [
        name, description, category, city_id, cost_min, cost_max,
        duration_hours, rating, image_url, address, latitude, longitude
      ]);

      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Create activity error:', error);
      throw error;
    }
  }

  // Update activity
  static async updateActivity(id, updateData) {
    try {
      const allowedFields = [
        'name', 'description', 'category', 'city_id', 'cost_min', 'cost_max',
        'duration_hours', 'rating', 'image_url', 'address', 'latitude', 'longitude'
      ];
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
      const query = `UPDATE activities SET ${updates.join(', ')} WHERE id = ?`;

      await db.query(query, params);
      return await this.findById(id);
    } catch (error) {
      console.error('Update activity error:', error);
      throw error;
    }
  }

  // Delete activity
  static async deleteActivity(id) {
    try {
      const query = 'DELETE FROM activities WHERE id = ?';
      const result = await db.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Delete activity error:', error);
      throw error;
    }
  }

  // Get popular activities with stats
  static async getPopularActivitiesWithStats(limit = 10) {
    try {
      const query = `
        SELECT a.*, c.name as city_name, c.country,
               COUNT(i.id) as usage_count
        FROM activities a
        JOIN cities c ON a.city_id = c.id
        LEFT JOIN itinerary_items i ON a.id = i.activity_id
        GROUP BY a.id
        ORDER BY usage_count DESC, a.rating DESC, a.name ASC
        LIMIT ?
      `;
      return await db.query(query, [limit]);
    } catch (error) {
      console.error('Get popular activities with stats error:', error);
      throw error;
    }
  }
}

module.exports = ActivityModel;
