const CityModel = require('../models/cityModel');
const ActivityModel = require('../models/activityModel');

/**
 * City Controller
 * Handles city-related HTTP requests
 */
class CityController {
  /**
   * Search cities
   * GET /api/cities/search?q=searchTerm&country=country&limit=20&offset=0
   */
  static async searchCities(req, res) {
    try {
      const { q: searchTerm, country, limit = 20, offset = 0 } = req.query;

      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          message: 'Search term must be at least 2 characters long',
          error: 'INVALID_SEARCH_TERM'
        });
      }

      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        country
      };

      const cities = await CityModel.searchCities(searchTerm.trim(), options);

      res.json({
        cities,
        pagination: {
          limit: options.limit,
          offset: options.offset,
          total: cities.length
        }
      });
    } catch (error) {
      console.error('Search cities error:', error);
      res.status(500).json({
        message: 'Failed to search cities',
        error: 'SEARCH_CITIES_ERROR'
      });
    }
  }

  /**
   * Get popular cities
   * GET /api/cities/popular?limit=10
   */
  static async getPopularCities(req, res) {
    try {
      const { limit = 10 } = req.query;

      const cities = await CityModel.getPopularCities(parseInt(limit));

      res.json({
        cities
      });
    } catch (error) {
      console.error('Get popular cities error:', error);
      res.status(500).json({
        message: 'Failed to get popular cities',
        error: 'GET_POPULAR_CITIES_ERROR'
      });
    }
  }

  /**
   * Get city by ID
   * GET /api/cities/:id
   */
  static async getCityById(req, res) {
    try {
      const { id } = req.params;

      const city = await CityModel.findById(id);

      if (!city) {
        return res.status(404).json({
          message: 'City not found',
          error: 'CITY_NOT_FOUND'
        });
      }

      // Get popular activities for this city
      const activities = await ActivityModel.getPopularActivities(id, 10);

      res.json({
        city: {
          ...city,
          activities
        }
      });
    } catch (error) {
      console.error('Get city by ID error:', error);
      res.status(500).json({
        message: 'Failed to get city',
        error: 'GET_CITY_ERROR'
      });
    }
  }

  /**
   * Add city to trip
   * POST /api/cities/:id/add-to-trip
   */
  static async addCityToTrip(req, res) {
    try {
      const { id: cityId } = req.params;
      const { tripId, arrivalDate, departureDate, orderIndex } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!tripId) {
        return res.status(400).json({
          message: 'Trip ID is required',
          error: 'MISSING_TRIP_ID'
        });
      }

      // Check if city exists
      const city = await CityModel.findById(cityId);
      if (!city) {
        return res.status(404).json({
          message: 'City not found',
          error: 'CITY_NOT_FOUND'
        });
      }

      // TODO: Verify that the user owns the trip
      // This would require importing TripModel and checking ownership

      const cityData = {
        arrival_date: arrivalDate,
        departure_date: departureDate,
        order_index: orderIndex || 0
      };

      const tripCity = await CityModel.addCityToTrip(tripId, cityId, cityData);

      res.status(201).json({
        message: 'City added to trip successfully',
        tripCity
      });
    } catch (error) {
      console.error('Add city to trip error:', error);
      
      if (error.message === 'City already added to this trip') {
        return res.status(409).json({
          message: error.message,
          error: 'CITY_ALREADY_ADDED'
        });
      }

      res.status(500).json({
        message: 'Failed to add city to trip',
        error: 'ADD_CITY_TO_TRIP_ERROR'
      });
    }
  }

  /**
   * Remove city from trip
   * DELETE /api/cities/:id/remove-from-trip/:tripId
   */
  static async removeCityFromTrip(req, res) {
    try {
      const { id: cityId, tripId } = req.params;
      const userId = req.user.id;

      // TODO: Verify that the user owns the trip

      const removed = await CityModel.removeCityFromTrip(tripId, cityId);

      if (!removed) {
        return res.status(404).json({
          message: 'City not found in trip',
          error: 'CITY_NOT_IN_TRIP'
        });
      }

      res.json({
        message: 'City removed from trip successfully'
      });
    } catch (error) {
      console.error('Remove city from trip error:', error);
      res.status(500).json({
        message: 'Failed to remove city from trip',
        error: 'REMOVE_CITY_FROM_TRIP_ERROR'
      });
    }
  }

  /**
   * Get cities for a trip
   * GET /api/trips/:tripId/cities
   */
  static async getCitiesForTrip(req, res) {
    try {
      const { tripId } = req.params;
      const userId = req.user.id;

      // TODO: Verify that the user owns the trip

      const cities = await CityModel.getCitiesForTrip(tripId);

      res.json({
        cities
      });
    } catch (error) {
      console.error('Get cities for trip error:', error);
      res.status(500).json({
        message: 'Failed to get cities for trip',
        error: 'GET_CITIES_FOR_TRIP_ERROR'
      });
    }
  }

  /**
   * Update trip city
   * PUT /api/trips/:tripId/cities/:cityId
   */
  static async updateTripCity(req, res) {
    try {
      const { tripId, cityId } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      // TODO: Verify that the user owns the trip

      // Find the trip city relationship
      const cities = await CityModel.getCitiesForTrip(tripId);
      const tripCity = cities.find(c => c.city_id == cityId);

      if (!tripCity) {
        return res.status(404).json({
          message: 'City not found in trip',
          error: 'CITY_NOT_IN_TRIP'
        });
      }

      const updatedTripCity = await CityModel.updateTripCity(tripCity.id, updateData);

      res.json({
        message: 'Trip city updated successfully',
        tripCity: updatedTripCity
      });
    } catch (error) {
      console.error('Update trip city error:', error);
      res.status(500).json({
        message: 'Failed to update trip city',
        error: 'UPDATE_TRIP_CITY_ERROR'
      });
    }
  }

  /**
   * Get countries
   * GET /api/cities/countries
   */
  static async getCountries(req, res) {
    try {
      const countries = await CityModel.getCountries();

      res.json({
        countries
      });
    } catch (error) {
      console.error('Get countries error:', error);
      res.status(500).json({
        message: 'Failed to get countries',
        error: 'GET_COUNTRIES_ERROR'
      });
    }
  }

  /**
   * Create a new city (admin only)
   * POST /api/cities
   */
  static async createCity(req, res) {
    try {
      const {
        name,
        country,
        countryCode,
        latitude,
        longitude,
        costIndex,
        popularityScore,
        description,
        imageUrl
      } = req.body;

      // Input validation
      if (!name || !country) {
        return res.status(400).json({
          message: 'Name and country are required',
          error: 'MISSING_FIELDS'
        });
      }

      const cityData = {
        name,
        country,
        country_code: countryCode,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        cost_index: costIndex ? parseFloat(costIndex) : null,
        popularity_score: popularityScore ? parseInt(popularityScore) : 0,
        description,
        image_url: imageUrl
      };

      const city = await CityModel.createCity(cityData);

      res.status(201).json({
        message: 'City created successfully',
        city
      });
    } catch (error) {
      console.error('Create city error:', error);
      
      if (error.message === 'City already exists') {
        return res.status(409).json({
          message: error.message,
          error: 'CITY_ALREADY_EXISTS'
        });
      }

      res.status(500).json({
        message: 'Failed to create city',
        error: 'CREATE_CITY_ERROR'
      });
    }
  }
}

module.exports = CityController;
