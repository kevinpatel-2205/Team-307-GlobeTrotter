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
  Tabs,
  Tab,
  LinearProgress,
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
  Dashboard as DashboardIcon,
  Analytics,
  LocationOn,
  AttachMoney,
  CalendarToday,
  Notifications,
  Recommend,
  Speed,
  TrendingUp,
  Assessment,
} from '@mui/icons-material';
import { tokenUtils, authAPI, tripAPI, cityAPI } from '../api/client.js';
import socketService from '../services/socket.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
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
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function AdvancedDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardView, setDashboardView] = useState('overview');
  
  // Basic data
  const [trips, setTrips] = useState([]);
  const [popularCities, setPopularCities] = useState([]);
  const [stats, setStats] = useState({
    totalTrips: 0,
    countriesVisited: 0,
    totalCost: 0
  });

  // Advanced analytics
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

  useEffect(() => {
    // Get user data from localStorage or fetch from API
    const userData = tokenUtils.getUser();
    if (userData) {
      setUser(userData);
    } else {
      fetchUserProfile();
    }

    loadDashboardData();
    socketService.connect();

    const handleTripUpdate = (data) => {
      console.log('Trip update received:', data);
      loadDashboardData();
    };

    socketService.on('tripUpdate', handleTripUpdate);

    return () => {
      socketService.off('tripUpdate', handleTripUpdate);
    };
  }, []);

  const isAdmin = () => {
    const user = tokenUtils.getUser();
    return user && user.role === 'admin';
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Loading dashboard data...');

      const [tripsResponse, citiesResponse] = await Promise.all([
        tripAPI.getUserTrips({ limit: 6 }),
        cityAPI.getPopularCities(8)
      ]);

      console.log('Trips response:', tripsResponse);
      console.log('Cities response:', citiesResponse);

      const userTrips = tripsResponse.data.trips || [];
      setTrips(userTrips);
      setPopularCities(citiesResponse.data.cities || []);

      // Calculate advanced analytics
      await calculateAdvancedAnalytics(userTrips);

      // Calculate basic stats for backward compatibility
      const totalTrips = userTrips.length;
      const countriesVisited = new Set(
        userTrips.flatMap(trip =>
          trip.cities?.map(city => city.country) || []
        )
      ).size;
      const totalCost = userTrips.reduce((sum, trip) => sum + (trip.total_cost || 0), 0);

      setStats({
        totalTrips,
        countriesVisited,
        totalCost
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Advanced analytics calculation functions
  const calculateAdvancedAnalytics = async (tripData) => {
    // Calculate travel statistics
    const totalCost = tripData.reduce((sum, trip) => sum + (trip.budget || trip.total_cost || 0), 0);
    const countries = [...new Set(tripData.map(trip => trip.destination?.split(',')[1]?.trim()).filter(Boolean))];
    const cities = [...new Set(tripData.map(trip => trip.destination?.split(',')[0]?.trim()).filter(Boolean))];
    
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
      totalTrips: 12,
      totalBudget: 1111111,
      countriesVisited: 8,
      citiesVisited: 15,
      averageTripDuration: 7,
      totalDistance: 18000
    };

    setTravelStats({
      totalTrips: tripData.length > 0 ? tripData.length : sampleStats.totalTrips,
      totalBudget: totalCost > 0 ? totalCost : sampleStats.totalBudget,
      countriesVisited: countries.length > 0 ? countries.length : sampleStats.countriesVisited,
      citiesVisited: cities.length > 0 ? cities.length : sampleStats.citiesVisited,
      averageTripDuration: avgDuration > 0 ? avgDuration : sampleStats.averageTripDuration,
      totalDistance: tripData.length > 0 ? Math.round(tripData.length * 1500) : sampleStats.totalDistance
    });

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

    // Generate notifications
    setNotifications(generateNotifications(tripData, upcoming));
  };

  const generateMonthlySpendingData = (trips) => {
    const monthlyData = {};
    trips.forEach(trip => {
      if (trip.start_date && (trip.budget || trip.total_cost)) {
        const month = new Date(trip.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        monthlyData[month] = (monthlyData[month] || 0) + (trip.budget || trip.total_cost || 0);
      }
    });
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
    return Object.entries(categories).map(([name, percentage]) => ({
      name,
      value: Math.round(totalBudget * percentage),
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

      timelineData.push({
        month: monthName,
        trips: monthTrips.length,
        budget: monthTrips.reduce((sum, trip) => sum + (trip.budget || trip.total_cost || 0), 0)
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

  const generateRecommendations = (trips, visitedCities) => {
    const recommendations = [
      'Based on your travel history, you might enjoy exploring Japan for its unique culture.',
      'Consider visiting New Zealand for adventure activities.',
      'Your budget-friendly trips suggest exploring Eastern Europe.',
      'Try a food tour in Italy based on your dining preferences.'
    ];
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
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      if (error.response?.status === 401) {
        tokenUtils.removeToken();
        navigate('/login');
      }
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    tokenUtils.removeToken();
    socketService.disconnect();
    navigate('/login');
  };

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `http://localhost:5001${avatarPath}`;
  };

  const handleNewTrip = () => {
    navigate('/create-trip');
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ textAlign: 'center', mt: 2 }}>
          Loading your advanced dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static" sx={{ background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)' }}>
        <Toolbar>
          <TravelExplore sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            GlobeTrotter - Advanced Dashboard
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
            <MenuItem onClick={() => navigate('/dashboard')}>
              <DashboardIcon sx={{ mr: 1 }} />
              Regular Dashboard
            </MenuItem>
            {tokenUtils.getUser()?.role === 'admin' && (
              <MenuItem onClick={() => navigate('/admin')}>
                <DashboardIcon sx={{ mr: 1 }} />
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
                Advanced Analytics Dashboard
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Deep insights into your travel patterns and preferences
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Dashboard View Switcher */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" component="h2">
              Advanced Dashboard
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={dashboardView === 'overview' ? 'contained' : 'outlined'}
                startIcon={<DashboardIcon />}
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
                    <AttachMoney sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
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
              {/* Budget Analytics */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={8}>
                  <Card sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Monthly Spending Trends
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={budgetAnalytics.monthlySpending}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                          <Area type="monotone" dataKey="amount" stroke="#1976d2" fill="#1976d2" fillOpacity={0.3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Spending Categories
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={budgetAnalytics.categoryBreakdown}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percentage }) => `${name}: ${percentage}%`}
                          >
                            {budgetAnalytics.categoryBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Grid>
              </Grid>

              {/* Enhanced Travel Analytics */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Travel Patterns Timeline */}
                <Grid item xs={12}>
                  <Card sx={{ p: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                      Travel Patterns
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                      Your travel activity over the past 12 months
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={travelInsights.travelPatterns}>
                          <defs>
                            <linearGradient id="travelGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#1976d2" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 12 }}
                            axisLine={{ stroke: '#bdbdbd' }}
                          />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            axisLine={{ stroke: '#bdbdbd' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e0e0e0',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value, name) => [
                              name === 'trips' ? `${value} trips` : `$${value}`,
                              name === 'trips' ? 'Trips' : 'Budget'
                            ]}
                          />
                          <Area
                            type="monotone"
                            dataKey="trips"
                            stroke="#1976d2"
                            fillOpacity={1}
                            fill="url(#travelGradient)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Grid>

                {/* Seasonal Preferences */}
                <Grid item xs={12}>
                  <Card sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
                      Seasonal Preferences
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 3 }}>
                      When you love to travel most
                    </Typography>

                    {/* Season Cards */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      {travelInsights.seasonalTrends.map((season, index) => (
                        <Grid item xs={6} md={3} key={season.season}>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                          >
                            <Card sx={{
                              textAlign: 'center',
                              p: 2,
                              background: 'rgba(255,255,255,0.95)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255,255,255,0.2)'
                            }}>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  backgroundColor: season.color,
                                  margin: '0 auto 8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                                  {season.count}
                                </Typography>
                              </Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                {season.season}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {season.months}
                              </Typography>
                            </Card>
                          </motion.div>
                        </Grid>
                      ))}
                    </Grid>

                    {/* Seasonal Chart */}
                    <Box sx={{ height: 200, background: 'rgba(255,255,255,0.1)', borderRadius: 2, p: 2 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={travelInsights.seasonalTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                          <XAxis
                            dataKey="season"
                            tick={{ fill: 'white', fontSize: 12 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                          />
                          <YAxis
                            tick={{ fill: 'white', fontSize: 12 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(0,0,0,0.8)',
                              border: 'none',
                              borderRadius: '8px',
                              color: 'white'
                            }}
                            formatter={(value) => [`${value} trips`, 'Trips']}
                          />
                          <Bar
                            dataKey="count"
                            fill="rgba(255,255,255,0.8)"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Grid>
              </Grid>

              {/* Budget vs Actual Spending */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                  <Card sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Budget vs Actual Spending
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={budgetAnalytics.budgetTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="trip" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="planned" fill="#8884d8" name="Planned Budget" />
                          <Bar dataKey="actual" fill="#82ca9d" name="Actual Spending" />
                        </BarChart>
                      </ResponsiveContainer>
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

              {/* Quick Actions */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
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
                      <Typography variant="h6" component="div">
                        Plan New Trip
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Start planning your next adventure
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ height: '100%', cursor: 'pointer', '&:hover': { elevation: 4 } }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Flight sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                      <Typography variant="h6" component="div">
                        Find Flights
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Search and compare flight prices
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ height: '100%', cursor: 'pointer', '&:hover': { elevation: 4 } }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Hotel sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                      <Typography variant="h6" component="div">
                        Book Hotels
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Find perfect accommodations
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ height: '100%', cursor: 'pointer', '&:hover': { elevation: 4 } }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Map sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                      <Typography variant="h6" component="div">
                        Explore Cities
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Discover new destinations
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </Box>
  );
}

export default AdvancedDashboard;
