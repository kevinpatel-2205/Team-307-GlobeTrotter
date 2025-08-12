const TripModel = require('../models/tripModel');
const CityModel = require('../models/cityModel');
const ItineraryModel = require('../models/itineraryModel');

/**
 * Trip Controller
 * Handles trip-related HTTP requests
 */
class TripController {
  /**
   * Create a new trip
   * POST /api/trips
   */
  static async createTrip(req, res) {
    try {
      const { title, description, startDate, endDate, budget } = req.body;
      const userId = req.user.id;

      // Input validation
      if (!title || !startDate || !endDate) {
        return res.status(400).json({
          message: 'Title, start date, and end date are required',
          error: 'MISSING_FIELDS'
        });
      }

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        return res.status(400).json({
          message: 'End date must be after start date',
          error: 'INVALID_DATES'
        });
      }

      // Handle cover photo upload
      const coverPhotoPath = req.file ? `/uploads/${req.file.filename}` : null;

      const tripData = {
        user_id: userId,
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        cover_photo_path: coverPhotoPath,
        budget: budget ? parseFloat(budget) : null
      };

      const trip = await TripModel.createTrip(tripData);

      // Emit Socket.IO event for real-time updates
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${userId}`).emit('trip-update', {
          type: 'created',
          trip
        });
      }

      res.status(201).json({
        message: 'Trip created successfully',
        trip
      });
    } catch (error) {
      console.error('Create trip error:', error);
      res.status(500).json({
        message: 'Failed to create trip',
        error: 'CREATE_TRIP_ERROR'
      });
    }
  }

  /**
   * Get user's trips
   * GET /api/trips
   */
  static async getUserTrips(req, res) {
    try {
      const userId = req.user.id;
      const { status, limit = 20, offset = 0 } = req.query;

      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        status
      };

      const trips = await TripModel.findByUserId(userId, options);

      res.json({
        trips,
        pagination: {
          limit: options.limit,
          offset: options.offset,
          total: trips.length
        }
      });
    } catch (error) {
      console.error('Get user trips error:', error);
      res.status(500).json({
        message: 'Failed to get trips',
        error: 'GET_TRIPS_ERROR'
      });
    }
  }

  /**
   * Get trip by ID
   * GET /api/trips/:id
   */
  static async getTripById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const trip = await TripModel.findById(id);

      if (!trip) {
        return res.status(404).json({
          message: 'Trip not found',
          error: 'TRIP_NOT_FOUND'
        });
      }

      // Check if user owns the trip
      if (trip.user_id !== userId) {
        return res.status(403).json({
          message: 'Access denied',
          error: 'ACCESS_DENIED'
        });
      }

      // Get additional trip data
      const [cities, stats, summary] = await Promise.all([
        CityModel.getCitiesForTrip(id),
        TripModel.getTripStats(id),
        ItineraryModel.getTripSummary(id)
      ]);

      res.json({
        trip: {
          ...trip,
          cities,
          stats,
          summary
        }
      });
    } catch (error) {
      console.error('Get trip by ID error:', error);
      res.status(500).json({
        message: 'Failed to get trip',
        error: 'GET_TRIP_ERROR'
      });
    }
  }

  /**
   * Update trip
   * PUT /api/trips/:id
   */
  static async updateTrip(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      // Check if trip exists and user owns it
      const existingTrip = await TripModel.findById(id);
      
      if (!existingTrip) {
        return res.status(404).json({
          message: 'Trip not found',
          error: 'TRIP_NOT_FOUND'
        });
      }

      if (existingTrip.user_id !== userId) {
        return res.status(403).json({
          message: 'Access denied',
          error: 'ACCESS_DENIED'
        });
      }

      // Handle cover photo upload
      if (req.file) {
        updateData.cover_photo_path = `/uploads/${req.file.filename}`;
      }

      // Validate dates if provided
      if (updateData.start_date && updateData.end_date) {
        const start = new Date(updateData.start_date);
        const end = new Date(updateData.end_date);
        
        if (start >= end) {
          return res.status(400).json({
            message: 'End date must be after start date',
            error: 'INVALID_DATES'
          });
        }
      }

      const updatedTrip = await TripModel.updateTrip(id, updateData);

      // Emit Socket.IO event for real-time updates
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${userId}`).emit('trip-update', {
          type: 'updated',
          trip: updatedTrip
        });
      }

      res.json({
        message: 'Trip updated successfully',
        trip: updatedTrip
      });
    } catch (error) {
      console.error('Update trip error:', error);
      res.status(500).json({
        message: 'Failed to update trip',
        error: 'UPDATE_TRIP_ERROR'
      });
    }
  }

  /**
   * Delete trip
   * DELETE /api/trips/:id
   */
  static async deleteTrip(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if trip exists and user owns it
      const trip = await TripModel.findById(id);
      
      if (!trip) {
        return res.status(404).json({
          message: 'Trip not found',
          error: 'TRIP_NOT_FOUND'
        });
      }

      if (trip.user_id !== userId) {
        return res.status(403).json({
          message: 'Access denied',
          error: 'ACCESS_DENIED'
        });
      }

      const deleted = await TripModel.deleteTrip(id);

      if (!deleted) {
        return res.status(500).json({
          message: 'Failed to delete trip',
          error: 'DELETE_TRIP_ERROR'
        });
      }

      // Emit Socket.IO event for real-time updates
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${userId}`).emit('trip-update', {
          type: 'deleted',
          tripId: id
        });
      }

      res.json({
        message: 'Trip deleted successfully'
      });
    } catch (error) {
      console.error('Delete trip error:', error);
      res.status(500).json({
        message: 'Failed to delete trip',
        error: 'DELETE_TRIP_ERROR'
      });
    }
  }

  /**
   * Generate public URL for trip sharing
   * POST /api/trips/:id/share
   */
  static async shareTrip(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if trip exists and user owns it
      const trip = await TripModel.findById(id);
      
      if (!trip) {
        return res.status(404).json({
          message: 'Trip not found',
          error: 'TRIP_NOT_FOUND'
        });
      }

      if (trip.user_id !== userId) {
        return res.status(403).json({
          message: 'Access denied',
          error: 'ACCESS_DENIED'
        });
      }

      const publicUrl = await TripModel.generatePublicUrl(id);

      res.json({
        message: 'Trip shared successfully',
        publicUrl,
        shareUrl: `${req.protocol}://${req.get('host')}/shared/${publicUrl}`
      });
    } catch (error) {
      console.error('Share trip error:', error);
      res.status(500).json({
        message: 'Failed to share trip',
        error: 'SHARE_TRIP_ERROR'
      });
    }
  }

  /**
   * Get public trip by URL
   * GET /api/trips/shared/:publicUrl
   */
  static async getSharedTrip(req, res) {
    try {
      const { publicUrl } = req.params;

      const trip = await TripModel.findByPublicUrl(publicUrl);

      if (!trip) {
        return res.status(404).json({
          message: 'Shared trip not found',
          error: 'SHARED_TRIP_NOT_FOUND'
        });
      }

      // Get additional trip data
      const [cities, itinerary, summary] = await Promise.all([
        CityModel.getCitiesForTrip(trip.id),
        ItineraryModel.getItemsForTrip(trip.id, { groupByDate: true }),
        ItineraryModel.getTripSummary(trip.id)
      ]);

      res.json({
        trip: {
          ...trip,
          cities,
          itinerary,
          summary
        }
      });
    } catch (error) {
      console.error('Get shared trip error:', error);
      res.status(500).json({
        message: 'Failed to get shared trip',
        error: 'GET_SHARED_TRIP_ERROR'
      });
    }
  }

  /**
   * Get trip statistics
   * GET /api/trips/:id/stats
   */
  static async getTripStats(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if trip exists and user owns it
      const trip = await TripModel.findById(id);
      
      if (!trip) {
        return res.status(404).json({
          message: 'Trip not found',
          error: 'TRIP_NOT_FOUND'
        });
      }

      if (trip.user_id !== userId) {
        return res.status(403).json({
          message: 'Access denied',
          error: 'ACCESS_DENIED'
        });
      }

      const [stats, summary, costBreakdown] = await Promise.all([
        TripModel.getTripStats(id),
        ItineraryModel.getTripSummary(id),
        ItineraryModel.getCostBreakdown(id)
      ]);

      res.json({
        stats,
        summary,
        costBreakdown
      });
    } catch (error) {
      console.error('Get trip stats error:', error);
      res.status(500).json({
        message: 'Failed to get trip statistics',
        error: 'GET_TRIP_STATS_ERROR'
      });
    }
  }
}

module.exports = TripController;
