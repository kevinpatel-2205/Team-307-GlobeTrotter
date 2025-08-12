const db = require('../config/db');

/**
 * Itinerary Model
 * Handles all itinerary item-related database operations
 */
class ItineraryModel {
  /**
   * Create a new itinerary item
   * @param {Object} itemData - Itinerary item data
   * @returns {Object} Created itinerary item
   */
  static async createItem(itemData) {
    try {
      const {
        trip_id,
        city_id,
        activity_id,
        title,
        description,
        location,
        start_time,
        end_time,
        cost,
        category = 'other',
        booking_reference,
        notes,
        order_index = 0
      } = itemData;

      const query = `
        INSERT INTO itinerary_items 
        (trip_id, city_id, activity_id, title, description, location, start_time, end_time, cost, category, booking_reference, notes, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.execute(query, [
        trip_id, city_id, activity_id, title, description, location, 
        start_time, end_time, cost, category, booking_reference, notes, order_index
      ]);

      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error creating itinerary item:', error);
      throw new Error('Failed to create itinerary item');
    }
  }

  /**
   * Find itinerary item by ID
   * @param {number} id - Itinerary item ID
   * @returns {Object|null} Itinerary item data
   */
  static async findById(id) {
    try {
      const query = `
        SELECT ii.*, 
               c.name as city_name, c.country,
               a.name as activity_name, a.rating as activity_rating
        FROM itinerary_items ii
        LEFT JOIN cities c ON ii.city_id = c.id
        LEFT JOIN activities a ON ii.activity_id = a.id
        WHERE ii.id = ?
      `;

      const [rows] = await db.execute(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding itinerary item by ID:', error);
      throw new Error('Failed to find itinerary item');
    }
  }

  /**
   * Get itinerary items for a trip
   * @param {number} tripId - Trip ID
   * @param {Object} options - Query options
   * @returns {Array} Array of itinerary items
   */
  static async getItemsForTrip(tripId, options = {}) {
    try {
      const { groupByDate = false, category } = options;
      
      let query = `
        SELECT ii.*, 
               c.name as city_name, c.country,
               a.name as activity_name, a.rating as activity_rating,
               DATE(ii.start_time) as activity_date
        FROM itinerary_items ii
        LEFT JOIN cities c ON ii.city_id = c.id
        LEFT JOIN activities a ON ii.activity_id = a.id
        WHERE ii.trip_id = ?
      `;
      
      const params = [tripId];
      
      if (category) {
        query += ' AND ii.category = ?';
        params.push(category);
      }
      
      query += ' ORDER BY ii.start_time ASC, ii.order_index ASC';

      const [rows] = await db.execute(query, params);
      
      if (groupByDate) {
        return this.groupItemsByDate(rows);
      }
      
      return rows;
    } catch (error) {
      console.error('Error getting itinerary items for trip:', error);
      throw new Error('Failed to get itinerary items');
    }
  }

  /**
   * Group itinerary items by date
   * @param {Array} items - Array of itinerary items
   * @returns {Object} Items grouped by date
   */
  static groupItemsByDate(items) {
    const groupedItems = {};
    
    items.forEach(item => {
      const date = item.activity_date || 'unscheduled';
      if (!groupedItems[date]) {
        groupedItems[date] = [];
      }
      groupedItems[date].push(item);
    });
    
    return groupedItems;
  }

  /**
   * Update itinerary item
   * @param {number} id - Itinerary item ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated itinerary item
   */
  static async updateItem(id, updateData) {
    try {
      const allowedFields = [
        'city_id', 'activity_id', 'title', 'description', 'location',
        'start_time', 'end_time', 'cost', 'category', 'booking_reference',
        'notes', 'order_index'
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
        UPDATE itinerary_items 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await db.execute(query, values);
      return await this.findById(id);
    } catch (error) {
      console.error('Error updating itinerary item:', error);
      throw new Error('Failed to update itinerary item');
    }
  }

  /**
   * Delete itinerary item
   * @param {number} id - Itinerary item ID
   * @returns {boolean} Success status
   */
  static async deleteItem(id) {
    try {
      const query = 'DELETE FROM itinerary_items WHERE id = ?';
      const [result] = await db.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting itinerary item:', error);
      throw new Error('Failed to delete itinerary item');
    }
  }

  /**
   * Add activity to trip itinerary
   * @param {number} tripId - Trip ID
   * @param {number} activityId - Activity ID
   * @param {Object} scheduleData - Schedule data
   * @returns {Object} Created itinerary item
   */
  static async addActivityToTrip(tripId, activityId, scheduleData = {}) {
    try {
      // First get the activity details
      const activityQuery = `
        SELECT a.*, c.id as city_id, c.name as city_name
        FROM activities a
        JOIN cities c ON a.city_id = c.id
        WHERE a.id = ?
      `;
      
      const [activityRows] = await db.execute(activityQuery, [activityId]);
      
      if (activityRows.length === 0) {
        throw new Error('Activity not found');
      }
      
      const activity = activityRows[0];
      
      const itemData = {
        trip_id: tripId,
        city_id: activity.city_id,
        activity_id: activityId,
        title: activity.name,
        description: activity.description,
        location: `${activity.city_name}, ${activity.country}`,
        cost: scheduleData.cost || activity.cost_min,
        category: 'activity',
        ...scheduleData
      };

      return await this.createItem(itemData);
    } catch (error) {
      console.error('Error adding activity to trip:', error);
      throw new Error('Failed to add activity to trip');
    }
  }

  /**
   * Get itinerary summary for a trip
   * @param {number} tripId - Trip ID
   * @returns {Object} Itinerary summary
   */
  static async getTripSummary(tripId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_items,
          COUNT(CASE WHEN category = 'activity' THEN 1 END) as activities_count,
          COUNT(CASE WHEN category = 'hotel' THEN 1 END) as hotels_count,
          COUNT(CASE WHEN category = 'flight' THEN 1 END) as flights_count,
          COUNT(CASE WHEN category = 'restaurant' THEN 1 END) as restaurants_count,
          COUNT(CASE WHEN category = 'transport' THEN 1 END) as transport_count,
          COALESCE(SUM(cost), 0) as total_cost,
          COALESCE(AVG(cost), 0) as avg_cost,
          MIN(start_time) as first_activity,
          MAX(end_time) as last_activity,
          COUNT(DISTINCT city_id) as cities_count,
          COUNT(DISTINCT DATE(start_time)) as days_count
        FROM itinerary_items
        WHERE trip_id = ?
      `;

      const [rows] = await db.execute(query, [tripId]);
      return rows.length > 0 ? rows[0] : {
        total_items: 0,
        activities_count: 0,
        hotels_count: 0,
        flights_count: 0,
        restaurants_count: 0,
        transport_count: 0,
        total_cost: 0,
        avg_cost: 0,
        first_activity: null,
        last_activity: null,
        cities_count: 0,
        days_count: 0
      };
    } catch (error) {
      console.error('Error getting trip summary:', error);
      throw new Error('Failed to get trip summary');
    }
  }

