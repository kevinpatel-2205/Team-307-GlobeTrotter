const UserModel = require('../models/userModel');
const TripModel = require('../models/tripModel');
const CityModel = require('../models/cityModel');
const ActivityModel = require('../models/activityModel');
const ItineraryModel = require('../models/itineraryModel');

class AdminController {
  /**
   * Get admin dashboard analytics
   * GET /api/admin/dashboard
   */
  static async getDashboardAnalytics(req, res) {
    try {
      const [
        userStats,
        tripStats,
        popularCities,
        popularActivities,
        recentUsers,
        recentTrips,
        systemHealth
      ] = await Promise.all([
        AdminController.getUserStats(),
        AdminController.getTripStats(),
        AdminController.getPopularCities(),
        AdminController.getPopularActivities(),
        AdminController.getRecentUsers(),
        AdminController.getRecentTrips(),
        AdminController.getSystemHealth()
      ]);

      res.json({
        message: 'Dashboard analytics retrieved successfully',
        analytics: {
          userStats,
          tripStats,
          popularCities,
          popularActivities,
          recentUsers,
          recentTrips,
          systemHealth
        }
      });
    } catch (error) {
      console.error('Get dashboard analytics error:', error);
      res.status(500).json({
        message: 'Failed to retrieve dashboard analytics',
        error: 'DASHBOARD_ANALYTICS_ERROR'
      });
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats() {
    const totalUsers = await UserModel.getTotalCount();
    const activeUsers = await UserModel.getActiveUsersCount(30); // Last 30 days
    const newUsersThisMonth = await UserModel.getNewUsersCount(30);
    const userGrowth = await UserModel.getUserGrowthData(12); // Last 12 months

    return {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      userGrowth
    };
  }

  /**
   * Get trip statistics
   */
  static async getTripStats() {
    const totalTrips = await TripModel.getTotalCount();
    const publicTrips = await TripModel.getPublicTripsCount();
    const completedTrips = await TripModel.getCompletedTripsCount();
    const averageTripDuration = await TripModel.getAverageTripDuration();
    const tripsByMonth = await TripModel.getTripsByMonth(12);

    return {
      totalTrips,
      publicTrips,
      completedTrips,
      averageTripDuration,
      tripsByMonth
    };
  }

  /**
   * Get popular cities data
   */
  static async getPopularCities() {
    return await CityModel.getPopularCitiesWithStats(10);
  }

  /**
   * Get popular activities data
   */
  static async getPopularActivities() {
    return await ActivityModel.getPopularActivitiesWithStats(10);
  }

  /**
   * Get recent users
   */
  static async getRecentUsers() {
    return await UserModel.getRecentUsers(10);
  }

  /**
   * Get recent trips
   */
  static async getRecentTrips() {
    return await TripModel.getRecentTrips(10);
  }

  /**
   * Get system health metrics
   */
  static async getSystemHealth() {
    // This would typically include server metrics, database performance, etc.
    return {
      status: 'healthy',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get all users with pagination and filters
   * GET /api/admin/users
   */
  static async getUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        role,
        status,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      const filters = {
        search,
        role,
        status,
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      };

      const result = await UserModel.getAdminUserList(filters);

      res.json({
        message: 'Users retrieved successfully',
        users: result.users,
        pagination: {
          currentPage: filters.page,
          totalPages: Math.ceil(result.total / filters.limit),
          totalUsers: result.total,
          hasNext: filters.page * filters.limit < result.total,
          hasPrev: filters.page > 1
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        message: 'Failed to retrieve users',
        error: 'GET_USERS_ERROR'
      });
    }
  }

  /**
   * Update user (admin action)
   * PUT /api/admin/users/:id
   */
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const adminId = req.user.id;

      // Prevent admin from demoting themselves
      if (id == adminId && updateData.role === 'user') {
        return res.status(400).json({
          message: 'Cannot demote yourself from admin role',
          error: 'SELF_DEMOTION_ERROR'
        });
      }

      const updatedUser = await UserModel.adminUpdateUser(id, updateData);

      if (!updatedUser) {
        return res.status(404).json({
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
      }

      res.json({
        message: 'User updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        message: 'Failed to update user',
        error: 'UPDATE_USER_ERROR'
      });
    }
  }

  /**
   * Delete user (admin action)
   * DELETE /api/admin/users/:id
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      // Prevent admin from deleting themselves
      if (id == adminId) {
        return res.status(400).json({
          message: 'Cannot delete your own account',
          error: 'SELF_DELETE_ERROR'
        });
      }

      const deleted = await UserModel.deleteUser(id);

      if (!deleted) {
        return res.status(404).json({
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
      }

      res.json({
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        message: 'Failed to delete user',
        error: 'DELETE_USER_ERROR'
      });
    }
  }

  /**
   * Get trip analytics
   * GET /api/admin/trips/analytics
   */
  static async getTripAnalytics(req, res) {
    try {
      const { period = '30d' } = req.query;
      
      const analytics = await TripModel.getAnalytics(period);

      res.json({
        message: 'Trip analytics retrieved successfully',
        analytics
      });
    } catch (error) {
      console.error('Get trip analytics error:', error);
      res.status(500).json({
        message: 'Failed to retrieve trip analytics',
        error: 'TRIP_ANALYTICS_ERROR'
      });
    }
  }

  /**
   * Get all trips for admin management
   * GET /api/admin/trips
   */
  static async getTrips(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        isPublic,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      const filters = {
        search,
        status,
        isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      };

      const result = await TripModel.getAdminTripList(filters);

      res.json({
        message: 'Trips retrieved successfully',
        trips: result.trips,
        pagination: {
          currentPage: filters.page,
          totalPages: Math.ceil(result.total / filters.limit),
          totalTrips: result.total,
          hasNext: filters.page * filters.limit < result.total,
          hasPrev: filters.page > 1
        }
      });
    } catch (error) {
      console.error('Get trips error:', error);
      res.status(500).json({
        message: 'Failed to retrieve trips',
        error: 'GET_TRIPS_ERROR'
      });
    }
  }

  /**
   * Feature/unfeature a trip
   * PUT /api/admin/trips/:id/feature
   */
  static async featureTrip(req, res) {
    try {
      const { id } = req.params;
      const { featured } = req.body;

      const updatedTrip = await TripModel.updateTrip(id, { featured: !!featured });

      res.json({
        message: `Trip ${featured ? 'featured' : 'unfeatured'} successfully`,
        trip: updatedTrip
      });
    } catch (error) {
      console.error('Feature trip error:', error);
      res.status(500).json({
        message: 'Failed to update trip feature status',
        error: 'FEATURE_TRIP_ERROR'
      });
    }
  }
}

module.exports = AdminController;
