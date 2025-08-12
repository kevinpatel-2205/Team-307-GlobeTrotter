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
} from '@mui/material';
import {
  Flight,
  ArrowBack,
  TravelExplore,
  FlightTakeoff,
  FlightLand,
  CalendarToday,
  Person,
  Search,
} from '@mui/icons-material';
import { tokenUtils } from '../api/client.js';

function Flights() {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    from: '',
    to: '',
    departDate: '',
    returnDate: '',
    passengers: 1,
    tripType: 'roundtrip'
  });

  const user = tokenUtils.getUser();

  const handleInputChange = (field, value) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    // This would integrate with a flight search API
    console.log('Searching flights with:', searchData);
    // For now, just show a message
    alert('Flight search functionality will be integrated with external APIs like Amadeus or Skyscanner');
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
            Flight Search
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
          <Flight sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Find the Best Flights
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Search and compare flights from multiple airlines
          </Typography>
        </Box>

        {/* Search Form */}
        <Paper sx={{ p: 4, mb: 4 }}>
          <Grid container spacing={3}>
            {/* Trip Type */}
            <Grid item xs={12}>
              <FormControl>
                <InputLabel>Trip Type</InputLabel>
                <Select
                  value={searchData.tripType}
                  label="Trip Type"
                  onChange={(e) => handleInputChange('tripType', e.target.value)}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="roundtrip">Round Trip</MenuItem>
                  <MenuItem value="oneway">One Way</MenuItem>
                  <MenuItem value="multicity">Multi-city</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* From and To */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="From"
                placeholder="Departure city or airport"
                value={searchData.from}
                onChange={(e) => handleInputChange('from', e.target.value)}
                InputProps={{
                  startAdornment: <FlightTakeoff sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="To"
                placeholder="Destination city or airport"
                value={searchData.to}
                onChange={(e) => handleInputChange('to', e.target.value)}
                InputProps={{
                  startAdornment: <FlightLand sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>

            {/* Dates */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Departure Date"
                value={searchData.departDate}
                onChange={(e) => handleInputChange('departDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <CalendarToday sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>

            {searchData.tripType === 'roundtrip' && (
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Return Date"
                  value={searchData.returnDate}
                  onChange={(e) => handleInputChange('returnDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <CalendarToday sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
            )}

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Passengers</InputLabel>
                <Select
                  value={searchData.passengers}
                  label="Passengers"
                  onChange={(e) => handleInputChange('passengers', e.target.value)}
                  startAdornment={<Person sx={{ mr: 1, color: 'action.active' }} />}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <MenuItem key={num} value={num}>
                      {num} {num === 1 ? 'Passenger' : 'Passengers'}
                    </MenuItem>
                  ))}
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
                Search Flights
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Coming Soon Notice */}
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Flight sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Flight Search Coming Soon
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We're working on integrating with major flight search APIs to bring you the best deals.
            </Typography>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Planned Features:
            </Typography>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  • Real-time flight prices
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  • Multiple airline comparison
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  • Price alerts & tracking
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  • Flexible date search
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  • Direct booking integration
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  • Trip integration
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default Flights;
