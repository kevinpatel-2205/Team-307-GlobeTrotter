import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api`,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common HTTP errors
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle authentication errors
      if (status === 401) {
        console.log('401 error on:', error.config?.url, 'Status:', status);
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirect to login if not already there
        if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          console.log('Redirecting to login from:', window.location.pathname);
          // Use window.location for immediate redirect to avoid React Router conflicts
          window.location.replace('/login');
        }
      }
      
      // Handle server errors
      if (status >= 500) {
        console.error('Server error:', data);
      }
      
      // Return the error with a consistent structure
      return Promise.reject({
        message: data?.message || 'An error occurred',
        error: data?.error || 'UNKNOWN_ERROR',
        status,
        ...error.response
      });
    }
    
    // Handle network errors
    if (error.request) {
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        error: 'NETWORK_ERROR',
        status: 0
      });
    }
    
    // Handle other errors
    return Promise.reject({
      message: error.message || 'An unexpected error occurred',
      error: 'UNKNOWN_ERROR',
      status: 0
    });
  }
);

// Auth API methods
export const authAPI = {
  // User registration
  signup: (userData) => {
    const formData = new FormData();
    formData.append('fullName', userData.fullName);
    formData.append('email', userData.email);
    formData.append('password', userData.password);

    if (userData.avatar) {
      formData.append('avatar', userData.avatar);
    }

    return api.post('/auth/signup', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 seconds for file upload
    });
  },

  // User login
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },

  // Get user profile
  getProfile: () => {
    return api.get('/auth/profile');
  },

  // Verify token
  verifyToken: () => {
    return api.get('/auth/verify');
  },

  // Forgot password
  forgotPassword: (email) => {
    return api.post('/auth/forgot-password', { email });
  },

  // Reset password
  resetPassword: (resetData) => {
    return api.post('/auth/reset-password', resetData);
  },

  // Logout
  logout: () => {
    return api.post('/auth/logout');
  },
};

// Trip API methods
export const tripAPI = {
  // Create a new trip
  createTrip: (tripData) => {
    const formData = new FormData();
    formData.append('title', tripData.title);
    formData.append('description', tripData.description || '');
    formData.append('startDate', tripData.startDate);
    formData.append('endDate', tripData.endDate);

    if (tripData.budget) {
      formData.append('budget', tripData.budget);
    }

    if (tripData.coverPhoto) {
      formData.append('coverPhoto', tripData.coverPhoto);
    }

    return api.post('/trips', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });
  },

  // Get user's trips
  getUserTrips: (params = {}) => {
    return api.get('/trips', { params });
  },

  // Get trip by ID
  getTripById: (id) => {
    return api.get(`/trips/${id}`);
  },

  // Update trip
  updateTrip: (id, tripData) => {
    const formData = new FormData();

    Object.keys(tripData).forEach(key => {
      if (key === 'coverPhoto' && tripData[key]) {
        formData.append('coverPhoto', tripData[key]);
      } else if (tripData[key] !== undefined && tripData[key] !== null) {
        formData.append(key, tripData[key]);
      }
    });

    return api.put(`/trips/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });
  },

  // Delete trip
  deleteTrip: (id) => {
    return api.delete(`/trips/${id}`);
  },

  // Share trip
  shareTrip: (id) => {
    return api.post(`/trips/${id}/share`);
  },

  // Get shared trip
  getSharedTrip: (publicUrl) => {
    return api.get(`/trips/shared/${publicUrl}`);
  },

  // Get trip statistics
  getTripStats: (id) => {
    return api.get(`/trips/${id}/stats`);
  },

  // Get trip cities
  getTripCities: (tripId) => {
    return api.get(`/trips/${tripId}/cities`);
  },

  // Update trip city
  updateTripCity: (tripId, cityId, cityData) => {
    return api.put(`/trips/${tripId}/cities/${cityId}`, cityData);
  },

  // Get trip itinerary
  getTripItinerary: (tripId, params = {}) => {
    return api.get(`/trips/${tripId}/itinerary`, { params });
  },

  // Create itinerary item
  createItineraryItem: (tripId, itemData) => {
    return api.post(`/trips/${tripId}/itinerary`, itemData);
  },

  // Get trip summary
  getTripSummary: (tripId) => {
    return api.get(`/trips/${tripId}/summary`);
  },

  // Get cost breakdown
  getCostBreakdown: (tripId) => {
    return api.get(`/trips/${tripId}/cost-breakdown`);
  },

  // Reorder itinerary items
  reorderItinerary: (tripId, itemOrders) => {
    return api.put(`/trips/${tripId}/itinerary/reorder`, { itemOrders });
  },

  // Add activity to itinerary
  addActivityToItinerary: (tripId, activityData) => {
    return api.post(`/trips/${tripId}/itinerary/add-activity`, activityData);
  },
};

// Utility functions for token management
export const tokenUtils = {
  // Get token from localStorage
  getToken: () => {
    const token = localStorage.getItem('token');
    console.log('Getting token:', token ? 'Token exists' : 'No token found');
    return token;
  },

  // Set token in localStorage
  setToken: (token) => {
    console.log('Setting token:', token ? 'Token provided' : 'No token');
    localStorage.setItem('token', token);
  },

  // Remove token from localStorage
  removeToken: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('isAuthenticated check - Token:', token ? 'exists' : 'missing', 'User:', user ? 'exists' : 'missing');
    return !!token && !!user;
  },

  // Get user data from localStorage
  getUser: () => {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  // Set user data in localStorage
  setUser: (user) => {
    console.log('Setting user:', user);
    localStorage.setItem('user', JSON.stringify(user));
  },
};

