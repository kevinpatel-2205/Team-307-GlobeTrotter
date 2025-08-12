import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Paper,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Share,
  Preview,
  Add,
  Schedule,
  Map,
  AttachMoney,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropItinerary } from '../components/DragDropItinerary.jsx';
import { tripAPI, itineraryAPI, tokenUtils } from '../api/client.js';
import socketService from '../services/socket.js';

function ItineraryBuilder() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [itineraryItems, setItineraryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Form state for adding/editing items
  const [itemForm, setItemForm] = useState({
    title: '',
    description: '',
    category: 'activity',
    location: '',
    start_time: '',
    end_time: '',
    cost: '',
    notes: '',
    booking_reference: '',
  });

  useEffect(() => {
    loadTripData();
    
    // Connect to Socket.IO for real-time updates
    socketService.connect();
    
    // Listen for itinerary updates
    const handleItineraryUpdate = (data) => {
      if (data.tripId === tripId) {
        loadItineraryItems();
        showSnackbar('Itinerary updated in real-time!');
      }
    };

    socketService.on('itineraryUpdate', handleItineraryUpdate);

    return () => {
      socketService.off('itineraryUpdate', handleItineraryUpdate);
    };
  }, [tripId]);

  const loadTripData = async () => {
    try {
      setLoading(true);
      const [tripResponse, itemsResponse] = await Promise.all([
        tripAPI.getTripById(tripId),
        itineraryAPI.getItineraryItems(tripId)
      ]);

      setTrip(tripResponse.data.trip);
      setItineraryItems(itemsResponse.data.itinerary || []);
    } catch (error) {
      console.error('Failed to load trip data:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load trip data. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadItineraryItems = async () => {
    try {
      const response = await itineraryAPI.getItineraryItems(tripId);
      setItineraryItems(response.data.itinerary || []);
    } catch (error) {
      console.error('Failed to load itinerary items:', error);
    }
  };

  const handleItemsReorder = async (newItems) => {
    try {
      setSaving(true);
      
      // Update order_index for each item
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        order_index: index
      }));

      await itineraryAPI.reorderItems(tripId, updatedItems);
      setItineraryItems(updatedItems);
      
      // Emit Socket.IO event for real-time updates
      socketService.emitItineraryUpdate({
        tripId,
        type: 'reorder',
        items: updatedItems
      });

      showSnackbar('Itinerary reordered successfully!');
    } catch (error) {
      console.error('Failed to reorder items:', error);
      showSnackbar('Failed to save new order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleItemAdd = async () => {
    try {
      setSaving(true);
      const response = await itineraryAPI.addItem(tripId, {
        ...itemForm,
        order_index: itineraryItems.length
      });
      
      const newItem = response.data.itineraryItem || response.data.item;
      setItineraryItems(prev => [...prev, newItem]);
      
      // Emit Socket.IO event
      socketService.emitItineraryUpdate({
        tripId,
        type: 'add',
        item: newItem
      });

      setAddDialogOpen(false);
      resetItemForm();
      showSnackbar('Item added successfully!');
    } catch (error) {
      console.error('Failed to add item:', error);
      showSnackbar('Failed to add item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleItemEdit = async () => {
    try {
      setSaving(true);
      const response = await itineraryAPI.updateItem(editingItem.id, itemForm);
      
      const updatedItem = response.data.item;
      setItineraryItems(prev => 
        prev.map(item => item.id === updatedItem.id ? updatedItem : item)
      );
      
      // Emit Socket.IO event
      socketService.emitItineraryUpdate({
        tripId,
        type: 'update',
        item: updatedItem
      });

      setEditDialogOpen(false);
      setEditingItem(null);
      resetItemForm();
      showSnackbar('Item updated successfully!');
    } catch (error) {
      console.error('Failed to update item:', error);
      showSnackbar('Failed to update item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleItemDelete = async (itemId) => {
    try {
      await itineraryAPI.deleteItem(itemId);
      setItineraryItems(prev => prev.filter(item => item.id !== itemId));
      
      // Emit Socket.IO event
      socketService.emitItineraryUpdate({
        tripId,
        type: 'delete',
        itemId
      });

      showSnackbar('Item deleted successfully!');
    } catch (error) {
      console.error('Failed to delete item:', error);
      showSnackbar('Failed to delete item. Please try again.');
    }
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setItemForm({
      title: item.title || '',
      description: item.description || '',
      category: item.category || 'activity',
      location: item.location || '',
      start_time: item.start_time ? item.start_time.slice(0, 16) : '',
      end_time: item.end_time ? item.end_time.slice(0, 16) : '',
      cost: item.cost || '',
      notes: item.notes || '',
      booking_reference: item.booking_reference || '',
    });
    setEditDialogOpen(true);
  };

  const resetItemForm = () => {
    setItemForm({
      title: '',
      description: '',
      category: 'activity',
      location: '',
      start_time: '',
      end_time: '',
      cost: '',
      notes: '',
      booking_reference: '',
    });
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setItemForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotalCost = () => {
    return itineraryItems.reduce((total, item) => total + (parseFloat(item.cost) || 0), 0);
  };

  const getItemsByDay = () => {
    const itemsByDay = {};
    itineraryItems.forEach(item => {
      if (item.start_time) {
        const day = new Date(item.start_time).toDateString();
        if (!itemsByDay[day]) {
          itemsByDay[day] = [];
        }
        itemsByDay[day].push(item);
      }
    });
    return itemsByDay;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Schedule sx={{ fontSize: 48, color: 'primary.main' }} />
        </motion.div>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/trips')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {trip?.title} - Itinerary Builder
          </Typography>
          <Button
            color="inherit"
            startIcon={<Save />}
            disabled={saving}
            sx={{ mr: 1 }}
          >
            {saving ? 'Saving...' : 'Auto-saved'}
          </Button>
          <Button
            color="inherit"
            startIcon={<Share />}
            onClick={() => navigate(`/trips/${tripId}/share`)}
          >
            Share
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        {/* Trip Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h4" component="h1" gutterBottom>
                  {trip?.title}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {trip?.description}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" gutterBottom>
                    Total Budget
                  </Typography>
                  <Chip
                    label={`₹${Number(calculateTotalCost() || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`}
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>

        {/* View Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
            variant="fullWidth"
          >
            <Tab icon={<Schedule />} label="Timeline View" />
            <Tab icon={<Map />} label="Day by Day" />
            <Tab icon={<AttachMoney />} label="Budget View" />
          </Tabs>
        </Paper>

        {/* Content based on selected tab */}
        <AnimatePresence mode="wait">
          {currentTab === 0 && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DragDropItinerary
                tripId={tripId}
                items={itineraryItems}
                onItemsReorder={handleItemsReorder}
                onItemEdit={openEditDialog}
                onItemDelete={handleItemDelete}
                onItemAdd={() => setAddDialogOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Container>

      {/* Add Item Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Itinerary Item</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={itemForm.title}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={itemForm.category}
                  onChange={handleFormChange}
                  label="Category"
                >
                  <MenuItem value="flight">Flight</MenuItem>
                  <MenuItem value="hotel">Hotel</MenuItem>
                  <MenuItem value="restaurant">Restaurant</MenuItem>
                  <MenuItem value="activity">Activity</MenuItem>
                  <MenuItem value="transport">Transport</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                name="description"
                value={itemForm.description}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={itemForm.location}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Start Time"
                name="start_time"
                value={itemForm.start_time}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="End Time"
                name="end_time"
                value={itemForm.end_time}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Cost ($)"
                name="cost"
                value={itemForm.cost}
                onChange={handleFormChange}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Booking Reference"
                name="booking_reference"
                value={itemForm.booking_reference}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes"
                name="notes"
                value={itemForm.notes}
                onChange={handleFormChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleItemAdd}
            variant="contained"
            disabled={!itemForm.title || saving}
          >
            {saving ? 'Adding...' : 'Add Item'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Itinerary Item</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={itemForm.title}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={itemForm.category}
                  onChange={handleFormChange}
                  label="Category"
                >
                  <MenuItem value="flight">Flight</MenuItem>
                  <MenuItem value="hotel">Hotel</MenuItem>
                  <MenuItem value="restaurant">Restaurant</MenuItem>
                  <MenuItem value="activity">Activity</MenuItem>
                  <MenuItem value="transport">Transport</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                name="description"
                value={itemForm.description}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={itemForm.location}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Start Time"
                name="start_time"
                value={itemForm.start_time}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="End Time"
                name="end_time"
                value={itemForm.end_time}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Cost ($)"
                name="cost"
                value={itemForm.cost}
                onChange={handleFormChange}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Booking Reference"
                name="booking_reference"
                value={itemForm.booking_reference}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes"
                name="notes"
                value={itemForm.notes}
                onChange={handleFormChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleItemEdit}
            variant="contained"
            disabled={!itemForm.title || saving}
          >
            {saving ? 'Updating...' : 'Update Item'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}

export default ItineraryBuilder;
