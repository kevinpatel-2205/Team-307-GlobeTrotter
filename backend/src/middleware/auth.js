const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and attaches user info to request object
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    if (!token) {
      return res.status(401).json({
        message: 'Access token required',
        error: 'MISSING_TOKEN'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Optional: Fetch fresh user data from database
    // This ensures the user still exists and hasn't been deactivated
    const user = await UserModel.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Attach user info to request object
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      ...user
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);

    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired',
        error: 'TOKEN_EXPIRED'
      });
    }

    // Generic error
    return res.status(500).json({
      message: 'Authentication failed',
      error: 'AUTH_ERROR'
    });
  }
};

/**
 * Optional Authentication Middleware
 * Similar to authenticateToken but doesn't fail if no token is provided
 * Useful for endpoints that work for both authenticated and anonymous users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.sub);
    
    req.user = user ? {
      id: decoded.sub,
      email: decoded.email,
      ...user
    } : null;

    next();
  } catch (error) {
    // For optional auth, we don't fail on invalid tokens
    req.user = null;
    next();
  }
};

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  const payload = {
    sub: user.id,
    email: user.email,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

/**
 * Generate refresh token (for future implementation)
 * @param {Object} user - User object
 * @returns {string} Refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    sub: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
};

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken,
  generateRefreshToken
};
