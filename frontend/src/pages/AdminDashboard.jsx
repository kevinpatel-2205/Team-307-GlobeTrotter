import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  Fab,
  Badge,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  People,
  TravelExplore,
  LocationCity,
  LocalActivity,
  Analytics,
  Settings,
  Logout,
  TrendingUp,
  TrendingDown,
  Visibility,
  Edit,
  Delete,
  Add,
  Search,
  FilterList,
  Download,
  Refresh,
  Security,
  MonitorHeart,
  Warning,
  CheckCircle,
  Block,
  Star,
  Public,
} from '@mui/icons-material';
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
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { adminAPI, tokenUtils } from '../api/client.js';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function AdminDashboard() {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [cities, setCities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboardAnalytics();
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadTrips = async () => {
    try {
      const response = await adminAPI.getTrips();
      setTrips(response.data.trips);
    } catch (error) {
      console.error('Failed to load trips:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    if (currentTab === 1) await loadUsers();
    if (currentTab === 2) await loadTrips();
    setRefreshing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const StatCard = ({ title, value, change, icon, color = 'primary' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography color="textSecondary" gutterBottom variant="overline">
                {title}
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {formatNumber(value)}
              </Typography>
              {change !== undefined && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {change >= 0 ? (
                    <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
                  ) : (
                    <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} />
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      color: change >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 'medium'
                    }}
                  >
                    {Math.abs(change)}% from last month
                  </Typography>
                </Box>
              )}
            </Box>
            <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
              {icon}
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Dashboard sx={{ fontSize: 48, color: 'primary.main' }} />
        </motion.div>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Admin App Bar */}
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
          <Dashboard sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            GlobeTrotter Admin Panel
          </Typography>
          <Button
            color="inherit"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ mr: 2 }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            color="inherit"
            startIcon={<Logout />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Navigation Tabs */}
        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => {
              setCurrentTab(newValue);
              if (newValue === 1 && users.length === 0) loadUsers();
              if (newValue === 2 && trips.length === 0) loadTrips();
            }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<Analytics />} label="Analytics" />
            <Tab icon={<People />} label="Users" />
            <Tab icon={<TravelExplore />} label="Trips" />
            <Tab icon={<LocationCity />} label="Cities" />
            <Tab icon={<LocalActivity />} label="Activities" />
            <Tab icon={<MonitorHeart />} label="System" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {currentTab === 0 && analytics && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Overview Stats */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Total Users"
                    value={analytics.userStats?.totalUsers || 0}
                    change={15.2}
                    icon={<People />}
                    color="primary"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Total Trips"
                    value={analytics.tripStats?.totalTrips || 0}
                    change={8.7}
                    icon={<TravelExplore />}
                    color="secondary"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Active Users"
                    value={analytics.userStats?.activeUsers || 0}
                    change={12.3}
                    icon={<TrendingUp />}
                    color="success"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Public Trips"
                    value={analytics.tripStats?.publicTrips || 0}
                    change={-2.1}
                    icon={<Visibility />}
                    color="warning"
                  />
                </Grid>
              </Grid>

              {/* Charts */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        User Growth (Last 12 Months)
                      </Typography>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analytics.userStats?.userGrowth || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <RechartsTooltip />
                            <Area
                              type="monotone"
                              dataKey="users"
                              stroke="#8884d8"
                              fill="#8884d8"
                              fillOpacity={0.3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Popular Destinations
                      </Typography>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.popularCities?.slice(0, 5) || []}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="tripCount"
                              label={({ name }) => name}
                            >
                              {(analytics.popularCities?.slice(0, 5) || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => {
          // Handle quick actions based on current tab
          if (currentTab === 1) {
            // Add user
          } else if (currentTab === 3) {
            // Add city
          } else if (currentTab === 4) {
            // Add activity
          }
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
}

export default AdminDashboard;
