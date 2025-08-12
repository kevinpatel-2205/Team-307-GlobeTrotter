const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

/**
 * Middleware to verify admin authentication
 */
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Access denied. No token provided.',
        error: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database to check role
      const user = await UserModel.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          message: 'Access denied. User not found.',
          error: 'USER_NOT_FOUND'
        });
      }

      if (user.role !== 'admin') {
        return res.status(403).json({
          message: 'Access denied. Admin privileges required.',
          error: 'INSUFFICIENT_PRIVILEGES'
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        message: 'Access denied. Invalid token.',
        error: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({
      message: 'Internal server error during authentication',
      error: 'AUTH_ERROR'
    });
  }
};

module.exports = {
  authenticateAdmin
};
