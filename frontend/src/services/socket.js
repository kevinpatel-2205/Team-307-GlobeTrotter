import { io } from 'socket.io-client';
import { tokenUtils } from '../api/client.js';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    const token = tokenUtils.getToken();
    const user = tokenUtils.getUser();

    if (!token || !user) {
      console.warn('Cannot connect to socket: No authentication token or user data');
      return null;
    }

    this.socket = io(import.meta.env.VITE_API_BASE_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to server');
      this.isConnected = true;
      
      // Join user's personal room
      this.socket.emit('join-user-room', user.id);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      this.isConnected = false;
    });

    // Handle trip updates
    this.socket.on('trip-update', (data) => {
      console.log('📝 Trip update received:', data);
      this.emit('tripUpdate', data);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Event emitter functionality
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in socket event callback:', error);
        }
      });
    }
  }

  // Trip-specific methods
  emitTripCreated(trip) {
    if (this.socket && this.isConnected) {
      const user = tokenUtils.getUser();
      this.socket.emit('trip-created', {
        tripId: trip.id,
        userId: user.id,
        trip
      });
    }
  }

  emitTripUpdated(trip) {
    if (this.socket && this.isConnected) {
      const user = tokenUtils.getUser();
      this.socket.emit('trip-updated', {
        tripId: trip.id,
        userId: user.id,
        trip
      });
    }
  }

  emitTripDeleted(tripId) {
    if (this.socket && this.isConnected) {
      const user = tokenUtils.getUser();
      this.socket.emit('trip-deleted', {
        tripId,
        userId: user.id
      });
    }
  }

  // Itinerary-specific methods
  emitItineraryUpdate(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('itinerary-updated', data);
    }
  }

  // Utility methods
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  getSocket() {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
