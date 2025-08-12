const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const TripController = require('../controllers/tripController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'trip-cover-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * Trip Routes
 * All routes require authentication
 */

// Create a new trip
router.post('/', authenticateToken, upload.single('coverPhoto'), TripController.createTrip);

// Get user's trips
router.get('/', authenticateToken, TripController.getUserTrips);

// Get trip by ID
router.get('/:id', authenticateToken, TripController.getTripById);

// Update trip
router.put('/:id', authenticateToken, upload.single('coverPhoto'), TripController.updateTrip);

// Delete trip
router.delete('/:id', authenticateToken, TripController.deleteTrip);

// Generate public URL for trip sharing
router.post('/:id/share', authenticateToken, TripController.shareTrip);

// Get trip statistics
router.get('/:id/stats', authenticateToken, TripController.getTripStats);

// Get public trip by URL (no authentication required)
router.get('/shared/:publicUrl', TripController.getSharedTrip);

module.exports = router;
