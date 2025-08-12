const db = require('../config/db');

/**
 * City Model
 * Handles all city-related database operations
 */
class CityModel {
  /**
   * Search cities by name or country
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Array} Array of cities
   */
  static async searchCities(searchTerm, options = {}) {
    try {
      const { limit = 20, offset = 0, country } = options;
      
      let query = `
        SELECT c.*, COUNT(tc.trip_id) as trip_count
        FROM cities c
        LEFT JOIN trip_cities tc ON c.id = tc.city_id
        WHERE (c.name LIKE ? OR c.country LIKE ?)
      `;
      
      const params = [`%${searchTerm}%`, `%${searchTerm}%`];
      
      if (country) {
        query += ' AND c.country = ?';
        params.push(country);
      }
      
      query += `
        GROUP BY c.id
        ORDER BY c.popularity_score DESC, trip_count DESC
        LIMIT ? OFFSET ?
      `;
      
      params.push(limit, offset);

      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Error searching cities:', error);
      throw new Error('Failed to search cities');
    }
  }

  /**
   * Get popular cities
   * @param {number} limit - Number of cities to return
   * @returns {Array} Array of popular cities
   */
  static async getPopularCities(limit = 10) {
    try {
      const query = `
        SELECT c.*, COUNT(tc.trip_id) as trip_count
        FROM cities c
        LEFT JOIN trip_cities tc ON c.id = tc.city_id
        GROUP BY c.id
        ORDER BY c.popularity_score DESC, trip_count DESC
        LIMIT ?
      `;

      const [rows] = await db.execute(query, [limit]);
      return rows;
    } catch (error) {
      console.error('Error getting popular cities:', error);
      throw new Error('Failed to get popular cities');
    }
  }