  /**
   * Get cost breakdown by category
   * @param {number} tripId - Trip ID
   * @returns {Array} Cost breakdown by category
   */
  static async getCostBreakdown(tripId) {
    try {
      const query = `
        SELECT 
          category,
          COUNT(*) as item_count,
          COALESCE(SUM(cost), 0) as total_cost,
          COALESCE(AVG(cost), 0) as avg_cost
        FROM itinerary_items
        WHERE trip_id = ? AND cost > 0
        GROUP BY category
        ORDER BY total_cost DESC
      `;

      const [rows] = await db.execute(query, [tripId]);
      return rows;
    } catch (error) {
      console.error('Error getting cost breakdown:', error);
      throw new Error('Failed to get cost breakdown');
    }
  }

  /**
   * Reorder itinerary items
   * @param {Array} itemOrders - Array of {id, order_index} objects
   * @returns {boolean} Success status
   */
  static async reorderItems(itemOrders) {
    try {
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        for (const item of itemOrders) {
          await connection.execute(
            'UPDATE itinerary_items SET order_index = ? WHERE id = ?',
            [item.order_index, item.id]
          );
        }

        await connection.commit();
        return true;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error reordering items:', error);
      throw new Error('Failed to reorder items');
    }
  }
}

module.exports = ItineraryModel;
