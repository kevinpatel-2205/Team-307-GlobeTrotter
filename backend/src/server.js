const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config();

// Import security middleware
const {
  rateLimiters,
  sanitizeInput,
  securityHeaders,
  preventSQLInjection,
  hpp
} = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const cityRoutes = require('./routes/cityRoutes');
const activityRoutes = require('./routes/activityRoutes');
const itineraryRoutes = require('./routes/itineraryRoutes');
const tripManagementRoutes = require('./routes/tripManagementRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Create Express app and HTTP server
const app = express();
const server = createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https:", "wss:"],
    },
  },
}));

// Additional security headers
app.use(securityHeaders);

// Prevent parameter pollution
app.use(hpp);

// Sanitize input to prevent NoSQL injection
app.use(mongoSanitize());

// XSS protection and input sanitization
app.use(sanitizeInput);

// SQL injection prevention
app.use(preventSQLInjection);

// Rate limiting for authentication endpoints
app.use('/api/auth', rateLimiters.auth);

// General API rate limiting
app.use('/api', rateLimiters.api);

// Admin API rate limiting
app.use('/api/admin', rateLimiters.admin);

// CORS configuration - optimized for development
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'http://localhost:3000', // React default
      'http://localhost:3001'  // Alternative React port
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      // In development, allow unknown origins but log them
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400 // 24 hours
}));

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Debug middleware for CORS issues
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'none'}`);
  if (req.method === 'OPTIONS') {
    console.log('✈️  Preflight request detected');
  }
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.join(__dirname, '..', uploadDir)));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'GlobeTrotter API',
    version: '1.0.0'
  });
});

// Make io available to routes
app.set('io', io);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/itinerary', itineraryRoutes);
app.use('/api/trips', tripManagementRoutes); // Trip management routes (combined functionality)
app.use('/api/admin', adminRoutes); // Admin routes

// Trip-specific itinerary routes
const ItineraryController = require('./controllers/itineraryController');
const { authenticateToken } = require('./middleware/auth');
app.get('/api/trips/:tripId/itinerary', authenticateToken, ItineraryController.getTripItinerary);
app.post('/api/trips/:tripId/itinerary', authenticateToken, ItineraryController.createItineraryItem);
app.put('/api/trips/:tripId/itinerary/reorder', authenticateToken, ItineraryController.reorderItineraryItems);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Join user to their personal room for trip updates
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`👤 User ${userId} joined their room`);
  });

  // Handle trip creation events
  socket.on('trip-created', (data) => {
    console.log('📝 Trip created:', data.tripId);
    // Broadcast to user's room
    io.to(`user-${data.userId}`).emit('trip-update', {
      type: 'created',
      trip: data.trip
    });
  });

  // Handle trip updates
  socket.on('trip-updated', (data) => {
    console.log('✏️ Trip updated:', data.tripId);
    io.to(`user-${data.userId}`).emit('trip-update', {
      type: 'updated',
      trip: data.trip
    });
  });

  // Handle trip deletion
  socket.on('trip-deleted', (data) => {
    console.log('🗑️ Trip deleted:', data.tripId);
    io.to(`user-${data.userId}`).emit('trip-update', {
      type: 'deleted',
      tripId: data.tripId
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'File too large. Maximum size is 5MB.'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      message: 'Unexpected file field.'
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`🚀 GlobeTrotter API server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔌 Socket.IO enabled for real-time updates`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
