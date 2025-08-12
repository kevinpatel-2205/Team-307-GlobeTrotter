import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  InputAdornment,
  Paper,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import {
  TravelExplore,
  ArrowBack,
  CloudUpload,
  CalendarToday,
  AttachMoney,
  Description,
  Title,
  LocationOn,
  Flight,
  Hotel,
  Restaurant,
  LocalActivity,
  Group,
  Public,
  Lock,
  Star,
  Add,
  Remove,
  Map,
  Schedule,
  Insights,
  AutoAwesome,
  TrendingUp,
  Recommend,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import { tripAPI, tokenUtils } from '../api/client.js';
import socketService from '../services/socket.js';

function CreateTrip() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  // Enhanced form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
    coverPhoto: null,
    destination: '',
    travelStyle: 'leisure',
    groupSize: 1,
    privacy: 'public',
    tags: [],
    estimatedCost: 0,
    currency: 'INR'
  });

  // Advanced features
  const [coverPhotoPreview, setCoverPhotoPreview] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [budgetBreakdown, setBudgetBreakdown] = useState({
    accommodation: 40,
    transportation: 25,
    food: 20,
    activities: 10,
    miscellaneous: 5
  });
  const [recommendations, setRecommendations] = useState([]);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [costEstimate, setCostEstimate] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [smartRecommendations, setSmartRecommendations] = useState([]);

  const user = tokenUtils.getUser();

  // Advanced trip creation steps
  const steps = [
    'Basic Information',
    'Destination & Dates',
    'Budget Planning',
    'Trip Details',
    'Review & Create'
  ];

  // Load destinations and recommendations on component mount
  useEffect(() => {
    loadDestinations();
    generateSmartRecommendations();
  }, []);

  const loadDestinations = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/cities/popular');
      const data = await response.json();
      setDestinations(data.cities || []);
    } catch (error) {
      console.error('Failed to load destinations:', error);
    }
  };

  const generateSmartRecommendations = () => {
    const recommendations = [
      {
        type: 'budget',
        title: 'Budget-Friendly Tips',
        suggestions: [
          'Book flights 6-8 weeks in advance for best prices',
          'Consider staying in hostels or Airbnb for accommodation',
          'Use public transportation instead of taxis',
          'Eat at local restaurants rather than tourist spots'
        ]
      },
      {
        type: 'timing',
        title: 'Best Time to Visit',
        suggestions: [
          'Check seasonal weather patterns for your destination',
          'Avoid peak tourist seasons for better prices',
          'Consider local holidays and festivals',
          'Book accommodations early for popular destinations'
        ]
      },
      {
        type: 'activities',
        title: 'Must-Do Activities',
        suggestions: [
          'Research free walking tours and museums',
          'Book popular attractions in advance',
          'Try local food specialties',
          'Explore off-the-beaten-path neighborhoods'
        ]
      }
    ];
    setSmartRecommendations(recommendations);
  };

  const calculateCostEstimate = (destination, duration, groupSize, style) => {
    // Smart cost estimation based on destination and preferences (Indian pricing in INR)
    const baseCosts = {
      'budget': { daily: 2500, accommodation: 1200, food: 800, activities: 500 },
      'leisure': { daily: 6000, accommodation: 3000, food: 1500, activities: 1500 },
      'luxury': { daily: 15000, accommodation: 8000, food: 3500, activities: 3500 }
    };

    const cost = baseCosts[style] || baseCosts.leisure;
    const totalDays = duration || 7;
    const estimated = {
      accommodation: cost.accommodation * totalDays * groupSize,
      food: cost.food * totalDays * groupSize,
      activities: cost.activities * totalDays * groupSize,
      transportation: 8000 * groupSize, // Base domestic flight/train cost in INR
      total: cost.daily * totalDays * groupSize
    };

    setCostEstimate(estimated);
    return estimated;
  };

  const validateStep = (step) => {
    const errors = {};

    switch (step) {
      case 0: // Basic Information
        if (!formData.title.trim()) errors.title = 'Trip title is required';
        if (!formData.description.trim()) errors.description = 'Description is required';
        break;
      case 1: // Destination & Dates
        if (!formData.destination) errors.destination = 'Destination is required';
        if (!formData.startDate) errors.startDate = 'Start date is required';
        if (!formData.endDate) errors.endDate = 'End date is required';
        if (new Date(formData.startDate) >= new Date(formData.endDate)) {
          errors.endDate = 'End date must be after start date';
        }
        break;
      case 2: // Budget Planning
        if (!formData.budget || formData.budget <= 0) errors.budget = 'Budget must be greater than 0';
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);

      // Generate cost estimate when moving to budget step
      if (activeStep === 1) {
        const duration = Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24));
        calculateCostEstimate(formData.destination, duration, formData.groupSize, formData.travelStyle);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({
          type: 'error',
          text: 'Please select an image file'
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({
          type: 'error',
          text: 'File size must be less than 5MB'
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        coverPhoto: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.title.trim()) {
      errors.push('Trip title is required');
    }

    if (!formData.startDate) {
      errors.push('Start date is required');
    }

    if (!formData.endDate) {
      errors.push('End date is required');
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (start >= end) {
        errors.push('End date must be after start date');
      }

      if (start < new Date().setHours(0, 0, 0, 0)) {
        errors.push('Start date cannot be in the past');
      }
    }

    if (formData.budget && (isNaN(formData.budget) || parseFloat(formData.budget) < 0)) {
      errors.push('Budget must be a valid positive number');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setMessage({
        type: 'error',
        text: errors.join('. ')
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await tripAPI.createTrip(formData);
      const { trip } = response.data;

      // Emit Socket.IO event for real-time updates
      socketService.emitTripCreated(trip);

      setMessage({
        type: 'success',
        text: 'Trip created successfully! Redirecting...'
      });

      // Redirect to the new trip after a short delay
      setTimeout(() => {
        navigate(`/trips/${trip.id}`);
      }, 1500);

    } catch (error) {
      console.error('Create trip error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create trip. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    navigate(-1);
  };

  const calculateDuration = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBackToList}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <TravelExplore sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Create New Trip
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
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Plan Your Next Adventure
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Tell us about your trip and we'll help you create the perfect itinerary
          </Typography>

          {message && (
            <Alert 
              severity={message.type} 
              sx={{ mb: 3 }}
              onClose={() => setMessage(null)}
            >
              {message.text}
            </Alert>
          )}

          {/* Advanced Stepper Interface */}
          <Box sx={{ mb: 4 }}>
            <Stepper activeStep={activeStep} orientation="horizontal">
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <form onSubmit={handleSubmit}>
            {/* Step 0: Basic Information */}
            {activeStep === 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Basic Trip Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Trip Title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., European Adventure 2024"
                      error={!!validationErrors.title}
                      helperText={validationErrors.title}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Title />
                          </InputAdornment>
                        ),
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Trip Description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your trip plans, goals, and what you're excited about..."
                      error={!!validationErrors.description}
                      helperText={validationErrors.description}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Description />
                          </InputAdornment>
                        ),
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Travel Style</InputLabel>
                      <Select
                        name="travelStyle"
                        value={formData.travelStyle}
                        onChange={handleInputChange}
                        label="Travel Style"
                      >
                        <MenuItem value="budget">Budget Traveler</MenuItem>
                        <MenuItem value="leisure">Leisure Travel</MenuItem>
                        <MenuItem value="luxury">Luxury Experience</MenuItem>
                        <MenuItem value="adventure">Adventure Seeker</MenuItem>
                        <MenuItem value="cultural">Cultural Explorer</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Group Size"
                      name="groupSize"
                      value={formData.groupSize}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Group />
                          </InputAdornment>
                        ),
                        inputProps: { min: 1, max: 20 }
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Step 1: Destination & Dates */}
            {activeStep === 1 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Destination & Travel Dates
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Autocomplete
                      options={destinations}
                      getOptionLabel={(option) => `${option.name}, ${option.country}`}
                      value={selectedDestination}
                      onChange={(event, newValue) => {
                        setSelectedDestination(newValue);
                        setFormData(prev => ({ ...prev, destination: newValue ? `${newValue.name}, ${newValue.country}` : '' }));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Destination"
                          placeholder="Search for cities..."
                          error={!!validationErrors.destination}
                          helperText={validationErrors.destination}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocationOn />
                              </InputAdornment>
                            ),
                          }}
                          required
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Start Date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      error={!!validationErrors.startDate}
                      helperText={validationErrors.startDate || "Select current date or future date"}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarToday />
                          </InputAdornment>
                        ),
                      }}
                      inputProps={{
                        min: new Date().toISOString().split('T')[0] // Today's date as minimum
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="End Date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      error={!!validationErrors.endDate}
                      helperText={validationErrors.endDate || "Select end date (must be after start date)"}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarToday />
                          </InputAdornment>
                        ),
                      }}
                      inputProps={{
                        min: formData.startDate || new Date().toISOString().split('T')[0] // Start date or today as minimum
                      }}
                      required
                    />
                  </Grid>

                  {/* Smart Recommendations */}
                  {selectedDestination && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Info sx={{ mr: 1 }} />
                          <Typography variant="h6">Destination Insights</Typography>
                        </Box>
                        <Typography variant="body2">
                          {selectedDestination.name} is known for {selectedDestination.description || 'its amazing attractions and culture'}.
                          Best time to visit is typically during spring and fall months.
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}

            {/* Step 2: Budget Planning */}
            {activeStep === 2 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Budget Planning
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Total Budget"
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      error={!!validationErrors.budget}
                      helperText={validationErrors.budget}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AttachMoney />
                          </InputAdornment>
                        ),
                        inputProps: { min: 0 }
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Currency</InputLabel>
                      <Select
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        label="Currency"
                      >
                        <MenuItem value="INR">INR (₹)</MenuItem>
                        <MenuItem value="USD">USD ($)</MenuItem>
                        <MenuItem value="EUR">EUR (€)</MenuItem>
                        <MenuItem value="GBP">GBP (£)</MenuItem>
                        <MenuItem value="AED">AED (د.إ)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Budget Breakdown */}
                  {costEstimate && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
                        <Typography variant="h6" gutterBottom>
                          Estimated Cost Breakdown
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Hotel sx={{ fontSize: 30, mb: 1 }} />
                              <Typography variant="h6">₹{costEstimate.accommodation.toLocaleString('en-IN')}</Typography>
                              <Typography variant="body2">Accommodation</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Flight sx={{ fontSize: 30, mb: 1 }} />
                              <Typography variant="h6">₹{costEstimate.transportation.toLocaleString('en-IN')}</Typography>
                              <Typography variant="body2">Transportation</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Restaurant sx={{ fontSize: 30, mb: 1 }} />
                              <Typography variant="h6">₹{costEstimate.food.toLocaleString('en-IN')}</Typography>
                              <Typography variant="body2">Food & Dining</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                              <LocalActivity sx={{ fontSize: 30, mb: 1 }} />
                              <Typography variant="h6">₹{costEstimate.activities.toLocaleString('en-IN')}</Typography>
                              <Typography variant="body2">Activities</Typography>
                            </Box>
                          </Grid>
                        </Grid>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h5" sx={{ textAlign: 'center' }}>
                          Total Estimated: ₹{costEstimate.total.toLocaleString('en-IN')}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}

            {/* Step 3: Trip Details */}
            {activeStep === 3 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Trip Details & Preferences
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.privacy === 'public'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            privacy: e.target.checked ? 'public' : 'private'
                          }))}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {formData.privacy === 'public' ? <Public sx={{ mr: 1 }} /> : <Lock sx={{ mr: 1 }} />}
                          {formData.privacy === 'public' ? 'Public Trip' : 'Private Trip'}
                        </Box>
                      }
                    />
                    <Typography variant="body2" color="textSecondary">
                      {formData.privacy === 'public'
                        ? 'Other users can discover and get inspired by your trip'
                        : 'Only you can see this trip'
                      }
                    </Typography>
                  </Grid>

                  {/* Cover Photo Upload */}
                  <Grid item xs={12}>
                    <Paper
                      sx={{
                        p: 3,
                        border: '2px dashed',
                        borderColor: 'primary.main',
                        textAlign: 'center',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => document.getElementById('cover-photo-input').click()}
                    >
                      <input
                        id="cover-photo-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      {coverPhotoPreview ? (
                        <Box>
                          <img
                            src={coverPhotoPreview}
                            alt="Cover preview"
                            style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
                          />
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Click to change cover photo
                          </Typography>
                        </Box>
                      ) : (
                        <Box>
                          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                          <Typography variant="h6" gutterBottom>
                            Upload Cover Photo
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Choose a beautiful photo that represents your trip
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Step 4: Review & Create */}
            {activeStep === 4 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Review Your Trip
                </Typography>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">Trip Title</Typography>
                      <Typography variant="h6">{formData.title}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">Destination</Typography>
                      <Typography variant="h6">{formData.destination}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">Dates</Typography>
                      <Typography variant="body1">
                        {formData.startDate} to {formData.endDate}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">Budget</Typography>
                      <Typography variant="h6">
                        {formData.currency === 'INR' ? '₹' :
                         formData.currency === 'EUR' ? '€' :
                         formData.currency === 'GBP' ? '£' :
                         formData.currency === 'AED' ? 'د.إ' : '$'}{formData.budget} {formData.currency}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">Travel Style</Typography>
                      <Chip label={formData.travelStyle} color="primary" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">Group Size</Typography>
                      <Typography variant="body1">{formData.groupSize} {formData.groupSize === 1 ? 'person' : 'people'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                      <Typography variant="body1">{formData.description}</Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Smart Recommendations */}
                <Accordion>
                  <AccordionSummary expandIcon={<AutoAwesome />}>
                    <Typography variant="h6">Smart Travel Tips</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {smartRecommendations.map((rec, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {rec.title}
                        </Typography>
                        <List dense>
                          {rec.suggestions.map((suggestion, idx) => (
                            <ListItem key={idx}>
                              <ListItemIcon>
                                <CheckCircle color="success" />
                              </ListItemIcon>
                              <ListItemText primary={suggestion} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBack />}
              >
                Back
              </Button>

              <Box sx={{ display: 'flex', gap: 2 }}>
                {activeStep < steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<ArrowBack sx={{ transform: 'rotate(180deg)' }} />}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <LinearProgress /> : <CheckCircle />}
                    sx={{ minWidth: 150 }}
                  >
                    {loading ? 'Creating...' : 'Create Trip'}
                  </Button>
                )}
              </Box>
            </Box>
          </form>

          {/* Smart Recommendations Sidebar */}
          {smartRecommendations.length > 0 && (
            <Paper sx={{ p: 3, mt: 4, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Typography variant="h6" gutterBottom>
                <AutoAwesome sx={{ mr: 1, verticalAlign: 'middle' }} />
                AI Travel Assistant
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Based on your preferences, here are some personalized recommendations:
              </Typography>
              {smartRecommendations.slice(0, 1).map((rec, index) => (
                <Box key={index}>
                  <Typography variant="subtitle1" gutterBottom>
                    {rec.title}
                  </Typography>
                  {rec.suggestions.slice(0, 2).map((suggestion, idx) => (
                    <Typography key={idx} variant="body2" sx={{ mb: 1 }}>
                      • {suggestion}
                    </Typography>
                  ))}
                </Box>
              ))}
            </Paper>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default CreateTrip;
