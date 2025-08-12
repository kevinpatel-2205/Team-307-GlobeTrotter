import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Slider,
} from '@mui/material';
import {
  Hotel,
  ArrowBack,
  TravelExplore,
  LocationOn,
  CalendarToday,
  Person,
  Search,
  AttachMoney,
  Star,
} from '@mui/icons-material';
import { tokenUtils } from '../api/client.js';

function Hotels() {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: 2,
    rooms: 1,
    priceRange: [50, 500],
    starRating: ''
  });

  const user = tokenUtils.getUser();

  const handleInputChange = (field, value) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePriceRangeChange = (event, newValue) => {
    setSearchData(prev => ({
      ...prev,
      priceRange: newValue
    }));
  };

  const handleSearch = () => {
    // This would integrate with a hotel search API
    console.log('Searching hotels with:', searchData);
    // For now, just show a message
    alert('Hotel search functionality will be integrated with external APIs like Booking.com or Hotels.com');
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
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
            Hotel Search
          </Typography>
          <Avatar
            src={user?.avatarPath ? `${import.meta.env.VITE_API_BASE_URL}${user.avatarPath}` : undefined}
            sx={{ width: 32, height: 32 }}
          >
            {user?.fullName?.charAt(0)}
          </Avatar>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Hotel sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Find Perfect Accommodations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Search and book hotels, resorts, and unique stays
          </Typography>
        </Box>

        {/* Search Form */}
        <Paper sx={{ p: 4, mb: 4 }}>
          <Grid container spacing={3}>
            {/* Destination */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Destination"
                placeholder="City, hotel name, or landmark"
                value={searchData.destination}
                onChange={(e) => handleInputChange('destination', e.target.value)}
                InputProps={{
                  startAdornment: <LocationOn sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>

            {/* Check-in and Check-out */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Check-in Date"
                value={searchData.checkIn}
                onChange={(e) => handleInputChange('checkIn', e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <CalendarToday sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Check-out Date"
                value={searchData.checkOut}
                onChange={(e) => handleInputChange('checkOut', e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <CalendarToday sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>

            {/* Guests and Rooms */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Guests</InputLabel>
                <Select
                  value={searchData.guests}
                  label="Guests"
                  onChange={(e) => handleInputChange('guests', e.target.value)}
                  startAdornment={<Person sx={{ mr: 1, color: 'action.active' }} />}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <MenuItem key={num} value={num}>
                      {num} {num === 1 ? 'Guest' : 'Guests'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Rooms</InputLabel>
                <Select
                  value={searchData.rooms}
                  label="Rooms"
                  onChange={(e) => handleInputChange('rooms', e.target.value)}
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <MenuItem key={num} value={num}>
                      {num} {num === 1 ? 'Room' : 'Rooms'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Price Range */}
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                <AttachMoney sx={{ verticalAlign: 'middle', mr: 1 }} />
                Price Range per Night
              </Typography>
              <Slider
                value={searchData.priceRange}
                onChange={handlePriceRangeChange}
                valueLabelDisplay="auto"
                min={0}
                max={1000}
                step={25}
                valueLabelFormat={(value) => `₹${value * 83}`}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">₹{searchData.priceRange[0] * 83}</Typography>
                <Typography variant="body2">₹{searchData.priceRange[1] * 83}+</Typography>
              </Box>
            </Grid>

            {/* Star Rating */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Minimum Star Rating</InputLabel>
                <Select
                  value={searchData.starRating}
                  label="Minimum Star Rating"
                  onChange={(e) => handleInputChange('starRating', e.target.value)}
                  startAdornment={<Star sx={{ mr: 1, color: 'action.active' }} />}
                >
                  <MenuItem value="">Any Rating</MenuItem>
                  <MenuItem value="3">3+ Stars</MenuItem>
                  <MenuItem value="4">4+ Stars</MenuItem>
                  <MenuItem value="5">5 Stars Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Search Button */}
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<Search />}
                onClick={handleSearch}
                sx={{ py: 2 }}
              >
                Search Hotels
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Coming Soon Notice */}
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Hotel sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Hotel Search Coming Soon
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We're working on integrating with major hotel booking platforms to offer you the best accommodations.
            </Typography>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Planned Features:
            </Typography>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  • Real-time availability
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  • Price comparison
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  • Guest reviews & ratings
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  • Photo galleries
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  • Amenity filtering
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  • Trip integration
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  • Cancellation policies
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  • Special deals & offers
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  • Loyalty program integration
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default Hotels;
