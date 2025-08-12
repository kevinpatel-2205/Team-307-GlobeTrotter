import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  TextField,
  InputAdornment,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  TravelExplore,
  ArrowBack,
  Search,
  LocationOn,
  Star,
  AttachMoney,
  Add,
} from '@mui/icons-material';
import { cityAPI, tokenUtils } from '../api/client.js';

function Explore() {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [message, setMessage] = useState(null);

  const user = tokenUtils.getUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [popularCitiesResponse, countriesResponse] = await Promise.all([
        cityAPI.getPopularCities(20),
        cityAPI.getCountries()
      ]);

      setCities(popularCitiesResponse.data.cities || []);
      setCountries(countriesResponse.data.countries || []);
    } catch (error) {
      console.error('Failed to load explore data:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load destinations. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadData();
      return;
    }

    try {
      setLoading(true);
      const response = await cityAPI.searchCities(searchTerm, {
        country: selectedCountry,
        limit: 20
      });
      setCities(response.data.cities || []);
    } catch (error) {
      console.error('Search failed:', error);
      setMessage({
        type: 'error',
        text: 'Search failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCityClick = (cityId) => {
    navigate(`/cities/${cityId}`);
  };

  const handleAddToTrip = (cityId) => {
    // This would open a dialog to select which trip to add the city to
    navigate(`/cities/${cityId}/add-to-trip`);
  };

  const getCostColor = (costIndex) => {
    if (costIndex <= 5) return 'success';
    if (costIndex <= 7) return 'warning';
    return 'error';
  };

  const formatCostIndex = (costIndex) => {
    if (costIndex <= 3) return 'Budget';
    if (costIndex <= 6) return 'Moderate';
    if (costIndex <= 8) return 'Expensive';
    return 'Luxury';
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
            Explore Destinations
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
        {message && (
          <Alert 
            severity={message.type} 
            sx={{ mb: 3 }}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Discover Amazing Destinations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Find your next adventure from our curated list of popular destinations
          </Typography>
        </Box>

        {/* Search and Filter */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search destinations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Filter by Country</InputLabel>
              <Select
                value={selectedCountry}
                label="Filter by Country"
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                <MenuItem value="">All Countries</MenuItem>
                {countries.map((country) => (
                  <MenuItem key={country.country} value={country.country}>
                    {country.country} ({country.city_count})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              sx={{ height: '56px' }}
            >
              Search
            </Button>
          </Grid>
        </Grid>

        {/* Cities Grid */}
        {loading ? (
          <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Loading destinations...
          </Typography>
        ) : cities.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 6 }}>
            <CardContent>
              <TravelExplore sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No destinations found
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Try adjusting your search criteria
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {cities.map((city) => (
              <Grid item xs={12} sm={6} md={4} key={city.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': { elevation: 4 }
                  }}
                  onClick={() => handleCityClick(city.id)}
                >
                  {city.image_url ? (
                    <CardMedia
                      component="img"
                      height="200"
                      image={city.image_url}
                      alt={city.name}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 200,
                        bgcolor: 'grey.200',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <LocationOn sx={{ fontSize: 48, color: 'grey.400' }} />
                    </Box>
                  )}
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {city.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {city.country}
                    </Typography>
                    
                    {city.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {city.description.length > 100 
                          ? `${city.description.substring(0, 100)}...` 
                          : city.description
                        }
                      </Typography>
                    )}
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      {city.cost_index && (
                        <Chip 
                          label={formatCostIndex(city.cost_index)}
                          size="small" 
                          color={getCostColor(city.cost_index)}
                          icon={<AttachMoney />}
                        />
                      )}
                      {city.popularity_score && (
                        <Chip 
                          label={`${city.popularity_score}/100`}
                          size="small" 
                          variant="outlined"
                          icon={<Star />}
                        />
                      )}
                    </Box>
                    
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToTrip(city.id);
                      }}
                    >
                      Add to Trip
                    </Button>
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

export default Explore;