  /**
   * Find city by ID
   * @param {number} id - City ID
   * @returns {Object|null} City data
   */
  static async findById(id) {
    try {
      const query = `
        SELECT c.*, COUNT(tc.trip_id) as trip_count
        FROM cities c
        LEFT JOIN trip_cities tc ON c.id = tc.city_id
        WHERE c.id = ?
        GROUP BY c.id
      `;

      const [rows] = await db.execute(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding city by ID:', error);
      throw new Error('Failed to find city');
    }
  }

  /**
   * Add city to trip
   * @param {number} tripId - Trip ID
   * @param {number} cityId - City ID
   * @param {Object} cityData - Additional city data
   * @returns {Object} Created trip city relationship
   */
  static async addCityToTrip(tripId, cityId, cityData = {}) {
    try {
      const { arrival_date, departure_date, order_index = 0 } = cityData;

      const query = `
        INSERT INTO trip_cities (trip_id, city_id, arrival_date, departure_date, order_index)
        VALUES (?, ?, ?, ?, ?)
      `;

      const [result] = await db.execute(query, [
        tripId, cityId, arrival_date, departure_date, order_index
      ]);

      return await this.getTripCity(result.insertId);
    } catch (error) {
      console.error('Error adding city to trip:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('City already added to this trip');
      }
      throw new Error('Failed to add city to trip');
    }
  }

  /**
   * Get trip city relationship
   * @param {number} tripCityId - Trip city ID
   * @returns {Object|null} Trip city data
   */
  static async getTripCity(tripCityId) {
    try {
      const query = `
        SELECT tc.*, c.name, c.country, c.latitude, c.longitude, c.cost_index
        FROM trip_cities tc
        JOIN cities c ON tc.city_id = c.id
        WHERE tc.id = ?
      `;

      const [rows] = await db.execute(query, [tripCityId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error getting trip city:', error);
      throw new Error('Failed to get trip city');
    }
  }

  /**
   * Get cities for a trip
   * @param {number} tripId - Trip ID
   * @returns {Array} Array of cities in the trip
   */
  static async getCitiesForTrip(tripId) {
    try {
      const query = `
        SELECT tc.*, c.name, c.country, c.latitude, c.longitude, c.cost_index, c.description
        FROM trip_cities tc
        JOIN cities c ON tc.city_id = c.id
        WHERE tc.trip_id = ?
        ORDER BY tc.order_index ASC, tc.arrival_date ASC
      `;

      const [rows] = await db.execute(query, [tripId]);
      return rows;
    } catch (error) {
      console.error('Error getting cities for trip:', error);
      throw new Error('Failed to get cities for trip');
    }
  }

  /**
   * Remove city from trip
   * @param {number} tripId - Trip ID
   * @param {number} cityId - City ID
   * @returns {boolean} Success status
   */
  static async removeCityFromTrip(tripId, cityId) {
    try {
      const query = 'DELETE FROM trip_cities WHERE trip_id = ? AND city_id = ?';
      const [result] = await db.execute(query, [tripId, cityId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error removing city from trip:', error);
      throw new Error('Failed to remove city from trip');
    }
  }

  /**
   * Update trip city
   * @param {number} tripCityId - Trip city ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated trip city
   */
  static async updateTripCity(tripCityId, updateData) {
    try {
      const allowedFields = ['arrival_date', 'departure_date', 'order_index'];
      
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
      
      values.push(tripCityId);
      
      const query = `
        UPDATE trip_cities 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      await db.execute(query, values);
      return await this.getTripCity(tripCityId);
    } catch (error) {
      console.error('Error updating trip city:', error);
      throw new Error('Failed to update trip city');
    }
  }

  /**
   * Get countries with city counts
   * @returns {Array} Array of countries with city counts
   */
  static async getCountries() {
    try {
      const query = `
        SELECT country, country_code, COUNT(*) as city_count
        FROM cities
        GROUP BY country, country_code
        ORDER BY city_count DESC, country ASC
      `;

      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error('Error getting countries:', error);
      throw new Error('Failed to get countries');
    }
  }

  /**
   * Create a new city
   * @param {Object} cityData - City data
   * @returns {Object} Created city
   */
  static async createCity(cityData) {
    try {
      const {
        name,
        country,
        country_code,
        latitude,
        longitude,
        cost_index,
        popularity_score = 0,
        description,
        image_url
      } = cityData;

      const query = `
        INSERT INTO cities (name, country, country_code, latitude, longitude, cost_index, popularity_score, description, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.execute(query, [
        name, country, country_code, latitude, longitude, cost_index, popularity_score, description, image_url
      ]);

      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error creating city:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('City already exists');
      }
      throw new Error('Failed to create city');
    }
  }
  /**
   * Admin methods for city management
   */

  // Get all cities for admin
  static async getAllCities() {
    try {
      const query = `
        SELECT c.*,
               COUNT(DISTINCT t.id) as trip_count,
               COUNT(DISTINCT a.id) as activity_count
        FROM cities c
        LEFT JOIN trips t ON c.name = t.destination
        LEFT JOIN activities a ON c.id = a.city_id
        GROUP BY c.id
        ORDER BY c.name ASC
      `;
      return await db.query(query);
    } catch (error) {
      console.error('Get all cities error:', error);
      throw error;
    }
  }

  // Create city
  static async createCity(cityData) {
    try {
      const { name, country, description, image_url, latitude, longitude } = cityData;

      const query = `
        INSERT INTO cities (name, country, description, image_url, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const result = await db.query(query, [name, country, description, image_url, latitude, longitude]);
      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Create city error:', error);
      throw error;
    }
  }

  // Update city
  static async updateCity(id, updateData) {
    try {
      const allowedFields = ['name', 'country', 'description', 'image_url', 'latitude', 'longitude'];
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
      const query = `UPDATE cities SET ${updates.join(', ')} WHERE id = ?`;

      await db.query(query, params);
      return await this.findById(id);
    } catch (error) {
      console.error('Update city error:', error);
      throw error;
    }
  }

  // Delete city
  static async deleteCity(id) {
    try {
      const query = 'DELETE FROM cities WHERE id = ?';
      const result = await db.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Delete city error:', error);
      throw error;
    }
  }

  // Get popular cities with stats
  static async getPopularCitiesWithStats(limit = 10) {
    try {
      const query = `
        SELECT c.*,
               COUNT(DISTINCT t.id) as trip_count,
               COUNT(DISTINCT a.id) as activity_count,
               AVG(t.budget) as avg_budget
        FROM cities c
        LEFT JOIN trips t ON c.name = t.destination
        LEFT JOIN activities a ON c.id = a.city_id
        GROUP BY c.id
        ORDER BY trip_count DESC, c.name ASC
        LIMIT ?
      `;
      return await db.query(query, [limit]);
    } catch (error) {
      console.error('Get popular cities with stats error:', error);
      throw error;
    }
  }
}

module.exports = CityModel;
