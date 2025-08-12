const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const ItineraryController = require('../controllers/itineraryController');

const router = express.Router();

/**
 * Itinerary Routes
 * All routes require authentication
 */

// Get itinerary item by ID
router.get('/:id', authenticateToken, ItineraryController.getItineraryItem);

// Update itinerary item
router.put('/:id', authenticateToken, ItineraryController.updateItineraryItem);

// Delete itinerary item
router.delete('/:id', authenticateToken, ItineraryController.deleteItineraryItem);

module.exports = router;
