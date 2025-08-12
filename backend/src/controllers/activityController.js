const ActivityModel = require('../models/activityModel');
const ItineraryModel = require('../models/itineraryModel');

/**
 * Activity Controller
 * Handles activity-related HTTP requests
 */
class ActivityController {
  /**
   * Global activity search
   * GET /api/activities/search?q=&category=&minCost=&maxCost=&minRating=&limit=20
   */
  static async searchActivities(req, res) {
    try {
      const {
        q: query,
        category,
        minCost,
        maxCost,
        minRating,
        limit = 20
      } = req.query;

      const filters = {
        query,
        category,
        minCost: minCost ? parseFloat(minCost) : undefined,
        maxCost: maxCost ? parseFloat(maxCost) : undefined,
        minRating: minRating ? parseFloat(minRating) : undefined,
        limit: parseInt(limit)
      };

      const activities = await ActivityModel.globalSearch(filters);

      res.json({
        activities,
        total: activities.length
      });
    } catch (error) {
      console.error('Global activity search error:', error);
      res.status(500).json({
        message: 'Failed to search activities',
        error: 'SEARCH_ACTIVITIES_ERROR'
      });
    }
  }

  /**
   * Get popular activities globally
   * GET /api/activities/popular?limit=10
   */
  static async getPopularActivities(req, res) {
    try {
      const { limit = 10 } = req.query;
      const activities = await ActivityModel.getPopular(parseInt(limit));

      res.json({
        activities
      });
    } catch (error) {
      console.error('Get popular activities error:', error);
      res.status(500).json({
        message: 'Failed to get popular activities',
        error: 'GET_POPULAR_ACTIVITIES_ERROR'
      });
    }
  }

  /**
   * Search activities for a city
   * GET /api/cities/:cityId/activities?category=&minCost=&maxCost=&minDuration=&maxDuration=&minRating=&limit=20&offset=0
   */
  static async searchActivitiesForCity(req, res) {
    try {
      const { cityId } = req.params;
      const {
        category,
        minCost,
        maxCost,
        minDuration,
        maxDuration,
        minRating,
        limit = 20,
        offset = 0
      } = req.query;

      const filters = {
        category,
        minCost: minCost ? parseFloat(minCost) : undefined,
        maxCost: maxCost ? parseFloat(maxCost) : undefined,
        minDuration: minDuration ? parseFloat(minDuration) : undefined,
        maxDuration: maxDuration ? parseFloat(maxDuration) : undefined,
        minRating: minRating ? parseFloat(minRating) : undefined,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      const activities = await ActivityModel.searchActivities(cityId, filters);

      res.json({
        activities,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: activities.length
        }
      });
    } catch (error) {
      console.error('Search activities error:', error);
      res.status(500).json({
        message: 'Failed to search activities',
        error: 'SEARCH_ACTIVITIES_ERROR'
      });
    }
  }

  /**
   * Get popular activities for a city
   * GET /api/cities/:cityId/activities/popular?limit=10
   */
  static async getPopularActivities(req, res) {
    try {
      const { cityId } = req.params;
      const { limit = 10 } = req.query;

      const activities = await ActivityModel.getPopularActivities(cityId, parseInt(limit));

      res.json({
        activities
      });
    } catch (error) {
      console.error('Get popular activities error:', error);
      res.status(500).json({
        message: 'Failed to get popular activities',
        error: 'GET_POPULAR_ACTIVITIES_ERROR'
      });
    }
  }

  /**
   * Get activities by category
   * GET /api/cities/:cityId/activities/category/:category?limit=20
   */
  static async getActivitiesByCategory(req, res) {
    try {
      const { cityId, category } = req.params;
      const { limit = 20 } = req.query;

      const activities = await ActivityModel.getActivitiesByCategory(
        cityId, 
        category, 
        parseInt(limit)
      );

      res.json({
        activities
      });
    } catch (error) {
      console.error('Get activities by category error:', error);
      res.status(500).json({
        message: 'Failed to get activities by category',
        error: 'GET_ACTIVITIES_BY_CATEGORY_ERROR'
      });
    }
  }

  /**
   * Get activity by ID
   * GET /api/activities/:id
   */
  static async getActivityById(req, res) {
    try {
      const { id } = req.params;

      const activity = await ActivityModel.findById(id);

      if (!activity) {
        return res.status(404).json({
          message: 'Activity not found',
          error: 'ACTIVITY_NOT_FOUND'
        });
      }

      res.json({
        activity
      });
    } catch (error) {
      console.error('Get activity by ID error:', error);
      res.status(500).json({
        message: 'Failed to get activity',
        error: 'GET_ACTIVITY_ERROR'
      });
    }
  }

