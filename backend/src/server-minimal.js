const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Create Express app
const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

// Simple auth routes for testing
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'test@example.com' && password === 'password123') {
    res.json({
      message: 'Login successful',
      user: {
        id: 1,
        fullName: 'Test User',
        email: 'test@example.com',
        avatarPath: null
      },
      token: 'test-jwt-token'
    });
  } else {
    res.status(401).json({
      message: 'Invalid credentials',
      error: 'INVALID_CREDENTIALS'
    });
  }
});

// Simple trips endpoint for testing
app.get('/api/trips', (req, res) => {
  res.json({
    trips: [
      {
        id: 1,
        title: 'Sample Trip',
        description: 'A sample trip for testing',
        start_date: '2024-12-01',
        end_date: '2024-12-10',
        status: 'planning',
        city_count: 2,
        activity_count: 5,
        total_cost: 1500
      }
    ]
  });
});

app.post('/api/trips', (req, res) => {
  const { title, description, startDate, endDate, budget } = req.body;
  
  const trip = {
    id: Date.now(),
    title,
    description,
    start_date: startDate,
    end_date: endDate,
    budget: budget ? parseFloat(budget) : null,
    status: 'planning',
    city_count: 0,
    activity_count: 0,
    total_cost: 0,
    created_at: new Date().toISOString()
  };
  
  res.status(201).json({
    message: 'Trip created successfully',
    trip
  });
});

// Popular cities endpoint
app.get('/api/cities/popular', (req, res) => {
  res.json({
    cities: [
      {
        id: 1,
        name: 'Paris',
        country: 'France',
        cost_index: 8.5,
        popularity_score: 95,
        description: 'The City of Light, famous for its art, fashion, and cuisine',
        image_url: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=500'
      },
      {
        id: 2,
        name: 'Tokyo',
        country: 'Japan',
        cost_index: 9.2,
        popularity_score: 90,
        description: 'A bustling metropolis blending traditional and modern culture',
        image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500'
      }
    ]
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
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
});

// Start server
const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`🚀 GlobeTrotter API server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
