import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Fab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  LocationOn,
  Flight,
  Hotel,
  Restaurant,
  LocalActivity,
  DirectionsCar,
  ZoomIn,
  ZoomOut,
  MyLocation,
  Layers,
  Route,
  Close,
} from '@mui/icons-material';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for different categories
const createCustomIcon = (category, color = '#1976d2') => {
  const iconHtml = `
    <div style="
      background-color: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">
      <span style="color: white; font-size: 14px;">
        ${getCategorySymbol(category)}
      </span>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const getCategorySymbol = (category) => {
  switch (category) {
    case 'flight': return '✈️';
    case 'hotel': return '🏨';
    case 'restaurant': return '🍽️';
    case 'activity': return '🎯';
    case 'transport': return '🚗';
    default: return '📍';
  }
};

const getCategoryColor = (category) => {
  switch (category) {
    case 'flight': return '#1976d2';
    case 'hotel': return '#9c27b0';
    case 'restaurant': return '#2e7d32';
    case 'activity': return '#ed6c02';
    case 'transport': return '#0288d1';
    default: return '#757575';
  }
};

// Map Controls Component
function MapControls({ onZoomIn, onZoomOut, onFitBounds, onToggleRoute, showRoute }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Tooltip title="Zoom In">
        <Fab size="small" onClick={onZoomIn}>
          <ZoomIn />
        </Fab>
      </Tooltip>
      <Tooltip title="Zoom Out">
        <Fab size="small" onClick={onZoomOut}>
          <ZoomOut />
        </Fab>
      </Tooltip>
      <Tooltip title="Fit All Markers">
        <Fab size="small" onClick={onFitBounds}>
          <MyLocation />
        </Fab>
      </Tooltip>
      <Tooltip title={showRoute ? "Hide Route" : "Show Route"}>
        <Fab 
          size="small" 
          onClick={onToggleRoute}
          color={showRoute ? "primary" : "default"}
        >
          <Route />
        </Fab>
      </Tooltip>
    </Box>
  );
}

// Map Event Handler Component
function MapEventHandler({ onMapReady, markers, showRoute }) {
  const map = useMap();
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  useEffect(() => {
    if (markers.length > 0) {
      // Create route coordinates from markers
      const coords = markers
        .filter(marker => marker.lat && marker.lng)
        .sort((a, b) => a.order_index - b.order_index)
        .map(marker => [marker.lat, marker.lng]);
      
      setRouteCoordinates(coords);

      // Fit map to show all markers
      if (coords.length > 0) {
        const group = new L.featureGroup(
          coords.map(coord => L.marker(coord))
        );
        map.fitBounds(group.getBounds().pad(0.1));
      }
    }
  }, [markers, map]);

  return (
    <>
      {showRoute && routeCoordinates.length > 1 && (
        <Polyline
          positions={routeCoordinates}
          color="#1976d2"
          weight={3}
          opacity={0.7}
          dashArray="10, 10"
        />
      )}
    </>
  );
}

// Main Interactive Map Component
function InteractiveMap({ 
  itineraryItems = [], 
  cities = [], 
  onMarkerClick, 
  height = 400,
  showControls = true,
  showRoute = true 
}) {
  const [map, setMap] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [routeVisible, setRouteVisible] = useState(showRoute);
  const [layersVisible, setLayersVisible] = useState({
    flights: true,
    hotels: true,
    restaurants: true,
    activities: true,
    transport: true,
  });

  // Combine itinerary items and cities into markers
  const markers = [
    ...itineraryItems.map((item, index) => ({
      id: `item-${item.id}`,
      lat: item.latitude || (cities.find(c => c.id === item.city_id)?.latitude),
      lng: item.longitude || (cities.find(c => c.id === item.city_id)?.longitude),
      title: item.title,
      category: item.category,
      description: item.description,
      location: item.location,
      cost: item.cost,
      start_time: item.start_time,
      order_index: item.order_index || index,
      type: 'itinerary',
      data: item,
    })),
    ...cities.map((city, index) => ({
      id: `city-${city.id}`,
      lat: city.latitude,
      lng: city.longitude,
      title: city.name,
      category: 'city',
      description: city.description,
      location: `${city.name}, ${city.country}`,
      cost: null,
      order_index: index + 1000, // Ensure cities appear after itinerary items
      type: 'city',
      data: city,
    }))
  ].filter(marker => marker.lat && marker.lng && layersVisible[marker.category]);

  const handleMarkerClick = (marker) => {
    setSelectedItem(marker);
    setDialogOpen(true);
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
  };

  const handleZoomIn = () => {
    if (map) {
      map.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.zoomOut();
    }
  };

  const handleFitBounds = () => {
    if (map && markers.length > 0) {
      const coords = markers.map(marker => [marker.lat, marker.lng]);
      const group = new L.featureGroup(coords.map(coord => L.marker(coord)));
      map.fitBounds(group.getBounds().pad(0.1));
    }
  };

  const formatTime = (datetime) => {
    if (!datetime) return '';
    return new Date(datetime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ position: 'relative', height, borderRadius: 2, overflow: 'hidden' }}>
      <MapContainer
        center={[40.7128, -74.0060]} // Default to NYC
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        whenCreated={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEventHandler 
          onMapReady={setMap} 
          markers={markers} 
          showRoute={routeVisible}
        />

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={createCustomIcon(marker.category, getCategoryColor(marker.category))}
            eventHandlers={{
              click: () => handleMarkerClick(marker),
            }}
          >
            <Popup>
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="h6" gutterBottom>
                  {marker.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {marker.location}
                </Typography>
                {marker.start_time && (
                  <Typography variant="body2" color="text.secondary">
                    {formatTime(marker.start_time)}
                  </Typography>
                )}
                {marker.cost && (
                  <Chip
                    label={`$${marker.cost}`}
                    size="small"
                    color="primary"
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Controls */}
      {showControls && (
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitBounds={handleFitBounds}
          onToggleRoute={() => setRouteVisible(!routeVisible)}
          showRoute={routeVisible}
        />
      )}

      {/* Layer Toggle */}
      <Paper
        sx={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          p: 2,
          zIndex: 1000,
          maxWidth: 200,
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Map Layers
        </Typography>
        {Object.entries(layersVisible).map(([layer, visible]) => (
          <FormControlLabel
            key={layer}
            control={
              <Switch
                size="small"
                checked={visible}
                onChange={(e) => setLayersVisible(prev => ({
                  ...prev,
                  [layer]: e.target.checked
                }))}
              />
            }
            label={layer.charAt(0).toUpperCase() + layer.slice(1)}
            sx={{ display: 'block', mb: 0.5 }}
          />
        ))}
      </Paper>

      {/* Marker Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        {selectedItem && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: '1.5rem' }}>
                {getCategorySymbol(selectedItem.category)}
              </span>
              {selectedItem.title}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={selectedItem.category}
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Box>
              
              {selectedItem.description && (
                <Typography variant="body1" gutterBottom>
                  {selectedItem.description}
                </Typography>
              )}
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                📍 {selectedItem.location}
              </Typography>
              
              {selectedItem.start_time && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  🕒 {formatTime(selectedItem.start_time)}
                </Typography>
              )}
              
              {selectedItem.cost && (
                <Typography variant="body2" color="text.secondary">
                  💰 ${selectedItem.cost}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
              {selectedItem.type === 'itinerary' && (
                <Button variant="contained" onClick={() => {
                  // Handle edit action
                  setDialogOpen(false);
                }}>
                  Edit Item
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default InteractiveMap;
