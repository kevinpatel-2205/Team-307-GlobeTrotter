import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Divider,
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
  Tooltip,
  Fab,
  Collapse,
} from '@mui/material';
import {
  DragIndicator,
  Schedule,
  LocationOn,
  CurrencyRupee,
  Edit,
  Delete,
  Add,
  ExpandMore,
  ExpandLess,
  Flight,
  Hotel,
  Restaurant,
  LocalActivity,
  DirectionsCar,
} from '@mui/icons-material';

// Sortable Item Component
function SortableItineraryItem({ item, onEdit, onDelete, onToggleExpand, expanded }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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
    });
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          mb: 2,
          border: isDragging ? '2px dashed #1976d2' : '1px solid #e0e0e0',
          backgroundColor: isDragging ? '#f5f5f5' : 'white',
          cursor: isDragging ? 'grabbing' : 'grab',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {/* Drag Handle */}
            <IconButton
              {...attributes}
              {...listeners}
              size="small"
              sx={{
                cursor: 'grab',
                '&:active': { cursor: 'grabbing' },
                color: 'text.secondary',
              }}
            >
              <DragIndicator />
            </IconButton>

            {/* Category Icon */}
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: `${getCategoryColor(item.category)}.main`,
              }}
            >
              {getCategoryIcon(item.category)}
            </Avatar>

            {/* Content */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                  {item.title}
                </Typography>
                <Chip
                  label={item.category}
                  size="small"
                  color={getCategoryColor(item.category)}
                  variant="outlined"
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                {item.start_time && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Schedule fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(item.start_time)} at {formatTime(item.start_time)}
                      {item.end_time && ` - ${formatTime(item.end_time)}`}
                    </Typography>
                  </Box>
                )}
              </Box>

              {item.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {item.location}
                  </Typography>
                </Box>
              )}

              {item.cost && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <CurrencyRupee fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    ₹{parseFloat(item.cost).toLocaleString('en-IN')}
                  </Typography>
                </Box>
              )}

              <Collapse in={expanded}>
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                  {item.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {item.description}
                    </Typography>
                  )}
                  {item.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Notes: {item.notes}
                    </Typography>
                  )}
                  {item.booking_reference && (
                    <Typography variant="body2" color="text.secondary">
                      Booking: {item.booking_reference}
                    </Typography>
                  )}
                </Box>
              </Collapse>
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Tooltip title={expanded ? "Collapse" : "Expand"}>
                <IconButton size="small" onClick={() => onToggleExpand(item.id)}>
                  {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit(item)}>
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => onDelete(item.id)} color="error">
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Main Drag and Drop Itinerary Component
function DragDropItinerary({ tripId, items = [], onItemsReorder, onItemEdit, onItemDelete, onItemAdd }) {
  const [itineraryItems, setItineraryItems] = useState(items);
  const [activeId, setActiveId] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setItineraryItems(items);
  }, [items]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = itineraryItems.findIndex(item => item.id === active.id);
      const newIndex = itineraryItems.findIndex(item => item.id === over.id);

      const newItems = arrayMove(itineraryItems, oldIndex, newIndex);
      setItineraryItems(newItems);

      // Call parent callback to save the new order
      if (onItemsReorder) {
        onItemsReorder(newItems);
      }
    }

    setActiveId(null);
  };

  const handleToggleExpand = (itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  const handleDelete = (itemId) => {
    if (onItemDelete) {
      onItemDelete(itemId);
    }
  };

  const handleAddNew = () => {
    setAddDialogOpen(true);
  };

  const activeItem = itineraryItems.find(item => item.id === activeId);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          Trip Itinerary
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddNew}
          sx={{ borderRadius: 2 }}
        >
          Add Item
        </Button>
      </Box>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={itineraryItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {itineraryItems.map((item) => (
              <SortableItineraryItem
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleExpand={handleToggleExpand}
                expanded={expandedItems.has(item.id)}
              />
            ))}
          </AnimatePresence>
        </SortableContext>

        <DragOverlay>
          {activeItem ? (
            <Card sx={{ opacity: 0.8, transform: 'rotate(5deg)' }}>
              <CardContent>
                <Typography variant="h6">{activeItem.title}</Typography>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      {itineraryItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card sx={{ textAlign: 'center', py: 6, backgroundColor: '#f9f9f9' }}>
            <CardContent>
              <Schedule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No itinerary items yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start building your trip by adding flights, hotels, activities, and more!
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddNew}
                size="large"
              >
                Add Your First Item
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Floating Add Button */}
      <Fab
        color="primary"
        aria-label="add item"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={handleAddNew}
      >
        <Add />
      </Fab>
    </Box>
  );
}

export { DragDropItinerary, SortableItineraryItem };