  /**
   * Add activity to trip
   * POST /api/activities/:id/add-to-trip
   */
  static async addActivityToTrip(req, res) {
    try {
      const { id: activityId } = req.params;
      const { tripId, startTime, endTime, cost, notes } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!tripId) {
        return res.status(400).json({
          message: 'Trip ID is required',
          error: 'MISSING_TRIP_ID'
        });
      }

      // Check if activity exists
      const activity = await ActivityModel.findById(activityId);
      if (!activity) {
        return res.status(404).json({
          message: 'Activity not found',
          error: 'ACTIVITY_NOT_FOUND'
        });
      }

      // TODO: Verify that the user owns the trip

      const scheduleData = {
        start_time: startTime,
        end_time: endTime,
        cost: cost ? parseFloat(cost) : null,
        notes
      };

      const itineraryItem = await ItineraryModel.addActivityToTrip(
        tripId, 
        activityId, 
        scheduleData
      );

      res.status(201).json({
        message: 'Activity added to trip successfully',
        itineraryItem
      });
    } catch (error) {
      console.error('Add activity to trip error:', error);
      res.status(500).json({
        message: 'Failed to add activity to trip',
        error: 'ADD_ACTIVITY_TO_TRIP_ERROR'
      });
    }
  }

  /**
   * Get activity categories
   * GET /api/activities/categories
   */
  static async getCategories(req, res) {
    try {
      const categories = await ActivityModel.getCategories();

      res.json({
        categories
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        message: 'Failed to get categories',
        error: 'GET_CATEGORIES_ERROR'
      });
    }
  }

  /**
   * Get activities for multiple cities (for trip planning)
   * POST /api/activities/for-cities
   */
  static async getActivitiesForCities(req, res) {
    try {
      const { cityIds, category, limit = 5 } = req.body;

      if (!cityIds || !Array.isArray(cityIds) || cityIds.length === 0) {
        return res.status(400).json({
          message: 'City IDs array is required',
          error: 'MISSING_CITY_IDS'
        });
      }

      const filters = {
        category,
        limit: parseInt(limit)
      };

      const activitiesByCity = await ActivityModel.getActivitiesForCities(cityIds, filters);

      res.json({
        activitiesByCity
      });
    } catch (error) {
      console.error('Get activities for cities error:', error);
      res.status(500).json({
        message: 'Failed to get activities for cities',
        error: 'GET_ACTIVITIES_FOR_CITIES_ERROR'
      });
    }
  }

  /**
   * Create a new activity (admin only)
   * POST /api/activities
   */
  static async createActivity(req, res) {
    try {
      const {
        cityId,
        name,
        description,
        category,
        durationHours,
        costMin,
        costMax,
        rating,
        imageUrl,
        websiteUrl
      } = req.body;

      // Input validation
      if (!cityId || !name) {
        return res.status(400).json({
          message: 'City ID and name are required',
          error: 'MISSING_FIELDS'
        });
      }

      const activityData = {
        city_id: cityId,
        name,
        description,
        category: category || 'other',
        duration_hours: durationHours ? parseFloat(durationHours) : null,
        cost_min: costMin ? parseFloat(costMin) : null,
        cost_max: costMax ? parseFloat(costMax) : null,
        rating: rating ? parseFloat(rating) : null,
        image_url: imageUrl,
        website_url: websiteUrl
      };

      const activity = await ActivityModel.createActivity(activityData);

      res.status(201).json({
        message: 'Activity created successfully',
        activity
      });
    } catch (error) {
      console.error('Create activity error:', error);
      res.status(500).json({
        message: 'Failed to create activity',
        error: 'CREATE_ACTIVITY_ERROR'
      });
    }
  }

  /**
   * Update activity (admin only)
   * PUT /api/activities/:id
   */
  static async updateActivity(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if activity exists
      const existingActivity = await ActivityModel.findById(id);
      
      if (!existingActivity) {
        return res.status(404).json({
          message: 'Activity not found',
          error: 'ACTIVITY_NOT_FOUND'
        });
      }

      const updatedActivity = await ActivityModel.updateActivity(id, updateData);

      res.json({
        message: 'Activity updated successfully',
        activity: updatedActivity
      });
    } catch (error) {
      console.error('Update activity error:', error);
      res.status(500).json({
        message: 'Failed to update activity',
        error: 'UPDATE_ACTIVITY_ERROR'
      });
    }
  }

  /**
   * Delete activity (admin only)
   * DELETE /api/activities/:id
   */
  static async deleteActivity(req, res) {
    try {
      const { id } = req.params;

      // Check if activity exists
      const activity = await ActivityModel.findById(id);
      
      if (!activity) {
        return res.status(404).json({
          message: 'Activity not found',
          error: 'ACTIVITY_NOT_FOUND'
        });
      }

      const deleted = await ActivityModel.deleteActivity(id);

      if (!deleted) {
        return res.status(500).json({
          message: 'Failed to delete activity',
          error: 'DELETE_ACTIVITY_ERROR'
        });
      }

      res.json({
        message: 'Activity deleted successfully'
      });
    } catch (error) {
      console.error('Delete activity error:', error);
      res.status(500).json({
        message: 'Failed to delete activity',
        error: 'DELETE_ACTIVITY_ERROR'
      });
    }
  }
}

module.exports = ActivityController;
