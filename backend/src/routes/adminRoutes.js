const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/adminAuth');
const UserModel = require('../models/userModel');
const CityModel = require('../models/cityModel');
const ActivityModel = require('../models/activityModel');

// Dashboard analytics
router.get('/dashboard', authenticateAdmin, AdminController.getDashboardAnalytics);

// User management
router.get('/users', authenticateAdmin, AdminController.getUsers);
router.put('/users/:id', authenticateAdmin, AdminController.updateUser);
router.delete('/users/:id', authenticateAdmin, AdminController.deleteUser);

// Trip management
router.get('/trips', authenticateAdmin, AdminController.getTrips);
router.get('/trips/analytics', authenticateAdmin, AdminController.getTripAnalytics);
router.put('/trips/:id/feature', authenticateAdmin, AdminController.featureTrip);

// City management
router.get('/cities', authenticateAdmin, async (req, res) => {
  try {
    const cities = await CityModel.getAllCities();
    res.json({ cities });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get cities', error: 'GET_CITIES_ERROR' });
  }
});

router.post('/cities', authenticateAdmin, async (req, res) => {
  try {
    const city = await CityModel.createCity(req.body);
    res.status(201).json({ message: 'City created successfully', city });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create city', error: 'CREATE_CITY_ERROR' });
  }
});

router.put('/cities/:id', authenticateAdmin, async (req, res) => {
  try {
    const city = await CityModel.updateCity(req.params.id, req.body);
    res.json({ message: 'City updated successfully', city });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update city', error: 'UPDATE_CITY_ERROR' });
  }
});

router.delete('/cities/:id', authenticateAdmin, async (req, res) => {
  try {
    await CityModel.deleteCity(req.params.id);
    res.json({ message: 'City deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete city', error: 'DELETE_CITY_ERROR' });
  }
});

// Activity management
router.get('/activities', authenticateAdmin, async (req, res) => {
  try {
    const activities = await ActivityModel.getAllActivities();
    res.json({ activities });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get activities', error: 'GET_ACTIVITIES_ERROR' });
  }
});

router.post('/activities', authenticateAdmin, async (req, res) => {
  try {
    const activity = await ActivityModel.createActivity(req.body);
    res.status(201).json({ message: 'Activity created successfully', activity });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create activity', error: 'CREATE_ACTIVITY_ERROR' });
  }
});

router.put('/activities/:id', authenticateAdmin, async (req, res) => {
  try {
    const activity = await ActivityModel.updateActivity(req.params.id, req.body);
    res.json({ message: 'Activity updated successfully', activity });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update activity', error: 'UPDATE_ACTIVITY_ERROR' });
  }
});

router.delete('/activities/:id', authenticateAdmin, async (req, res) => {
  try {
    await ActivityModel.deleteActivity(req.params.id);
    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete activity', error: 'DELETE_ACTIVITY_ERROR' });
  }
});

// System monitoring
router.get('/system/health', authenticateAdmin, (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

router.get('/system/logs', authenticateAdmin, (req, res) => {
  // In a real application, you'd read from log files
  res.json({
    logs: [
      { level: 'info', message: 'Server started', timestamp: new Date().toISOString() },
      { level: 'info', message: 'Database connected', timestamp: new Date().toISOString() }
    ]
  });
});

// Analytics endpoints
router.get('/analytics/users', authenticateAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const analytics = await UserModel.getUserAnalytics(period);
    res.json({ analytics });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user analytics', error: 'USER_ANALYTICS_ERROR' });
  }
});

router.get('/analytics/revenue', authenticateAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    // Mock revenue data - in real app, this would come from payment system
    const revenue = {
      total: 125000,
      thisMonth: 15000,
      growth: 12.5,
      byMonth: [
        { month: 'Jan', revenue: 10000 },
        { month: 'Feb', revenue: 12000 },
        { month: 'Mar', revenue: 15000 }
      ]
    };
    res.json({ revenue });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get revenue analytics', error: 'REVENUE_ANALYTICS_ERROR' });
  }
});

module.exports = router;
