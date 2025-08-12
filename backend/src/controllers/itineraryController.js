const ItineraryModel = require('../models/itineraryModel');

/**
 * Itinerary Controller
 * Handles itinerary-related HTTP requests
 */
class ItineraryController {
  /**
   * Get itinerary for a trip
   * GET /api/trips/:tripId/itinerary?groupByDate=true&category=
   */
  static async getTripItinerary(req, res) {
    try {
      const { tripId } = req.params;
      const { groupByDate = 'false', category } = req.query;
      const userId = req.user.id;

      // TODO: Verify that the user owns the trip

      const options = {
        groupByDate: groupByDate === 'true',
        category
      };

      const itinerary = await ItineraryModel.getItemsForTrip(tripId, options);

      res.json({
        itinerary
      });
    } catch (error) {
      console.error('Get trip itinerary error:', error);
      res.status(500).json({
        message: 'Failed to get trip itinerary',
        error: 'GET_TRIP_ITINERARY_ERROR'
      });
    }
  }

  /**
   * Create itinerary item
   * POST /api/trips/:tripId/itinerary
   */
  static async createItineraryItem(req, res) {
    try {
      const { tripId } = req.params;
      const {
        cityId,
        activityId,
        title,
        description,
        location,
        startTime,
        endTime,
        cost,
        category,
        bookingReference,
        notes,
        orderIndex
      } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!title) {
        return res.status(400).json({
          message: 'Title is required',
          error: 'MISSING_TITLE'
        });
      }

      // TODO: Verify that the user owns the trip

      const itemData = {
        trip_id: tripId,
        city_id: cityId,
        activity_id: activityId,
        title,
        description,
        location,
        start_time: startTime,
        end_time: endTime,
        cost: cost ? parseFloat(cost) : null,
        category: category || 'other',
        booking_reference: bookingReference,
        notes,
        order_index: orderIndex || 0
      };

      const itineraryItem = await ItineraryModel.createItem(itemData);

      res.status(201).json({
        message: 'Itinerary item created successfully',
        itineraryItem
      });
    } catch (error) {
      console.error('Create itinerary item error:', error);
      res.status(500).json({
        message: 'Failed to create itinerary item',
        error: 'CREATE_ITINERARY_ITEM_ERROR'
      });
    }
  }

  /**
   * Get itinerary item by ID
   * GET /api/itinerary/:id
   */
  static async getItineraryItem(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const itineraryItem = await ItineraryModel.findById(id);

      if (!itineraryItem) {
        return res.status(404).json({
          message: 'Itinerary item not found',
          error: 'ITINERARY_ITEM_NOT_FOUND'
        });
      }

      // TODO: Verify that the user owns the trip that this item belongs to

      res.json({
        itineraryItem
      });
    } catch (error) {
      console.error('Get itinerary item error:', error);
      res.status(500).json({
        message: 'Failed to get itinerary item',
        error: 'GET_ITINERARY_ITEM_ERROR'
      });
    }
  }

  /**
   * Update itinerary item
   * PUT /api/itinerary/:id
   */
  static async updateItineraryItem(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      // Check if itinerary item exists
      const existingItem = await ItineraryModel.findById(id);
      
      if (!existingItem) {
        return res.status(404).json({
          message: 'Itinerary item not found',
          error: 'ITINERARY_ITEM_NOT_FOUND'
        });
      }

      // TODO: Verify that the user owns the trip that this item belongs to

      // Parse cost if provided
      if (updateData.cost) {
        updateData.cost = parseFloat(updateData.cost);
      }

      const updatedItem = await ItineraryModel.updateItem(id, updateData);

      res.json({
        message: 'Itinerary item updated successfully',
        itineraryItem: updatedItem
      });
    } catch (error) {
      console.error('Update itinerary item error:', error);
      res.status(500).json({
        message: 'Failed to update itinerary item',
        error: 'UPDATE_ITINERARY_ITEM_ERROR'
      });
    }
  }

  /**
   * Delete itinerary item
   * DELETE /api/itinerary/:id
   */
  static async deleteItineraryItem(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if itinerary item exists
      const item = await ItineraryModel.findById(id);
      
      if (!item) {
        return res.status(404).json({
          message: 'Itinerary item not found',
          error: 'ITINERARY_ITEM_NOT_FOUND'
        });
      }

      // TODO: Verify that the user owns the trip that this item belongs to

      const deleted = await ItineraryModel.deleteItem(id);

      if (!deleted) {
        return res.status(500).json({
          message: 'Failed to delete itinerary item',
          error: 'DELETE_ITINERARY_ITEM_ERROR'
        });
      }

      res.json({
        message: 'Itinerary item deleted successfully'
      });
    } catch (error) {
      console.error('Delete itinerary item error:', error);
      res.status(500).json({
        message: 'Failed to delete itinerary item',
        error: 'DELETE_ITINERARY_ITEM_ERROR'
      });
    }
  }

  /**
   * Get trip summary
   * GET /api/trips/:tripId/summary
   */
  static async getTripSummary(req, res) {
    try {
      const { tripId } = req.params;
      const userId = req.user.id;

      // TODO: Verify that the user owns the trip

      const summary = await ItineraryModel.getTripSummary(tripId);

      res.json({
        summary
      });
    } catch (error) {
      console.error('Get trip summary error:', error);
      res.status(500).json({
        message: 'Failed to get trip summary',
        error: 'GET_TRIP_SUMMARY_ERROR'
      });
    }
  }

  /**
   * Get cost breakdown for a trip
   * GET /api/trips/:tripId/cost-breakdown
   */
  static async getCostBreakdown(req, res) {
    try {
      const { tripId } = req.params;
      const userId = req.user.id;

      // TODO: Verify that the user owns the trip

      const costBreakdown = await ItineraryModel.getCostBreakdown(tripId);

      res.json({
        costBreakdown
      });
    } catch (error) {
      console.error('Get cost breakdown error:', error);
      res.status(500).json({
        message: 'Failed to get cost breakdown',
        error: 'GET_COST_BREAKDOWN_ERROR'
      });
    }
  }

  /**
   * Reorder itinerary items with drag-and-drop support
   * PUT /api/trips/:tripId/itinerary/reorder
   */
  static async reorderItineraryItems(req, res) {
    try {
      const { tripId } = req.params;
      const { items } = req.body;
      const userId = req.user.id;

      // Validate input
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({
          message: 'Items array is required',
          error: 'MISSING_ITEMS'
        });
      }

      // TODO: Verify that the user owns the trip

      // Update order_index for each item
      const updatePromises = items.map((item, index) =>
        ItineraryModel.updateItem(item.id, { order_index: index })
      );

      await Promise.all(updatePromises);

      // Emit Socket.IO event for real-time updates
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${userId}`).emit('itinerary-update', {
          type: 'items-reordered',
          tripId,
          items
        });
      }

      res.json({
        message: 'Items reordered successfully',
        items
      });
    } catch (error) {
      console.error('Reorder itinerary items error:', error);
      res.status(500).json({
        message: 'Failed to reorder itinerary items',
        error: 'REORDER_ITINERARY_ITEMS_ERROR'
      });
    }
  }

  /**
   * Update itinerary item
   * PUT /api/itinerary/:id
   */
  static async updateItineraryItem(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      // Check if itinerary item exists
      const existingItem = await ItineraryModel.findById(id);

      if (!existingItem) {
        return res.status(404).json({
          message: 'Itinerary item not found',
          error: 'ITINERARY_ITEM_NOT_FOUND'
        });
      }

      // TODO: Verify that the user owns the trip that this item belongs to

      // Parse cost if provided
      if (updateData.cost) {
        updateData.cost = parseFloat(updateData.cost);
      }

      const updatedItem = await ItineraryModel.updateItem(id, updateData);

      // Emit Socket.IO event for real-time updates
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${userId}`).emit('itinerary-update', {
          type: 'item-updated',
          tripId: existingItem.trip_id,
          item: updatedItem
        });
      }

      res.json({
        message: 'Itinerary item updated successfully',
        item: updatedItem
      });
    } catch (error) {
      console.error('Update itinerary item error:', error);
      res.status(500).json({
        message: 'Failed to update itinerary item',
        error: 'UPDATE_ITINERARY_ITEM_ERROR'
      });
    }
  }

  /**
   * Delete itinerary item
   * DELETE /api/itinerary/:id
   */
  static async deleteItineraryItem(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if itinerary item exists
      const item = await ItineraryModel.findById(id);

      if (!item) {
        return res.status(404).json({
          message: 'Itinerary item not found',
          error: 'ITINERARY_ITEM_NOT_FOUND'
        });
      }

      // TODO: Verify that the user owns the trip that this item belongs to

      const deleted = await ItineraryModel.deleteItem(id);

      if (!deleted) {
        return res.status(500).json({
          message: 'Failed to delete itinerary item',
          error: 'DELETE_ITINERARY_ITEM_ERROR'
        });
      }

      // Emit Socket.IO event for real-time updates
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${userId}`).emit('itinerary-update', {
          type: 'item-deleted',
          tripId: item.trip_id,
          itemId: id
        });
      }

      res.json({
        message: 'Itinerary item deleted successfully'
      });
    } catch (error) {
      console.error('Delete itinerary item error:', error);
      res.status(500).json({
        message: 'Failed to delete itinerary item',
        error: 'DELETE_ITINERARY_ITEM_ERROR'
      });
    }
  }

  /**
   * Add activity to trip itinerary
   * POST /api/trips/:tripId/itinerary/add-activity
   */
  static async addActivityToItinerary(req, res) {
    try {
      const { tripId } = req.params;
      const { activityId, startTime, endTime, cost, notes } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!activityId) {
        return res.status(400).json({
          message: 'Activity ID is required',
          error: 'MISSING_ACTIVITY_ID'
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
        message: 'Activity added to itinerary successfully',
        itineraryItem
      });
    } catch (error) {
      console.error('Add activity to itinerary error:', error);
      res.status(500).json({
        message: 'Failed to add activity to itinerary',
        error: 'ADD_ACTIVITY_TO_ITINERARY_ERROR'
      });
    }
  }
  /**
   * Get itinerary items for a trip (alias for getTripItinerary)
   */
  static async getItineraryItems(req, res) {
    return ItineraryController.getTripItinerary(req, res);
  }

  /**
   * Add itinerary item (alias for createItineraryItem)
   */
  static async addItineraryItem(req, res) {
    return ItineraryController.createItineraryItem(req, res);
  }
}

module.exports = ItineraryController;
