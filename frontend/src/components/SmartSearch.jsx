import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Typography,
  Chip,
  Avatar,
  InputAdornment,
  IconButton,
  Divider,
  CircularProgress,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Grid,
  Card,
  CardContent,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Search,
  LocationOn,
  LocalActivity,
  Restaurant,
  Hotel,
  Flight,
  Clear,
  FilterList,
  Star,
  AttachMoney,
  Schedule,
  TrendingUp,
  Explore,
} from '@mui/icons-material';
import { cityAPI, activityAPI } from '../api/client.js';

function SmartSearch({ 
  onCitySelect, 
  onActivitySelect, 
  searchType = 'both', // 'cities', 'activities', 'both'
  placeholder = "Search destinations and activities...",
  showFilters = true,
  autoFocus = false 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [popularSuggestions, setPopularSuggestions] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    priceRange: [0, 1000],
    rating: 0,
    country: '',
  });
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    loadPopularSuggestions();
    loadRecentSearches();
  }, []);

  useEffect(() => {
    // Debounced search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchTerm.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        performSearch(searchTerm);
      }, 300);
    } else {
      setResults([]);
      setShowResults(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, filters]);

  const loadPopularSuggestions = async () => {
    try {
      const [citiesResponse, activitiesResponse] = await Promise.all([
        cityAPI.getPopularCities(6),
        activityAPI.getPopularActivities(6)
      ]);

      const suggestions = [
        ...citiesResponse.data.cities.map(city => ({
          ...city,
          type: 'city',
          icon: <LocationOn />,
        })),
        ...activitiesResponse.data.activities.map(activity => ({
          ...activity,
          type: 'activity',
          icon: <LocalActivity />,
        }))
      ];

      setPopularSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to load popular suggestions:', error);
    }
  };

  const loadRecentSearches = () => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(recent.slice(0, 5));
  };

  const saveRecentSearch = (item) => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const newRecent = [item, ...recent.filter(r => r.id !== item.id)].slice(0, 10);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    setRecentSearches(newRecent.slice(0, 5));
  };

  const performSearch = async (query) => {
    try {
      setLoading(true);
      const searchPromises = [];

      if (searchType === 'cities' || searchType === 'both') {
        searchPromises.push(
          cityAPI.searchCities(query, {
            country: filters.country,
            limit: 10
          }).then(response => 
            response.data.cities.map(city => ({
              ...city,
              type: 'city',
              icon: <LocationOn />,
              relevanceScore: calculateRelevance(query, city.name + ' ' + city.country)
            }))
          )
        );
      }

      if (searchType === 'activities' || searchType === 'both') {
        searchPromises.push(
          activityAPI.searchActivities(query, {
            category: filters.category,
            priceMin: filters.priceRange[0],
            priceMax: filters.priceRange[1],
            minRating: filters.rating,
            limit: 10
          }).then(response =>
            response.data.activities.map(activity => ({
              ...activity,
              type: 'activity',
              icon: getActivityIcon(activity.category),
              relevanceScore: calculateRelevance(query, activity.name + ' ' + activity.description)
            }))
          )
        );
      }

      const searchResults = await Promise.all(searchPromises);
      const combinedResults = searchResults
        .flat()
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 15);

      setResults(combinedResults);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateRelevance = (query, text) => {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    if (textLower.includes(queryLower)) {
      const index = textLower.indexOf(queryLower);
      return 100 - index; // Earlier matches get higher scores
    }
    
    // Check for partial matches
    const queryWords = queryLower.split(' ');
    const textWords = textLower.split(' ');
    let matches = 0;
    
    queryWords.forEach(qWord => {
      textWords.forEach(tWord => {
        if (tWord.includes(qWord) || qWord.includes(tWord)) {
          matches++;
        }
      });
    });
    
    return matches * 10;
  };

  const getActivityIcon = (category) => {
    switch (category) {
      case 'food': return <Restaurant />;
      case 'sightseeing': return <Explore />;
      case 'adventure': return <TrendingUp />;
      case 'culture': return <Star />;
      default: return <LocalActivity />;
    }
  };

  const formatPrice = (min, max) => {
    if (min && max) {
      return `₹${min} - ₹${max}`;
    } else if (min) {
      return `From ₹${min}`;
    } else if (max) {
      return `Up to ₹${max}`;
    }
    return 'Price varies';
  };

  const handleItemSelect = (item) => {
    saveRecentSearch(item);
    setSearchTerm('');
    setShowResults(false);
    
    if (item.type === 'city' && onCitySelect) {
      onCitySelect(item);
    } else if (item.type === 'activity' && onActivitySelect) {
      onActivitySelect(item);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setShowResults(false);
  };

  // formatPrice function moved above - removed duplicate

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Search Input */}
      <TextField
        ref={searchRef}
        fullWidth
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setShowResults(true)}
        autoFocus={autoFocus}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {loading && <CircularProgress size={20} />}
              {showFilters && (
                <Tooltip title="Filters">
                  <IconButton
                    onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                    color={showFiltersPanel ? 'primary' : 'default'}
                  >
                    <FilterList />
                  </IconButton>
                </Tooltip>
              )}
              {searchTerm && (
                <IconButton onClick={handleClearSearch} size="small">
                  <Clear />
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
          },
        }}
      />

      {/* Filters Panel */}
      <AnimatePresence>
        {showFiltersPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Paper sx={{ mt: 1, p: 2, border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" gutterBottom>
                Search Filters
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={filters.category}
                      label="Category"
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      <MenuItem value="sightseeing">Sightseeing</MenuItem>
                      <MenuItem value="food">Food & Dining</MenuItem>
                      <MenuItem value="adventure">Adventure</MenuItem>
                      <MenuItem value="culture">Culture</MenuItem>
                      <MenuItem value="nightlife">Nightlife</MenuItem>
                      <MenuItem value="shopping">Shopping</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Country</InputLabel>
                    <Select
                      value={filters.country}
                      label="Country"
                      onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                    >
                      <MenuItem value="">All Countries</MenuItem>
                      <MenuItem value="France">France</MenuItem>
                      <MenuItem value="Japan">Japan</MenuItem>
                      <MenuItem value="United States">United States</MenuItem>
                      <MenuItem value="United Kingdom">United Kingdom</MenuItem>
                      <MenuItem value="Italy">Italy</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" gutterBottom>
                    Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
                  </Typography>
                  <Slider
                    value={filters.priceRange}
                    onChange={(e, newValue) => setFilters(prev => ({ ...prev, priceRange: newValue }))}
                    valueLabelDisplay="auto"
                    min={0}
                    max={1000}
                    step={25}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" gutterBottom>
                    Minimum Rating: {filters.rating}★
                  </Typography>
                  <Slider
                    value={filters.rating}
                    onChange={(e, newValue) => setFilters(prev => ({ ...prev, rating: newValue }))}
                    valueLabelDisplay="auto"
                    min={0}
                    max={5}
                    step={0.5}
                    marks={[
                      { value: 0, label: '0★' },
                      { value: 2.5, label: '2.5★' },
                      { value: 5, label: '5★' },
                    ]}
                  />
                </Grid>
              </Grid>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Paper
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1300,
                maxHeight: 400,
                overflow: 'auto',
                mt: 1,
                border: '1px solid #e0e0e0',
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : results.length > 0 ? (
                <List disablePadding>
                  {results.map((item, index) => (
                    <motion.div
                      key={`${item.type}-${item.id}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <ListItemButton
                        onClick={() => handleItemSelect(item)}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <ListItemIcon>
                          <Avatar
                            sx={{
                              bgcolor: item.type === 'city' ? 'primary.main' : 'secondary.main',
                              width: 32,
                              height: 32,
                            }}
                          >
                            {item.icon}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1">
                                {item.name}
                              </Typography>
                              <Chip
                                label={item.type}
                                size="small"
                                variant="outlined"
                                color={item.type === 'city' ? 'primary' : 'secondary'}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {item.type === 'city' 
                                  ? `${item.country} • Cost Index: ${item.cost_index}/10`
                                  : `${item.category} • ${formatPrice(item.cost_min, item.cost_max)}`
                                }
                              </Typography>
                              {item.rating && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                  <Star sx={{ fontSize: 16, color: '#ffc107' }} />
                                  <Typography variant="body2">
                                    {item.rating}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          }
                        />
                        {item.type === 'activity' && item.duration_hours && (
                          <Box sx={{ textAlign: 'right' }}>
                            <Chip
                              icon={<Schedule />}
                              label={`${item.duration_hours}h`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        )}
                      </ListItemButton>
                      {index < results.length - 1 && <Divider />}
                    </motion.div>
                  ))}
                </List>
              ) : searchTerm.length >= 2 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No results found for "{searchTerm}"
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Try adjusting your search terms or filters
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ p: 2 }}>
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Recent Searches
                      </Typography>
                      <List dense>
                        {recentSearches.map((item, index) => (
                          <ListItemButton
                            key={`recent-${item.id}`}
                            onClick={() => handleItemSelect(item)}
                            sx={{ borderRadius: 1 }}
                          >
                            <ListItemIcon>
                              <Avatar sx={{ width: 24, height: 24, bgcolor: 'grey.300' }}>
                                {item.icon}
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary={item.name}
                              secondary={item.type}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                      <Divider sx={{ my: 1 }} />
                    </>
                  )}

                  {/* Popular Suggestions */}
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Popular Destinations & Activities
                  </Typography>
                  <List dense>
                    {popularSuggestions.slice(0, 6).map((item, index) => (
                      <ListItemButton
                        key={`popular-${item.id}`}
                        onClick={() => handleItemSelect(item)}
                        sx={{ borderRadius: 1 }}
                      >
                        <ListItemIcon>
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              bgcolor: item.type === 'city' ? 'primary.main' : 'secondary.main',
                            }}
                          >
                            {item.icon}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={item.name}
                          secondary={item.type === 'city' ? item.country : item.category}
                        />
                        {item.popularity_score && (
                          <Chip
                            icon={<TrendingUp />}
                            label={item.popularity_score}
                            size="small"
                            variant="outlined"
                            color="success"
                          />
                        )}
                      </ListItemButton>
                    ))}
                  </List>
                </Box>
              )}
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

export default SmartSearch;
