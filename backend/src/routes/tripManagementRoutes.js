const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const CityController = require('../controllers/cityController');
const ItineraryController = require('../controllers/itineraryController');
const ActivityController = require('../controllers/activityController');

const router = express.Router();

/**
 * Trip Management Routes
 * Routes that combine trip, city, and itinerary functionality
 * All routes require authentication
 */

// Get cities for a trip
router.get('/:tripId/cities', authenticateToken, CityController.getCitiesForTrip);

// Update trip city
router.put('/:tripId/cities/:cityId', authenticateToken, CityController.updateTripCity);

// Get itinerary for a trip
router.get('/:tripId/itinerary', authenticateToken, ItineraryController.getTripItinerary);

// Create itinerary item for a trip
router.post('/:tripId/itinerary', authenticateToken, ItineraryController.createItineraryItem);

// Get trip summary
router.get('/:tripId/summary', authenticateToken, ItineraryController.getTripSummary);

// Get cost breakdown for a trip
router.get('/:tripId/cost-breakdown', authenticateToken, ItineraryController.getCostBreakdown);

// Reorder itinerary items
router.put('/:tripId/itinerary/reorder', authenticateToken, ItineraryController.reorderItineraryItems);

// Add activity to trip itinerary
router.post('/:tripId/itinerary/add-activity', authenticateToken, ItineraryController.addActivityToItinerary);

// Get activities for a city (within trip context)
router.get('/:tripId/cities/:cityId/activities', authenticateToken, ActivityController.searchActivities);

// Get popular activities for a city (within trip context)
router.get('/:tripId/cities/:cityId/activities/popular', authenticateToken, ActivityController.getPopularActivities);

// Get activities by category for a city (within trip context)
router.get('/:tripId/cities/:cityId/activities/category/:category', authenticateToken, ActivityController.getActivitiesByCategory);

module.exports = router;
