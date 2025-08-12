const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const CityController = require('../controllers/cityController');

const router = express.Router();

/**
 * City Routes
 * Some routes require authentication, others are public
 */

// Search cities (public)
router.get('/search', CityController.searchCities);

// Get popular cities (public)
router.get('/popular', CityController.getPopularCities);

// Get countries (public)
router.get('/countries', CityController.getCountries);

// Get city by ID (public)
router.get('/:id', CityController.getCityById);

// Add city to trip (requires authentication)
router.post('/:id/add-to-trip', authenticateToken, CityController.addCityToTrip);

// Remove city from trip (requires authentication)
router.delete('/:id/remove-from-trip/:tripId', authenticateToken, CityController.removeCityFromTrip);

// Create a new city (admin only - requires authentication for now)
router.post('/', authenticateToken, CityController.createCity);

module.exports = router;