// City API methods
export const cityAPI = {
  // Search cities
  searchCities: (searchTerm, params = {}) => {
    return api.get('/cities/search', {
      params: { q: searchTerm, ...params }
    });
  },

  // Get popular cities
  getPopularCities: (limit = 10) => {
    return api.get('/cities/popular', { params: { limit } });
  },

  // Get city by ID
  getCityById: (id) => {
    return api.get(`/cities/${id}`);
  },

  // Add city to trip
  addCityToTrip: (cityId, tripData) => {
    return api.post(`/cities/${cityId}/add-to-trip`, tripData);
  },

  // Remove city from trip
  removeCityFromTrip: (cityId, tripId) => {
    return api.delete(`/cities/${cityId}/remove-from-trip/${tripId}`);
  },

  // Get countries
  getCountries: () => {
    return api.get('/cities/countries');
  },

  // Create city (admin)
  createCity: (cityData) => {
    return api.post('/cities', cityData);
  },
};

// Activity API methods
export const activityAPI = {
  // Search activities globally
  searchActivities: (query, filters = {}) => {
    return api.get('/activities/search', { params: { q: query, ...filters } });
  },

  // Search activities for a city
  searchActivitiesForCity: (cityId, filters = {}) => {
    return api.get(`/cities/${cityId}/activities`, { params: filters });
  },

  // Get popular activities globally
  getPopularActivities: (limit = 10) => {
    return api.get('/activities/popular', { params: { limit } });
  },

  // Get popular activities for a city
  getPopularActivitiesForCity: (cityId, limit = 10) => {
    return api.get(`/cities/${cityId}/activities/popular`, { params: { limit } });
  },

  // Get activities by category
  getActivitiesByCategory: (cityId, category, limit = 20) => {
    return api.get(`/cities/${cityId}/activities/category/${category}`, { params: { limit } });
  },

  // Get activity by ID
  getActivityById: (id) => {
    return api.get(`/activities/${id}`);
  },

  // Add activity to trip
  addActivityToTrip: (activityId, tripData) => {
    return api.post(`/activities/${activityId}/add-to-trip`, tripData);
  },

  // Get activity categories
  getCategories: () => {
    return api.get('/activities/categories');
  },

  // Get activities for multiple cities
  getActivitiesForCities: (cityIds, filters = {}) => {
    return api.post('/activities/for-cities', { cityIds, ...filters });
  },

  // Create activity (admin)
  createActivity: (activityData) => {
    return api.post('/activities', activityData);
  },

  // Update activity (admin)
  updateActivity: (id, activityData) => {
    return api.put(`/activities/${id}`, activityData);
  },

  // Delete activity (admin)
  deleteActivity: (id) => {
    return api.delete(`/activities/${id}`);
  },
};

// Itinerary API methods
export const itineraryAPI = {
  // Get itinerary items for a trip
  getItineraryItems: (tripId) => {
    return api.get(`/trips/${tripId}/itinerary`);
  },

  // Add itinerary item
  addItem: (tripId, itemData) => {
    return api.post(`/trips/${tripId}/itinerary`, itemData);
  },

  // Get itinerary item by ID
  getItineraryItem: (id) => {
    return api.get(`/itinerary/${id}`);
  },

  // Update itinerary item
  updateItem: (id, itemData) => {
    return api.put(`/itinerary/${id}`, itemData);
  },

  // Delete itinerary item
  deleteItem: (id) => {
    return api.delete(`/itinerary/${id}`);
  },

  // Reorder itinerary items
  reorderItems: (tripId, items) => {
    return api.put(`/trips/${tripId}/itinerary/reorder`, { items });
  },

  // Get trip summary
  getTripSummary: (tripId) => {
    return api.get(`/trips/${tripId}/summary`);
  },

  // Get cost breakdown
  getCostBreakdown: (tripId) => {
    return api.get(`/trips/${tripId}/cost-breakdown`);
  },
};

// Admin API methods
export const adminAPI = {
  // Dashboard analytics
  getDashboardAnalytics: () => {
    return api.get('/admin/dashboard');
  },

  // User management
  getUsers: (params = {}) => {
    return api.get('/admin/users', { params });
  },

  updateUser: (id, userData) => {
    return api.put(`/admin/users/${id}`, userData);
  },

  deleteUser: (id) => {
    return api.delete(`/admin/users/${id}`);
  },

  // Trip management
  getTrips: (params = {}) => {
    return api.get('/admin/trips', { params });
  },

  getTripAnalytics: (period = '30d') => {
    return api.get('/admin/trips/analytics', { params: { period } });
  },

  featureTrip: (id, featured) => {
    return api.put(`/admin/trips/${id}/feature`, { featured });
  },

  // Content management
  getCities: () => {
    return api.get('/admin/cities');
  },

  createCity: (cityData) => {
    return api.post('/admin/cities', cityData);
  },

  updateCity: (id, cityData) => {
    return api.put(`/admin/cities/${id}`, cityData);
  },

  deleteCity: (id) => {
    return api.delete(`/admin/cities/${id}`);
  },

  getActivities: () => {
    return api.get('/admin/activities');
  },

  createActivity: (activityData) => {
    return api.post('/admin/activities', activityData);
  },

  updateActivity: (id, activityData) => {
    return api.put(`/admin/activities/${id}`, activityData);
  },

  deleteActivity: (id) => {
    return api.delete(`/admin/activities/${id}`);
  },

  // System monitoring
  getSystemHealth: () => {
    return api.get('/admin/system/health');
  },

  getSystemLogs: () => {
    return api.get('/admin/system/logs');
  },

  // Analytics
  getUserAnalytics: (period = '30d') => {
    return api.get('/admin/analytics/users', { params: { period } });
  },

  getRevenueAnalytics: (period = '30d') => {
    return api.get('/admin/analytics/revenue', { params: { period } });
  },
};

export default api;
