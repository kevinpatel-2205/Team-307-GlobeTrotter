const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const ActivityController = require('../controllers/activityController');

const router = express.Router();

/**
 * Activity Routes
 * Some routes require authentication, others are public
 */

// Get activity categories (public)
router.get('/categories', ActivityController.getCategories);

// Global activity search (public)
router.get('/search', ActivityController.searchActivities);

// Get popular activities globally (public)
router.get('/popular', ActivityController.getPopularActivities);

// Get activities for multiple cities (public)
router.post('/for-cities', ActivityController.getActivitiesForCities);

// Get activity by ID (public)
router.get('/:id', ActivityController.getActivityById);

// Add activity to trip (requires authentication)
router.post('/:id/add-to-trip', authenticateToken, ActivityController.addActivityToTrip);

// Create a new activity (admin only - requires authentication for now)
router.post('/', authenticateToken, ActivityController.createActivity);

// Update activity (admin only - requires authentication)
router.put('/:id', authenticateToken, ActivityController.updateActivity);

// Delete activity (admin only - requires authentication)
router.delete('/:id', authenticateToken, ActivityController.deleteActivity);

module.exports = router;
