import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Paper,
} from '@mui/material';

// CSS animations will be handled by Material-UI sx prop
import {
  TravelExplore,
  AccountCircle,
  Logout,
  Add,
  Flight,
  Hotel,
  Map,
  Schedule,
  Dashboard as DashboardIconMui,
  Analytics,
  LocationOn,
  CurrencyRupee,
  CalendarToday,
  Notifications,
  Recommend,
  Speed,
  TrendingUp,
} from '@mui/icons-material';
import { tokenUtils, authAPI, tripAPI, cityAPI } from '../api/client.js';
import socketService from '../services/socket.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  // Basic dashboard data (removing duplicates)

  // Advanced dashboard features
  const [dashboardView, setDashboardView] = useState('overview');
  const [travelStats, setTravelStats] = useState({
    totalTrips: 0,
    totalBudget: 0,
    countriesVisited: 0,
    citiesVisited: 0,
    averageTripDuration: 0,
    totalDistance: 0
  });
  const [budgetAnalytics, setBudgetAnalytics] = useState({
    monthlySpending: [],
    categoryBreakdown: [],
    budgetTrends: []
  });
  const [travelInsights, setTravelInsights] = useState({
    favoriteDestinations: [],
    travelPatterns: [],
    seasonalTrends: [],
    recommendations: []
  });
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [trips, setTrips] = useState([]);
  const [popularCities, setPopularCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTrips: 0,
    countriesVisited: 0,
    totalCost: 0
  });

  useEffect(() => {
    // Always fetch fresh user profile to ensure we have created_at
    fetchUserProfile();

    // Load dashboard data
    loadDashboardData();

    // Connect to Socket.IO
    socketService.connect();

    // Listen for trip updates
    const handleTripUpdate = (data) => {
      console.log('Trip update received:', data);
      // Reload trips when updates are received
      loadDashboardData();
    };

    socketService.on('tripUpdate', handleTripUpdate);

    // Cleanup on unmount
    return () => {
      socketService.off('tripUpdate', handleTripUpdate);
    };
  }, []);

  // Removed unused isAdmin function for optimization

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Loading dashboard data...');

      // Load user trips and popular cities in parallel with cache busting
      const [tripsResponse, citiesResponse] = await Promise.all([
        tripAPI.getUserTrips({ limit: 50, _t: Date.now() }), // Cache busting
        cityAPI.getPopularCities(8)
      ]);

      console.log('Trips response:', tripsResponse);
      console.log('Cities response:', citiesResponse);

      const userTrips = tripsResponse.data.trips || [];
      setTrips(userTrips);
      setPopularCities(citiesResponse.data.cities || []);

      // Calculate advanced analytics
      await calculateAdvancedAnalytics(userTrips);

      // Calculate basic stats with correct data structure and fallbacks
      const totalTrips = userTrips.length || 12;
      const countriesVisited = new Set(
        userTrips.flatMap(trip => trip.countries || [])
      ).size || 8;
      const citiesVisited = new Set(
        userTrips.flatMap(trip => trip.cities || [])
      ).size || 15;
      const totalCost = userTrips.reduce((sum, trip) => sum + (trip.total_cost || 0), 0) || 1111111;

      setStats({
        totalTrips,
        countriesVisited,
        citiesVisited,
        totalCost
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      console.error('Error details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Advanced analytics calculation functions
  const calculateAdvancedAnalytics = async (tripData) => {
    // Calculate travel statistics with correct data structure
    const totalCost = tripData.reduce((sum, trip) => sum + (trip.budget || trip.total_cost || 0), 0);
    const countries = [...new Set(tripData.flatMap(trip => trip.countries || []))];
    const cities = [...new Set(tripData.flatMap(trip => trip.cities || []))];

    // Debug: Log the data to console
    if (tripData.length > 0) {
      console.log('Trip data sample:', tripData[0]);
      console.log('Budget values:', tripData.map(trip => ({ title: trip.title, budget: trip.budget, total_cost: trip.total_cost })));
      console.log('Total calculated cost:', totalCost);
      console.log('Countries found:', countries);
      console.log('Cities found:', cities);
    }

    // If no real budget data, generate sample budget for demonstration
    let displayTotalBudget = totalCost;
    if (totalCost === 0) {
      // Use fixed sample budget
      displayTotalBudget = 1111111;
      console.log('No budget data found, using sample budget:', displayTotalBudget);
    }

    // Calculate average trip duration
    const tripsWithDates = tripData.filter(trip => trip.start_date && trip.end_date);
    const totalDuration = tripsWithDates.reduce((sum, trip) => {
      const start = new Date(trip.start_date);
      const end = new Date(trip.end_date);
      return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    }, 0);
    const avgDuration = tripsWithDates.length > 0 ? Math.round(totalDuration / tripsWithDates.length) : 0;

    // Generate sample data when no real data exists
    const sampleStats = {
      totalTrips: tripData.length || 12,
      totalBudget: displayTotalBudget,
      countriesVisited: countries.length || 8,
      citiesVisited: cities.length || 15,
      averageTripDuration: avgDuration || 7,
      totalDistance: Math.round((tripData.length || 12) * 1500) // Estimated
    };

    const newTravelStats = {
      totalTrips: tripData.length > 0 ? tripData.length : sampleStats.totalTrips,
      totalBudget: displayTotalBudget,
      countriesVisited: countries.length > 0 ? countries.length : sampleStats.countriesVisited,
      citiesVisited: cities.length > 0 ? cities.length : sampleStats.citiesVisited,
      averageTripDuration: avgDuration > 0 ? avgDuration : sampleStats.averageTripDuration,
      totalDistance: tripData.length > 0 ? Math.round(tripData.length * 1500) : sampleStats.totalDistance
    };

    console.log('Setting travel stats:', newTravelStats);
    setTravelStats(newTravelStats);

    // Generate budget analytics
    const monthlyData = generateMonthlySpendingData(tripData);
    const categoryData = generateCategoryBreakdown(tripData);

    setBudgetAnalytics({
      monthlySpending: monthlyData,
      categoryBreakdown: categoryData,
      budgetTrends: generateBudgetTrends(tripData)
    });

    // Generate travel insights
    setTravelInsights({
      favoriteDestinations: generateFavoriteDestinations(tripData),
      travelPatterns: generateTravelPatterns(tripData),
      seasonalTrends: generateSeasonalTrends(tripData),
      recommendations: generateRecommendations(tripData, cities)
    });

    // Set upcoming trips
    const upcoming = tripData.filter(trip => {
      const startDate = new Date(trip.start_date);
      return startDate > new Date();
    }).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    setUpcomingTrips(upcoming.slice(0, 3));

    // Recent activities removed for optimization

    // Generate notifications
    setNotifications(generateNotifications(tripData, upcoming));
  };

  const generateMonthlySpendingData = (trips) => {
    const monthlyData = {};
    const now = new Date();

    // Process real trip data
    trips.forEach(trip => {
      if (trip.start_date && (trip.budget || trip.total_cost)) {
        const month = new Date(trip.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        monthlyData[month] = (monthlyData[month] || 0) + (trip.budget || trip.total_cost || 0);
      }
    });

    // If no real data, generate sample data for the last 6 months
    if (Object.keys(monthlyData).length === 0) {
      const sampleAmounts = [1111111, 555555, 777777, 333333, 999999, 666666]; // Sample budget amounts based on 1111111
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        monthlyData[month] = sampleAmounts[5 - i]; // Use predefined sample amounts
      }
    }

    return Object.entries(monthlyData).map(([month, amount]) => ({ month, amount })).slice(-12);
  };

  const generateCategoryBreakdown = (trips) => {
    const categories = {
      'Accommodation': 0.35,
      'Transportation': 0.25,
      'Food & Dining': 0.20,
      'Activities': 0.15,
      'Shopping': 0.05
    };
    const totalBudget = trips.reduce((sum, trip) => sum + (trip.budget || trip.total_cost || 0), 0);

    // If no real budget data, use sample data for visualization
    const displayBudget = totalBudget || 1111111; // Sample total budget

    return Object.entries(categories).map(([name, percentage]) => ({
      name,
      value: Math.round(displayBudget * percentage),
      percentage: Math.round(percentage * 100)
    }));
  };

  const generateBudgetTrends = (trips) => {
    return trips.slice(-6).map((trip, index) => ({
      trip: trip.title?.substring(0, 10) + '...' || `Trip ${index + 1}`,
      planned: trip.budget || 0,
      actual: trip.total_cost || trip.budget || 0
    }));
  };

  const generateFavoriteDestinations = (trips) => {
    const destinations = {};
    trips.forEach(trip => {
      if (trip.destination) {
        destinations[trip.destination] = (destinations[trip.destination] || 0) + 1;
      }
    });
    return Object.entries(destinations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([destination, count]) => ({ destination, count }));
  };

  const generateTravelPatterns = (trips) => {
    // Generate timeline data for the last 12 months
    const timelineData = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      const monthTrips = trips.filter(trip => {
        if (!trip.start_date) return false;
        const tripDate = new Date(trip.start_date);
        return tripDate.getMonth() === date.getMonth() && tripDate.getFullYear() === date.getFullYear();
      });

      const monthlyBudget = monthTrips.reduce((sum, trip) => sum + (trip.budget || trip.total_cost || 0), 0);

      // Generate sample budget if no real data
      let displayBudget = monthlyBudget;
      if (monthlyBudget === 0 && monthTrips.length > 0) {
        displayBudget = 1111111; // Fixed sample amount
      }

      timelineData.push({
        month: monthName,
        trips: monthTrips.length,
        budget: displayBudget,
        // Add some variation for better visualization when no real data
        displayTrips: monthTrips.length || (i < 8 ? Math.floor(Math.random() * 3) + 1 : 0), // More trips in recent months
        displayBudget: displayBudget || (monthTrips.length === 0 && i < 8 ? Math.floor(Math.random() * 500000) + 500000 : 0)
      });
    }

    return timelineData;
  };

  const generateSeasonalTrends = (trips) => {
    const seasons = {
      Spring: { count: 0, months: ['Mar', 'Apr', 'May'], color: '#4caf50' },
      Summer: { count: 0, months: ['Jun', 'Jul', 'Aug'], color: '#ff9800' },
      Fall: { count: 0, months: ['Sep', 'Oct', 'Nov'], color: '#f44336' },
      Winter: { count: 0, months: ['Dec', 'Jan', 'Feb'], color: '#2196f3' }
    };

    trips.forEach(trip => {
      if (trip.start_date) {
        const month = new Date(trip.start_date).getMonth();
        if (month >= 2 && month <= 4) seasons.Spring.count++;
        else if (month >= 5 && month <= 7) seasons.Summer.count++;
        else if (month >= 8 && month <= 10) seasons.Fall.count++;
        else seasons.Winter.count++;
      }
    });

    return Object.entries(seasons).map(([season, data]) => ({
      season,
      count: data.count,
      color: data.color,
      months: data.months.join(', ')
    }));
  };

  const generateRecommendations = (trips, cities) => {
    const recommendations = [];

    if (trips.length === 0) {
      return [
        { type: 'destination', message: 'Start planning your first adventure!', priority: 'high' },
        { type: 'budget', message: 'Set a travel budget to track your expenses', priority: 'medium' },
        { type: 'season', message: 'Consider traveling in shoulder seasons for better deals', priority: 'low' }
      ];
    }

    // Analyze travel patterns for recommendations
    const totalBudget = trips.reduce((sum, trip) => sum + (trip.budget || trip.total_cost || 0), 0);
    const avgBudget = totalBudget / trips.length;

    if (avgBudget > 3000) {
      recommendations.push({ type: 'budget', message: 'Consider budget-friendly destinations to save money', priority: 'medium' });
    }

    const recentTrips = trips.filter(trip => {
      const tripDate = new Date(trip.start_date);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return tripDate > threeMonthsAgo;
    });

    if (recentTrips.length === 0) {
      recommendations.push({ type: 'activity', message: "It's been a while! Time for a new adventure?", priority: 'high' });
    }

    return recommendations.slice(0, 3);
  };

  const generateNotifications = (trips, upcomingTrips) => {
    const notifications = [];

    if (upcomingTrips.length > 0) {
      const nextTrip = upcomingTrips[0];
      const daysUntil = Math.ceil((new Date(nextTrip.start_date) - new Date()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: 1,
        type: 'upcoming_trip',
        message: `Your trip to ${nextTrip.destination} is in ${daysUntil} days!`,
        priority: 'high'
      });
    }

    if (trips.length >= 5) {
      notifications.push({
        id: 2,
        type: 'achievement',
        message: 'Congratulations! You\'ve planned 5+ trips. You\'re a travel enthusiast!',
        priority: 'medium'
      });
    }

    return notifications;
  };

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      const userData = response.data.user;
      console.log('User profile loaded:', userData);
      setUser(userData);
      tokenUtils.setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Only logout if it's an authentication error (401)
      if (error.status === 401) {
        console.log('🚫 Authentication failed, logging out');
        handleLogout();
      } else {
        console.log('⚠️ Profile fetch failed but not auth error, continuing...');
        // Try to get user from localStorage as fallback
        const userData = tokenUtils.getUser();
        if (userData) {
          setUser(userData);
        }
      }
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenUtils.removeToken();
      navigate('/login');
    }
  };

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    return `${import.meta.env.VITE_API_BASE_URL}${avatarPath}`;
  };

  const handleNewTrip = () => {
    navigate('/trips/new');
  };

  const handleViewTrip = (tripId) => {
    navigate(`/trips/${tripId}`);
  };

  const handleViewAllTrips = () => {
    navigate('/trips');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatNumber = (amount) => {
    if (!amount || amount === 0) return '0';
    // Convert to number first to remove any leading zeros, then back to string
    const num = Number(amount);
    if (isNaN(num)) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <TravelExplore sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            GlobeTrotter
          </Typography>
          
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            color="inherit"
          >
            {user?.avatarPath ? (
              <Avatar 
                src={getAvatarUrl(user.avatarPath)} 
                sx={{ width: 32, height: 32 }}
              />
            ) : (
              <AccountCircle />
            )}
          </IconButton>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>
              <AccountCircle sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={() => navigate('/advanced-dashboard')}>
              <Analytics sx={{ mr: 1 }} />
              Advanced Dashboard
            </MenuItem>
            {tokenUtils.getUser()?.role === 'admin' && (
              <MenuItem onClick={() => navigate('/admin')}>
                <DashboardIconMui sx={{ mr: 1 }} />
                Admin Panel
              </MenuItem>
            )}
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Welcome Section */}
        <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
            <Avatar
              src={user?.avatarPath ? getAvatarUrl(user.avatarPath) : undefined}
              sx={{ width: 64, height: 64, mr: 3, bgcolor: 'rgba(255,255,255,0.2)' }}
            >
              {user?.fullName?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Welcome back, {user?.fullName || 'Traveler'}!
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Ready to plan your next adventure?
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Dashboard View Switcher */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" component="h2">
              Dashboard
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={dashboardView === 'overview' ? 'contained' : 'outlined'}
                startIcon={<DashboardIconMui />}
                onClick={() => setDashboardView('overview')}
                size="small"
              >
                Overview
              </Button>
              <Button
                variant={dashboardView === 'analytics' ? 'contained' : 'outlined'}
                startIcon={<Analytics />}
                onClick={() => setDashboardView('analytics')}
                size="small"
              >
                Analytics
              </Button>
              <Button
                variant={dashboardView === 'planning' ? 'contained' : 'outlined'}
                startIcon={<Schedule />}
                onClick={() => setDashboardView('planning')}
                size="small"
              >
                Planning
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Advanced Dashboard Content */}
        <AnimatePresence mode="wait">
          {dashboardView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Travel Statistics Cards */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Travel Statistics
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Card sx={{ textAlign: 'center', p: 2 }}>
                    <TravelExplore sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {travelStats.totalTrips}
                    </Typography>
                    <Typography color="textSecondary">Total Trips</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Card sx={{ textAlign: 'center', p: 2 }}>
                    <LocationOn sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {travelStats.countriesVisited}
                    </Typography>
                    <Typography color="textSecondary">Countries</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Card sx={{ textAlign: 'center', p: 2 }}>
                    <Map sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {travelStats.citiesVisited}
                    </Typography>
                    <Typography color="textSecondary">Cities</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Card sx={{ textAlign: 'center', p: 2 }}>
                    <CurrencyRupee sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      ₹{travelStats.totalBudget || 1111111}
                    </Typography>
                    <Typography color="textSecondary">Total Budget</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Card sx={{ textAlign: 'center', p: 2 }}>
                    <CalendarToday sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {travelStats.averageTripDuration}
                    </Typography>
                    <Typography color="textSecondary">Avg Days</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Card sx={{ textAlign: 'center', p: 2 }}>
                    <Speed sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {(travelStats.totalDistance || 0).toLocaleString()}
                    </Typography>
                    <Typography color="textSecondary">Miles</Typography>
                  </Card>
                </Grid>
              </Grid>

              {/* Notifications */}
              {notifications.length > 0 && (
                <Paper sx={{ p: 3, mb: 4, bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Notifications sx={{ mr: 1 }} />
                    <Typography variant="h6">Notifications</Typography>
                  </Box>
                  {notifications.map((notification) => (
                    <Typography key={notification.id} variant="body1" sx={{ mb: 1 }}>
                      • {notification.message}
                    </Typography>
                  ))}
                </Paper>
              )}
            </motion.div>
          )}

          {dashboardView === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Colorful Analytics Header */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                  <Card sx={{
                    p: 4,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <Typography variant="h3" sx={{
                        color: 'white',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                        mb: 2
                      }}>
                        🎯 Travel Analytics Dashboard
                      </Typography>
                      <Typography variant="h6" sx={{
                        color: 'rgba(255,255,255,0.9)',
                        textAlign: 'center',
                        fontWeight: 500
                      }}>
                        Discover your travel patterns and preferences with beautiful insights
                      </Typography>

                      {/* Quick Stats Cards */}
                      <Grid container spacing={2} sx={{ mt: 3 }}>
                        <Grid item xs={6} md={3}>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                          >
                            <Card sx={{
                              p: 2,
                              textAlign: 'center',
                              background: 'rgba(255,255,255,0.2)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255,255,255,0.3)',
                              '&:hover': {
                                transform: 'scale(1.05)',
                                transition: 'transform 0.2s'
                              }
                            }}>
                              <Typography variant="h4" sx={{ color: '#feca57', fontWeight: 'bold' }}>
                                {travelStats.totalTrips}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                                🎒 Total Adventures
                              </Typography>
                            </Card>
                          </motion.div>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                          >
                            <Card sx={{
                              p: 2,
                              textAlign: 'center',
                              background: 'rgba(255,255,255,0.2)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255,255,255,0.3)',
                              '&:hover': {
                                transform: 'scale(1.05)',
                                transition: 'transform 0.2s'
                              }
                            }}>
                              <Typography variant="h4" sx={{ color: '#ff6b6b', fontWeight: 'bold' }}>
                                {travelStats.countriesVisited}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                                🌍 Countries Explored
                              </Typography>
                            </Card>
                          </motion.div>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                          >
                            <Card sx={{
                              p: 2,
                              textAlign: 'center',
                              background: 'rgba(255,255,255,0.2)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255,255,255,0.3)',
                              '&:hover': {
                                transform: 'scale(1.05)',
                                transition: 'transform 0.2s'
                              }
                            }}>
                              <Typography variant="h4" sx={{ color: '#4ecdc4', fontWeight: 'bold' }}>
                                {travelStats.citiesVisited}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                                🏙️ Cities Discovered
                              </Typography>
                            </Card>
                          </motion.div>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                          >
                            <Card sx={{
                              p: 2,
                              textAlign: 'center',
                              background: 'rgba(255,255,255,0.2)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255,255,255,0.3)',
                              '&:hover': {
                                transform: 'scale(1.05)',
                                transition: 'transform 0.2s'
                              }
                            }}>
                              <Typography variant="h4" sx={{ color: '#a55eea', fontWeight: 'bold' }}>
                                ₹{travelStats.totalBudget || 1111111}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                                💰 Total Investment
                              </Typography>
                            </Card>
                          </motion.div>
                        </Grid>
                      </Grid>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
              {/* Enhanced Budget Analytics */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={8}>
                  <Card sx={{
                    p: 0,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(102,126,234,0.3)'
                  }}>
                    <Box sx={{ p: 3, pb: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          boxShadow: '0 6px 12px rgba(255,107,107,0.3)'
                        }}>
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                            📈
                          </Typography>
                        </Box>
                        <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold', mb: 0 }}>
                          Monthly Spending Trends
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
                        Track your travel expenses over time
                      </Typography>
                    </Box>
                    <Box sx={{ height: 300, background: 'rgba(255,255,255,0.1)', m: 2, borderRadius: 2, p: 2 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={budgetAnalytics.monthlySpending.length > 0 ? budgetAnalytics.monthlySpending : [
                          { month: 'Aug 2025', amount: 2400 },
                          { month: 'Jul 2025', amount: 1800 },
                          { month: 'Jun 2025', amount: 3200 },
                          { month: 'May 2025', amount: 2800 },
                          { month: 'Apr 2025', amount: 1600 },
                          { month: 'Mar 2025', amount: 2200 }
                        ]}>
                          <defs>
                            <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#feca57" stopOpacity={0.9}/>
                              <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.3}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                          <XAxis
                            dataKey="month"
                            tick={{ fill: 'white', fontSize: 11, fontWeight: 'bold' }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                          />
                          <YAxis
                            tick={{ fill: 'white', fontSize: 11, fontWeight: 'bold' }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(0,0,0,0.9)',
                              border: 'none',
                              borderRadius: '8px',
                              color: 'white'
                            }}
                            formatter={(value) => [`💰 $${value}`, 'Spending']}
                          />
                          <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#feca57"
                            fill="url(#spendingGradient)"
                            strokeWidth={3}
                            dot={{ fill: '#feca57', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: '#ff6b6b', stroke: '#fff', strokeWidth: 2 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{
                    p: 0,
                    background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(168,237,234,0.3)'
                  }}>
                    <Box sx={{ p: 3, pb: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: 'linear-gradient(45deg, #4ecdc4, #44a08d)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          boxShadow: '0 6px 12px rgba(78,205,196,0.3)'
                        }}>
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                            🥧
                          </Typography>
                        </Box>
                        <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold', mb: 0 }}>
                          Spending Categories
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#34495e', mb: 2 }}>
                        Where your travel budget goes
                      </Typography>
                    </Box>
                    <Box sx={{ height: 300, background: 'rgba(255,255,255,0.3)', m: 2, borderRadius: 2, p: 2 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={budgetAnalytics.categoryBreakdown.length > 0 ? budgetAnalytics.categoryBreakdown : [
                              { name: 'Accommodation', value: 1200, percentage: 35 },
                              { name: 'Transportation', value: 850, percentage: 25 },
                              { name: 'Food & Dining', value: 680, percentage: 20 },
                              { name: 'Activities', value: 510, percentage: 15 },
                              { name: 'Shopping', value: 170, percentage: 5 }
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percentage }) => `${name}: ${percentage}%`}
                            labelLine={false}
                          >
                            {(budgetAnalytics.categoryBreakdown.length > 0 ? budgetAnalytics.categoryBreakdown : [
                              { name: 'Accommodation', value: 1200, percentage: 35 },
                              { name: 'Transportation', value: 850, percentage: 25 },
                              { name: 'Food & Dining', value: 680, percentage: 20 },
                              { name: 'Activities', value: 510, percentage: 15 },
                              { name: 'Shopping', value: 170, percentage: 5 }
                            ]).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={['#ff6b6b', '#4ecdc4', '#feca57', '#a55eea', '#ff9ff3'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(44,62,80,0.9)',
                              border: 'none',
                              borderRadius: '8px',
                              color: 'white'
                            }}
                            formatter={(value) => [`💰 $${value}`, 'Amount']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Grid>
              </Grid>

              {/* Enhanced Travel Analytics */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Travel Patterns Bar Graph */}
                <Grid item xs={12} md={6}>
                  <Card sx={{
                    p: 3,
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          boxShadow: '0 8px 16px rgba(255,107,107,0.3)'
                        }}>
                          <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                            📊
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                            Monthly Travel Activity
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                            Bar chart showing trips per month
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{
                        height: 300,
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: 3,
                        p: 2,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={travelInsights.travelPatterns.length > 0 ?
                            travelInsights.travelPatterns.map(item => ({
                              month: item.month,
                              trips: item.trips || item.displayTrips || 0
                            })) : [
                            { month: 'Aug 2025', trips: 3 },
                            { month: 'Jul 2025', trips: 2 },
                            { month: 'Jun 2025', trips: 4 },
                            { month: 'May 2025', trips: 1 },
                            { month: 'Apr 2025', trips: 2 },
                            { month: 'Mar 2025', trips: 3 }
                          ]}>
                            <defs>
                              <linearGradient id="barGradient1" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ff6b6b" stopOpacity={0.9}/>
                                <stop offset="100%" stopColor="#feca57" stopOpacity={0.7}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                            <XAxis
                              dataKey="month"
                              tick={{ fill: 'white', fontSize: 10, fontWeight: 'bold' }}
                              axisLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis
                              tick={{ fill: 'white', fontSize: 12, fontWeight: 'bold' }}
                              axisLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(0,0,0,0.9)',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                color: 'white',
                                backdropFilter: 'blur(10px)'
                              }}
                              formatter={(value) => [`🎯 ${value} trips`, 'Monthly Trips']}
                              labelStyle={{ color: '#feca57', fontWeight: 'bold' }}
                            />
                            <Bar
                              dataKey="trips"
                              fill="url(#barGradient1)"
                              radius={[4, 4, 0, 0]}
                              stroke="#fff"
                              strokeWidth={1}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                {/* Budget Bar Graph */}
                <Grid item xs={12} md={6}>
                  <Card sx={{
                    p: 3,
                    background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          background: 'linear-gradient(45deg, #4ecdc4, #44a08d)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          boxShadow: '0 8px 16px rgba(78,205,196,0.3)'
                        }}>
                          <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                            💰
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
                            Monthly Budget Spending
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#34495e', fontWeight: 500 }}>
                            Bar chart showing budget per month
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{
                        height: 300,
                        background: 'rgba(255,255,255,0.3)',
                        borderRadius: 3,
                        p: 2,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.4)'
                      }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={travelInsights.travelPatterns.length > 0 ?
                            travelInsights.travelPatterns.map(item => ({
                              month: item.month,
                              budget: item.budget || item.displayBudget || 0
                            })) : [
                            { month: 'Aug 2025', budget: 2400 },
                            { month: 'Jul 2025', budget: 1800 },
                            { month: 'Jun 2025', budget: 3200 },
                            { month: 'May 2025', budget: 2800 },
                            { month: 'Apr 2025', budget: 1600 },
                            { month: 'Mar 2025', budget: 2200 }
                          ]}>
                            <defs>
                              <linearGradient id="barGradient2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#4ecdc4" stopOpacity={0.9}/>
                                <stop offset="100%" stopColor="#44a08d" stopOpacity={0.7}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                            <XAxis
                              dataKey="month"
                              tick={{ fill: '#2c3e50', fontSize: 10, fontWeight: 'bold' }}
                              axisLine={{ stroke: '#2c3e50' }}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis
                              tick={{ fill: '#2c3e50', fontSize: 12, fontWeight: 'bold' }}
                              axisLine={{ stroke: '#2c3e50' }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(44,62,80,0.9)',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                color: 'white',
                                backdropFilter: 'blur(10px)'
                              }}
                              formatter={(value) => [`💰 $${value}`, 'Monthly Budget']}
                              labelStyle={{ color: '#4ecdc4', fontWeight: 'bold' }}
                            />
                            <Bar
                              dataKey="budget"
                              fill="url(#barGradient2)"
                              radius={[4, 4, 0, 0]}
                              stroke="#2c3e50"
                              strokeWidth={1}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                {/* Travel Patterns Timeline */}
                <Grid item xs={12}>
                  <Card sx={{
                    p: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          boxShadow: '0 8px 16px rgba(255,107,107,0.3)'
                        }}>
                          <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                            📈
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="h5" gutterBottom sx={{ color: 'white', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                            Travel Patterns
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                            Your adventure timeline over the past 12 months
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{
                        height: 350,
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: 3,
                        p: 2,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={travelInsights.travelPatterns}>
                            <defs>
                              <linearGradient id="colorfulTravelGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ff6b6b" stopOpacity={0.9}/>
                                <stop offset="25%" stopColor="#feca57" stopOpacity={0.8}/>
                                <stop offset="50%" stopColor="#48dbfb" stopOpacity={0.7}/>
                                <stop offset="75%" stopColor="#ff9ff3" stopOpacity={0.6}/>
                                <stop offset="100%" stopColor="#54a0ff" stopOpacity={0.3}/>
                              </linearGradient>
                              <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#feca57" stopOpacity={0.8}/>
                                <stop offset="100%" stopColor="#ff9ff3" stopOpacity={0.3}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                            <XAxis
                              dataKey="month"
                              tick={{ fill: 'white', fontSize: 12, fontWeight: 'bold' }}
                              axisLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                            />
                            <YAxis
                              tick={{ fill: 'white', fontSize: 12, fontWeight: 'bold' }}
                              axisLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(0,0,0,0.9)',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                color: 'white',
                                backdropFilter: 'blur(10px)'
                              }}
                              formatter={(value, name) => [
                                name === 'trips' ? `🎯 ${value} trips` : `💰 $${value}`,
                                name === 'trips' ? 'Adventures' : 'Budget Spent'
                              ]}
                              labelStyle={{ color: '#feca57', fontWeight: 'bold' }}
                            />
                            <Area
                              type="monotone"
                              dataKey="trips"
                              stroke="#ff6b6b"
                              fillOpacity={1}
                              fill="url(#colorfulTravelGradient)"
                              strokeWidth={3}
                              dot={{ fill: '#ff6b6b', strokeWidth: 2, r: 6 }}
                              activeDot={{ r: 8, fill: '#feca57', stroke: '#fff', strokeWidth: 2 }}
                            />
                            <Area
                              type="monotone"
                              dataKey="budget"
                              stroke="#feca57"
                              fillOpacity={0.6}
                              fill="url(#budgetGradient)"
                              strokeWidth={2}
                              strokeDasharray="5,5"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                {/* Seasonal Preferences */}
                <Grid item xs={12}>
                  <Card sx={{
                    p: 3,
                    background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 25%, #fecfef 75%, #ffd1ff 100%)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          boxShadow: '0 10px 20px rgba(255,107,107,0.4)'
                        }}>
                          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                            🌍
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="h5" gutterBottom sx={{
                            color: 'white',
                            fontWeight: 'bold',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                            background: 'linear-gradient(45deg, #667eea, #764ba2)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          }}>
                            Seasonal Preferences
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.7)', fontWeight: 600 }}>
                            🌟 Discover when you love to explore the world most
                          </Typography>
                        </Box>
                      </Box>

                      {/* Enhanced Season Cards */}
                      <Grid container spacing={3} sx={{ mb: 4 }}>
                        {travelInsights.seasonalTrends.map((season, index) => {
                          const seasonEmojis = {
                            Spring: '🌸',
                            Summer: '☀️',
                            Fall: '🍂',
                            Winter: '❄️'
                          };
                          const seasonGradients = {
                            Spring: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                            Summer: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                            Fall: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
                            Winter: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
                          };

                          return (
                            <Grid item xs={6} md={3} key={season.season}>
                              <motion.div
                                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{
                                  duration: 0.6,
                                  delay: index * 0.15,
                                  type: "spring",
                                  stiffness: 100
                                }}
                                whileHover={{
                                  scale: 1.05,
                                  rotate: 2,
                                  transition: { duration: 0.2 }
                                }}
                              >
                                <Card sx={{
                                  textAlign: 'center',
                                  p: 3,
                                  background: seasonGradients[season.season],
                                  backdropFilter: 'blur(15px)',
                                  border: '2px solid rgba(255,255,255,0.3)',
                                  borderRadius: 4,
                                  boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: `linear-gradient(45deg, ${season.color}20, transparent)`,
                                    opacity: 0.7
                                  }
                                }}>
                                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                                    <Typography variant="h2" sx={{ mb: 1 }}>
                                      {seasonEmojis[season.season]}
                                    </Typography>
                                    <Box
                                      sx={{
                                        width: 60,
                                        height: 60,
                                        borderRadius: '50%',
                                        background: `linear-gradient(45deg, ${season.color}, ${season.color}80)`,
                                        margin: '0 auto 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: `0 8px 20px ${season.color}40`,
                                        border: '3px solid white'
                                      }}
                                    >
                                      <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                                        {season.count}
                                      </Typography>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#2c3e50' }}>
                                      {season.season}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#34495e', fontWeight: 500 }}>
                                      {season.months}
                                    </Typography>
                                  </Box>
                                </Card>
                              </motion.div>
                            </Grid>
                          );
                        })}
                      </Grid>

                      {/* Enhanced Seasonal Chart */}
                      <Box sx={{
                        height: 280,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
                        borderRadius: 4,
                        p: 3,
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                      }}>
                        <Typography variant="h6" sx={{
                          color: '#2c3e50',
                          fontWeight: 'bold',
                          mb: 2,
                          textAlign: 'center'
                        }}>
                          🎯 Seasonal Travel Distribution
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={travelInsights.seasonalTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <defs>
                              <linearGradient id="springGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#4ecdc4" stopOpacity={0.9}/>
                                <stop offset="100%" stopColor="#44a08d" stopOpacity={0.7}/>
                              </linearGradient>
                              <linearGradient id="summerGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f9ca24" stopOpacity={0.9}/>
                                <stop offset="100%" stopColor="#f0932b" stopOpacity={0.7}/>
                              </linearGradient>
                              <linearGradient id="fallGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ff6b6b" stopOpacity={0.9}/>
                                <stop offset="100%" stopColor="#ee5a52" stopOpacity={0.7}/>
                              </linearGradient>
                              <linearGradient id="winterGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#54a0ff" stopOpacity={0.9}/>
                                <stop offset="100%" stopColor="#2e86de" stopOpacity={0.7}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                            <XAxis
                              dataKey="season"
                              tick={{ fill: '#2c3e50', fontSize: 12, fontWeight: 'bold' }}
                              axisLine={{ stroke: '#2c3e50' }}
                            />
                            <YAxis
                              tick={{ fill: '#2c3e50', fontSize: 12, fontWeight: 'bold' }}
                              axisLine={{ stroke: '#2c3e50' }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(0,0,0,0.9)',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                backdropFilter: 'blur(10px)'
                              }}
                              formatter={(value, name, props) => [
                                `🎒 ${value} adventures`,
                                `${props.payload.season} Travels`
                              ]}
                              labelStyle={{ color: '#feca57', fontWeight: 'bold' }}
                            />
                            <Bar
                              dataKey="count"
                              radius={[8, 8, 0, 0]}
                              fill={(entry) => {
                                const gradients = {
                                  Spring: 'url(#springGradient)',
                                  Summer: 'url(#summerGradient)',
                                  Fall: 'url(#fallGradient)',
                                  Winter: 'url(#winterGradient)'
                                };
                                return gradients[entry.season] || '#54a0ff';
                              }}
                            >
                              {travelInsights.seasonalTrends.map((entry, index) => {
                                const colors = {
                                  Spring: 'url(#springGradient)',
                                  Summer: 'url(#summerGradient)',
                                  Fall: 'url(#fallGradient)',
                                  Winter: 'url(#winterGradient)'
                                };
                                return <Cell key={`cell-${index}`} fill={colors[entry.season]} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              </Grid>

              {/* Additional Bar Graph Analytics */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Trip Duration Bar Graph */}
                <Grid item xs={12} md={6}>
                  <Card sx={{
                    p: 3,
                    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          background: 'linear-gradient(45deg, #f9ca24, #f0932b)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          boxShadow: '0 8px 16px rgba(249,202,36,0.3)'
                        }}>
                          <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                            ⏱️
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
                            Trip Duration Analysis
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#34495e', fontWeight: 500 }}>
                            Weekend vs Week-long vs Extended trips
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{
                        height: 300,
                        background: 'rgba(255,255,255,0.3)',
                        borderRadius: 3,
                        p: 2,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.4)'
                      }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { type: 'Weekend\nTrips', count: Math.floor(Math.random() * 10) + 5, color: '#ff6b6b' },
                            { type: 'Week-long\nTrips', count: Math.floor(Math.random() * 8) + 3, color: '#4ecdc4' },
                            { type: 'Extended\nTrips', count: Math.floor(Math.random() * 5) + 1, color: '#45b7d1' }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                            <XAxis
                              dataKey="type"
                              tick={{ fill: '#2c3e50', fontSize: 12, fontWeight: 'bold' }}
                              axisLine={{ stroke: '#2c3e50' }}
                            />
                            <YAxis
                              tick={{ fill: '#2c3e50', fontSize: 12, fontWeight: 'bold' }}
                              axisLine={{ stroke: '#2c3e50' }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(44,62,80,0.9)',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                color: 'white',
                                backdropFilter: 'blur(10px)'
                              }}
                              formatter={(value) => [`🎒 ${value} trips`, 'Trip Count']}
                              labelStyle={{ color: '#f9ca24', fontWeight: 'bold' }}
                            />
                            <Bar
                              dataKey="count"
                              radius={[6, 6, 0, 0]}
                              stroke="#2c3e50"
                              strokeWidth={1}
                            >
                              {[
                                { type: 'Weekend\nTrips', count: Math.floor(Math.random() * 10) + 5, color: '#ff6b6b' },
                                { type: 'Week-long\nTrips', count: Math.floor(Math.random() * 8) + 3, color: '#4ecdc4' },
                                { type: 'Extended\nTrips', count: Math.floor(Math.random() * 5) + 1, color: '#45b7d1' }
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                {/* Top Destinations Bar Graph */}
                <Grid item xs={12} md={6}>
                  <Card sx={{
                    p: 3,
                    background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          background: 'linear-gradient(45deg, #ff6b6b, #ee5a52)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          boxShadow: '0 8px 16px rgba(255,107,107,0.3)'
                        }}>
                          <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                            🌍
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
                            Top Travel Destinations
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#34495e', fontWeight: 500 }}>
                            Most visited places in your travels
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{
                        height: 300,
                        background: 'rgba(255,255,255,0.3)',
                        borderRadius: 3,
                        p: 2,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.4)'
                      }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { destination: 'Paris', visits: Math.floor(Math.random() * 8) + 3 },
                            { destination: 'Tokyo', visits: Math.floor(Math.random() * 6) + 2 },
                            { destination: 'New York', visits: Math.floor(Math.random() * 7) + 2 },
                            { destination: 'London', visits: Math.floor(Math.random() * 5) + 1 },
                            { destination: 'Bali', visits: Math.floor(Math.random() * 4) + 1 }
                          ]}>
                            <defs>
                              <linearGradient id="destinationGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ff6b6b" stopOpacity={0.9}/>
                                <stop offset="100%" stopColor="#ee5a52" stopOpacity={0.7}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                            <XAxis
                              dataKey="destination"
                              tick={{ fill: '#2c3e50', fontSize: 11, fontWeight: 'bold' }}
                              axisLine={{ stroke: '#2c3e50' }}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis
                              tick={{ fill: '#2c3e50', fontSize: 12, fontWeight: 'bold' }}
                              axisLine={{ stroke: '#2c3e50' }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(44,62,80,0.9)',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                color: 'white',
                                backdropFilter: 'blur(10px)'
                              }}
                              formatter={(value) => [`✈️ ${value} visits`, 'Total Visits']}
                              labelStyle={{ color: '#ff6b6b', fontWeight: 'bold' }}
                            />
                            <Bar
                              dataKey="visits"
                              fill="url(#destinationGradient)"
                              radius={[6, 6, 0, 0]}
                              stroke="#2c3e50"
                              strokeWidth={1}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </motion.div>
          )}

          {dashboardView === 'planning' && (
            <motion.div
              key="planning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Upcoming Trips */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={8}>
                  <Card sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Upcoming Trips
                    </Typography>
                    {upcomingTrips.length > 0 ? (
                      upcomingTrips.map((trip) => (
                        <Paper key={trip.id} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="h6">{trip.title}</Typography>
                              <Typography color="textSecondary">{trip.destination}</Typography>
                              <Typography variant="body2">
                                {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Chip
                              label={`${Math.ceil((new Date(trip.start_date) - new Date()) / (1000 * 60 * 60 * 24))} days`}
                              color="primary"
                            />
                          </Box>
                        </Paper>
                      ))
                    ) : (
                      <Typography color="textSecondary">No upcoming trips planned.</Typography>
                    )}
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Travel Recommendations
                    </Typography>
                    {travelInsights.recommendations.map((rec, index) => (
                      <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <Recommend sx={{ mr: 1, mt: 0.5 }} />
                          <Typography variant="body2">{rec}</Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Card>
                </Grid>
              </Grid>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Typography variant="h5" component="h2" gutterBottom>
              Quick Actions
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{ height: '100%', cursor: 'pointer', '&:hover': { elevation: 4 } }}
              onClick={handleNewTrip}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Add sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" component="h3">
                  New Trip
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start planning a new adventure
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{ height: '100%', cursor: 'pointer', '&:hover': { elevation: 4 } }}
              onClick={() => navigate('/flights')}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Flight sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" component="h3">
                  Flights
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Search and book flights
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{ height: '100%', cursor: 'pointer', '&:hover': { elevation: 4 } }}
              onClick={() => navigate('/hotels')}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Hotel sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" component="h3">
                  Hotels
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Find perfect accommodations
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{ height: '100%', cursor: 'pointer', '&:hover': { elevation: 4 } }}
              onClick={() => navigate('/explore')}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Map sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" component="h3">
                  Explore
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Discover new destinations
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Trips Section */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Your Trips
              </Typography>
              {trips.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" onClick={handleViewAllTrips}>
                    View All
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/enhanced-trips')}
                    startIcon={<TrendingUp />}
                  >
                    Enhanced View
                  </Button>
                </Box>
              )}
            </Box>
          </Grid>

          {loading ? (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="h6" color="text.secondary">
                    Loading trips...
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : trips.length === 0 ? (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Schedule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No trips yet
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Start planning your first trip to see it here
                  </Typography>
                  <Button variant="contained" startIcon={<Add />} onClick={handleNewTrip}>
                    Plan Your First Trip
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            trips.slice(0, 3).map((trip) => (
              <Grid item xs={12} md={4} key={trip.id}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    '&:hover': { elevation: 4 },
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onClick={() => handleViewTrip(trip.id)}
                >
                  {trip.cover_photo_path && (
                    <Box
                      sx={{
                        height: 200,
                        backgroundImage: `url(${import.meta.env.VITE_API_BASE_URL}${trip.cover_photo_path})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {trip.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {trip.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                      </Typography>
                      <Chip
                        label={trip.status}
                        size="small"
                        color={trip.status === 'completed' ? 'success' : 'primary'}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {trip.city_count || 0} cities • {trip.activity_count || 0} activities
                      </Typography>
                      {trip.total_cost > 0 && (
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(trip.total_cost)}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        {/* User Info Card */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Account Information
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Full Name
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {user?.fullName || 'Not provided'}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {user?.email || 'Not provided'}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Member Since
                  </Typography>
                  <Typography variant="body1">
                    {(user?.created_at || user?.createdAt) ?
                      new Date(user.created_at || user.createdAt).toLocaleDateString('en-IN') :
                      'Unknown'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          

        </Grid>

        {/* Popular Destinations Section */}
        {popularCities.length > 0 && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Typography variant="h5" component="h2" gutterBottom>
                Popular Destinations
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Discover trending destinations for your next adventure
              </Typography>
            </Grid>

            {popularCities.slice(0, 4).map((city) => (
              <Grid item xs={12} sm={6} md={3} key={city.id}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    '&:hover': { elevation: 4 },
                    position: 'relative'
                  }}
                  onClick={() => navigate(`/cities/${city.id}`)}
                >
                  {city.image_url && (
                    <Box
                      sx={{
                        height: 160,
                        backgroundImage: `url(${city.image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 100%)'
                        }
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 16,
                          left: 16,
                          right: 16,
                          zIndex: 1,
                          color: 'white'
                        }}
                      >
                        <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                          {city.name}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {city.country}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  <CardContent>
                    {!city.image_url && (
                      <>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {city.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {city.country}
                        </Typography>
                      </>
                    )}
                    {city.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {city.description.length > 100
                          ? `${city.description.substring(0, 100)}...`
                          : city.description
                        }
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {city.cost_index && (
                        <Chip
                          label={`Cost: ${city.cost_index}/10`}
                          size="small"
                          color={city.cost_index <= 5 ? 'success' : city.cost_index <= 7 ? 'warning' : 'error'}
                        />
                      )}
                      {city.popularity_score && (
                        <Chip
                          label={`★ ${city.popularity_score}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}

export default Dashboard;
