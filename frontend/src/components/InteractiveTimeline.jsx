import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Button,
  Slider,
  FormControlLabel,
  Switch,
  Paper,
  Grid,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Schedule,
  Flight,
  Hotel,
  Restaurant,
  LocalActivity,
  DirectionsCar,
  ZoomIn,
  ZoomOut,
  ViewDay,
  ViewWeek,
  CalendarMonth,
} from '@mui/icons-material';

function InteractiveTimeline({ itineraryItems = [], onItemClick, onTimeChange }) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState('day'); // 'hour', 'day', 'week'
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'flight': return <Flight />;
      case 'hotel': return <Hotel />;
      case 'restaurant': return <Restaurant />;
      case 'activity': return <LocalActivity />;
      case 'transport': return <DirectionsCar />;
      default: return <Schedule />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'flight': return 'primary';
      case 'hotel': return 'secondary';
      case 'restaurant': return 'success';
      case 'activity': return 'warning';
      case 'transport': return 'info';
      default: return 'default';
    }
  };

  const formatTime = (datetime) => {
    if (!datetime) return '';
    return new Date(datetime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (datetime) => {
    if (!datetime) return '';
    return new Date(datetime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const groupItemsByDay = () => {
    const grouped = {};
    itineraryItems.forEach(item => {
      if (item.start_time) {
        const day = new Date(item.start_time).toDateString();
        if (!grouped[day]) {
          grouped[day] = [];
        }
        grouped[day].push(item);
      }
    });

    // Sort items within each day by start time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    });

    return grouped;
  };

  const itemsByDay = groupItemsByDay();
  const sortedDays = Object.keys(itemsByDay).sort((a, b) => new Date(a) - new Date(b));

  return (
    <Box>
      {/* Timeline Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" gutterBottom>
              View Mode
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant={viewMode === 'day' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('day')}
                startIcon={<ViewDay />}
              >
                Day
              </Button>
              <Button
                size="small"
                variant={viewMode === 'week' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('week')}
                startIcon={<ViewWeek />}
              >
                Week
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" gutterBottom>
              Zoom Level: {zoomLevel.toFixed(1)}x
            </Typography>
            <Slider
              value={zoomLevel}
              onChange={(e, newValue) => setZoomLevel(newValue)}
              min={0.5}
              max={3}
              step={0.1}
              valueLabelDisplay="auto"
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={showAllDetails}
                  onChange={(e) => setShowAllDetails(e.target.checked)}
                />
              }
              label="Show Details"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              onClick={() => setZoomLevel(1)}
              size="small"
            >
              Reset View
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Interactive Timeline */}
      <Box sx={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
        {sortedDays.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card sx={{ textAlign: 'center', py: 6 }}>
              <CardContent>
                <Schedule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No timeline items yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add activities to see your trip timeline
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Timeline position="alternate">
            <AnimatePresence>
              {sortedDays.map((day, dayIndex) => (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, x: dayIndex % 2 === 0 ? -50 : 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: dayIndex * 0.1 }}
                >
                  {/* Day Header */}
                  <TimelineItem>
                    <TimelineOppositeContent sx={{ m: 'auto 0' }} variant="body2" color="text.secondary">
                      {formatDate(itemsByDay[day][0].start_time)}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color="primary" variant="outlined">
                        <CalendarMonth />
                      </TimelineDot>
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <Typography variant="h6" component="span">
                        Day {dayIndex + 1}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {itemsByDay[day].length} activities planned
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>

                  {/* Day Items */}
                  {itemsByDay[day].map((item, itemIndex) => (
                    <TimelineItem key={item.id}>
                      <TimelineOppositeContent sx={{ m: 'auto 0' }} variant="body2" color="text.secondary">
                        {formatTime(item.start_time)}
                        {item.end_time && ` - ${formatTime(item.end_time)}`}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot color={getCategoryColor(item.category)}>
                          {getCategoryIcon(item.category)}
                        </TimelineDot>
                        {itemIndex < itemsByDay[day].length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent sx={{ py: '12px', px: 2 }}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card
                            sx={{
                              cursor: 'pointer',
                              '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
                            }}
                            onClick={() => onItemClick && onItemClick(item)}
                          >
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography variant="h6" component="h3">
                                  {item.title}
                                </Typography>
                                <Chip
                                  label={item.category}
                                  size="small"
                                  color={getCategoryColor(item.category)}
                                  variant="outlined"
                                />
                              </Box>

                              {item.location && (
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  📍 {item.location}
                                </Typography>
                              )}

                              {showAllDetails && (
                                <Box sx={{ mt: 1 }}>
                                  {item.description && (
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      {item.description}
                                    </Typography>
                                  )}
                                  {item.cost && (
                                    <Chip
                                      label={`$${item.cost}`}
                                      size="small"
                                      color="primary"
                                      icon={<AttachMoney />}
                                    />
                                  )}
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </motion.div>
              ))}
            </AnimatePresence>
          </Timeline>
        )}
      </Box>
    </Box>
  );
}

export default InteractiveTimeline;
