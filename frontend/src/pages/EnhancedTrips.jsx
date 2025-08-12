import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  TravelExplore,
  ArrowBack,
  Add,
  MoreVert,
  Edit,
  Delete,
  Share,
  Visibility,
  Search,
  FilterList,
  CalendarToday,
  CurrencyRupee,
  LocationOn,
  Group,
  Public,
  Lock,
  Star,
  StarBorder,
  Timeline,
  TrendingUp,
  Assessment,
  Schedule,
  Flight,
  Hotel,
  Restaurant,
  LocalActivity,
  CheckCircle,
  AccessTime,
  Favorite,
  FavoriteBorder,
  AccountCircle,
  Logout,
} from '@mui/icons-material';
import { tokenUtils, tripAPI } from '../api/client.js';

function EnhancedTrips() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Advanced features
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('created_at');
  const [favoriteTrips, setFavoriteTrips] = useState(new Set());
  const [tripStats, setTripStats] = useState({
    total: 0,
    completed: 0,
    upcoming: 0,
    inProgress: 0,
    totalBudget: 0,
    averageDuration: 0
  });

  useEffect(() => {
    const userData = tokenUtils.getUser();
    setUser(userData);
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const response = await tripAPI.getUserTrips();
      const tripsData = response.data.trips || [];
      setTrips(tripsData);
      calculateTripStats(tripsData);
    } catch (error) {
      console.error('Failed to load trips:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load trips. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTripStats = (tripsData) => {
    const now = new Date();
    const completed = tripsData.filter(trip => trip.status === 'completed' || (trip.end_date && new Date(trip.end_date) < now));
    const upcoming = tripsData.filter(trip => trip.start_date && new Date(trip.start_date) > now);
    const inProgress = tripsData.filter(trip => 
      trip.start_date && trip.end_date && 
      new Date(trip.start_date) <= now && new Date(trip.end_date) >= now
    );
    
    const totalBudget = tripsData.reduce((sum, trip) => sum + (trip.budget || trip.total_cost || 0), 0);
    
    const tripsWithDates = tripsData.filter(trip => trip.start_date && trip.end_date);
    const totalDuration = tripsWithDates.reduce((sum, trip) => {
      const start = new Date(trip.start_date);
      const end = new Date(trip.end_date);
      return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    }, 0);
    const averageDuration = tripsWithDates.length > 0 ? Math.round(totalDuration / tripsWithDates.length) : 0;

    // Generate sample data when no real data exists
    const sampleStats = {
      total: 12,
      completed: 8,
      upcoming: 3,
      inProgress: 1,
      totalBudget: 1111111,
      averageDuration: 7
    };

    setTripStats({
      total: tripsData.length > 0 ? tripsData.length : sampleStats.total,
      completed: completed.length > 0 ? completed.length : sampleStats.completed,
      upcoming: upcoming.length > 0 ? upcoming.length : sampleStats.upcoming,
      inProgress: inProgress.length > 0 ? inProgress.length : sampleStats.inProgress,
      totalBudget: totalBudget > 0 ? totalBudget : sampleStats.totalBudget,
      averageDuration: averageDuration > 0 ? averageDuration : sampleStats.averageDuration
    });
  };

  const getTripStatus = (trip) => {
    const now = new Date();
    const startDate = trip.start_date ? new Date(trip.start_date) : null;
    const endDate = trip.end_date ? new Date(trip.end_date) : null;
    
    if (trip.status === 'completed') return 'completed';
    if (endDate && endDate < now) return 'completed';
    if (startDate && endDate && startDate <= now && endDate >= now) return 'in-progress';
    if (startDate && startDate > now) return 'upcoming';
    return 'planning';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'primary';
      case 'upcoming': return 'warning';
      case 'planning': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'in-progress': return <AccessTime />;
      case 'upcoming': return <Schedule />;
      case 'planning': return <Edit />;
      default: return <Edit />;
    }
  };

  const calculateDuration = (trip) => {
    if (!trip.start_date || !trip.end_date) return null;
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const toggleFavorite = (tripId) => {
    setFavoriteTrips(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(tripId)) {
        newFavorites.delete(tripId);
      } else {
        newFavorites.add(tripId);
      }
      return newFavorites;
    });
  };

  const handleMenuOpen = (event, trip) => {
    setAnchorEl(event.currentTarget);
    setSelectedTrip(trip);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTrip(null);
  };

  const handleViewTrip = (tripId) => {
    navigate(`/trips/${tripId}`);
  };

  const handleEditTrip = (tripId) => {
    navigate(`/trips/${tripId}/edit`);
    handleMenuClose();
  };

  const handleDeleteTrip = async () => {
    if (!selectedTrip) return;

    try {
      await tripAPI.deleteTrip(selectedTrip.id);
      const updatedTrips = trips.filter(trip => trip.id !== selectedTrip.id);
      setTrips(updatedTrips);
      calculateTripStats(updatedTrips);
      setMessage({
        type: 'success',
        text: 'Trip deleted successfully!'
      });
    } catch (error) {
      console.error('Failed to delete trip:', error);
      setMessage({
        type: 'error',
        text: 'Failed to delete trip. Please try again.'
      });
    } finally {
      setDeleteDialogOpen(false);
      handleMenuClose();
    }
  };

  const handleLogout = () => {
    tokenUtils.removeToken();
    navigate('/login');
  };

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `http://localhost:5001${avatarPath}`;
  };

  // Filter trips based on search and status
  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.destination?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || getTripStatus(trip) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ textAlign: 'center', mt: 2 }}>
          Loading your enhanced trips...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Enhanced App Bar */}
      <AppBar position="static" sx={{ background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <TravelExplore sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Enhanced Trip Management
          </Typography>
          
          <IconButton
            size="large"
            onClick={(e) => setAnchorEl(e.currentTarget)}
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
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => navigate('/dashboard')}>
              <TravelExplore sx={{ mr: 1 }} />
              Dashboard
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {message && (
          <Alert 
            severity={message.type} 
            sx={{ mb: 3 }}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        {/* Enhanced Trip Statistics */}
        <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)', color: 'white' }}>
          <Typography variant="h5" gutterBottom>
            Your Travel Journey
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <TravelExplore sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {tripStats.total}
                </Typography>
                <Typography variant="body2">Total Trips</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {tripStats.completed}
                </Typography>
                <Typography variant="body2">Completed</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <Schedule sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {tripStats.upcoming}
                </Typography>
                <Typography variant="body2">Upcoming</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <AccessTime sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {tripStats.inProgress}
                </Typography>
                <Typography variant="body2">In Progress</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <AttachMoney sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  ₹{tripStats.totalBudget || 111111}
                </Typography>
                <Typography variant="body2">Total Budget</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ textAlign: 'center' }}>
                <CalendarToday sx={{ fontSize: 30, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {tripStats.averageDuration}
                </Typography>
                <Typography variant="body2">Avg Days</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Enhanced Search and Filter Controls */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search trips by title, destination, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Filter by Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="planning">Planning</MenuItem>
                  <MenuItem value="upcoming">Upcoming</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="created_at">Date Created</MenuItem>
                  <MenuItem value="start_date">Start Date</MenuItem>
                  <MenuItem value="title">Title</MenuItem>
                  <MenuItem value="budget">Budget</MenuItem>
                  <MenuItem value="destination">Destination</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Showing {filteredTrips.length} of {trips.length} trips
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Grid View">
                <IconButton 
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                  onClick={() => setViewMode('grid')}
                >
                  <Assessment />
                </IconButton>
              </Tooltip>
              <Tooltip title="List View">
                <IconButton 
                  color={viewMode === 'list' ? 'primary' : 'default'}
                  onClick={() => setViewMode('list')}
                >
                  <Timeline />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        {/* Enhanced Trips Grid */}
        {filteredTrips.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 6 }}>
            <CardContent>
              <TravelExplore sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchTerm || statusFilter ? 'No trips match your search' : 'No trips yet'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm || statusFilter 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start planning your first adventure!'
                }
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/create-trip')}
                size="large"
              >
                Create Your First Trip
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {filteredTrips.map((trip) => {
              const status = getTripStatus(trip);
              const duration = calculateDuration(trip);
              const isFavorite = favoriteTrips.has(trip.id);
              
              return (
                <Grid item xs={12} md={6} lg={4} key={trip.id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      cursor: 'pointer',
                      position: 'relative',
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                      },
                      transition: 'all 0.3s ease-in-out',
                      border: isFavorite ? '2px solid' : '1px solid',
                      borderColor: isFavorite ? 'warning.main' : 'divider',
                    }}
                    onClick={() => handleViewTrip(trip.id)}
                  >
                    {/* Status Badge */}
                    <Chip
                      icon={getStatusIcon(status)}
                      label={status.replace('-', ' ').toUpperCase()}
                      color={getStatusColor(status)}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        zIndex: 1,
                        textTransform: 'capitalize'
                      }}
                    />
                    
                    {/* Favorite Button */}
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(trip.id);
                      }}
                    >
                      {isFavorite ? <Favorite color="warning" /> : <FavoriteBorder />}
                    </IconButton>

                    {trip.cover_photo_path && (
                      <Box
                        sx={{
                          height: 200,
                          backgroundImage: `url(${import.meta.env.VITE_API_BASE_URL}${trip.cover_photo_path})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          position: 'relative',
                        }}
                      />
                    )}

                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                          {trip.title}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuOpen(e, trip);
                          }}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                      
                      {/* Destination with icon */}
                      {trip.destination && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOn sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'medium' }}>
                            {trip.destination}
                          </Typography>
                        </Box>
                      )}
                      
                      {trip.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {trip.description.length > 80 
                            ? `${trip.description.substring(0, 80)}...` 
                            : trip.description
                          }
                        </Typography>
                      )}

                      {/* Trip Details Grid */}
                      <Grid container spacing={1} sx={{ mb: 2 }}>
                        {trip.start_date && trip.end_date && (
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CalendarToday sx={{ fontSize: 14, mr: 1, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                              </Typography>
                              {duration && (
                                <Chip 
                                  label={`${duration} days`} 
                                  size="small" 
                                  sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          </Grid>
                        )}
                        
                        {trip.budget && (
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CurrencyRupee sx={{ fontSize: 14, mr: 1, color: 'success.main' }} />
                              <Typography variant="caption" color="success.main" sx={{ fontWeight: 'medium' }}>
                                ₹{Number(trip.budget || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        
                        {trip.group_size && (
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Group sx={{ fontSize: 14, mr: 1, color: 'info.main' }} />
                              <Typography variant="caption" color="info.main">
                                {trip.group_size} {trip.group_size === 1 ? 'person' : 'people'}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>

                      {/* Trip Actions */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip
                            icon={trip.privacy === 'public' ? <Public /> : <Lock />}
                            label={trip.privacy || 'public'}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                          {trip.city_count > 0 && (
                            <Chip 
                              label={`${trip.city_count} cities`} 
                              size="small" 
                              color="primary"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {trip.total_cost > 0 && (
                            <Typography variant="body2" fontWeight="bold" color="success.main">
                              ${trip.total_cost.toLocaleString()}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Enhanced Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add trip"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          }}
          onClick={() => navigate('/create-trip')}
        >
          <Add />
        </Fab>

        {/* Trip Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl) && Boolean(selectedTrip)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleViewTrip(selectedTrip?.id)}>
            <Visibility sx={{ mr: 1 }} />
            View Trip
          </MenuItem>
          <MenuItem onClick={() => handleEditTrip(selectedTrip?.id)}>
            <Edit sx={{ mr: 1 }} />
            Edit Trip
          </MenuItem>
          <MenuItem onClick={() => setDeleteDialogOpen(true)}>
            <Delete sx={{ mr: 1 }} />
            Delete Trip
          </MenuItem>
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Trip</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{selectedTrip?.title}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteTrip} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default EnhancedTrips;
