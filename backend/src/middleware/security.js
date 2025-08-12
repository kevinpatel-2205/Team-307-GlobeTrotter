const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const xss = require('xss');
const hpp = require('hpp');

// Rate limiting configurations
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'RATE_LIMIT_EXCEEDED',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different rate limits for different endpoints
const rateLimiters = {
  // More permissive rate limiting for auth endpoints in development
  auth: createRateLimiter(15 * 60 * 1000, 50, 'Too many authentication attempts, please try again later'),

  // General API rate limiting
  api: createRateLimiter(15 * 60 * 1000, 200, 'Too many requests, please try again later'),

  // Stricter rate limiting for admin endpoints
  admin: createRateLimiter(15 * 60 * 1000, 100, 'Too many admin requests, please try again later'),

  // File upload rate limiting
  upload: createRateLimiter(60 * 60 * 1000, 20, 'Too many file uploads, please try again later'),
};

// Input validation schemas
const validationSchemas = {
  // User registration validation
  userRegistration: [
    body('full_name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Full name can only contain letters and spaces'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  ],

  // User login validation
  userLogin: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],

  // Trip creation validation
  tripCreation: [
    body('title')
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('Trip title must be between 3 and 200 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    
    body('start_date')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    
    body('end_date')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date')
      .custom((value, { req }) => {
        if (req.body.start_date && value && new Date(value) <= new Date(req.body.start_date)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
    
    body('budget')
      .optional()
      .isFloat({ min: 0, max: 1000000 })
      .withMessage('Budget must be a positive number less than 1,000,000'),
  ],

  // Itinerary item validation
  itineraryItem: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title is required and must be less than 200 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    
    body('category')
      .isIn(['flight', 'hotel', 'activity', 'restaurant', 'transport', 'other'])
      .withMessage('Invalid category'),
    
    body('cost')
      .optional()
      .isFloat({ min: 0, max: 100000 })
      .withMessage('Cost must be a positive number less than 100,000'),
    
    body('start_time')
      .optional()
      .isISO8601()
      .withMessage('Start time must be a valid datetime'),
    
    body('end_time')
      .optional()
      .isISO8601()
      .withMessage('End time must be a valid datetime'),
  ],

  // Reset password validation
  resetPassword: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),

    body('newPassword')
      .isLength({ min: 6, max: 128 })
      .withMessage('Password must be between 6 and 128 characters'),
  ],
};

// XSS sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = xss(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }
  
  if (req.query) {
    sanitizeObject(req.query);
  }
  
  if (req.params) {
    sanitizeObject(req.params);
  }

  next();
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Additional security headers beyond helmet
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

// File upload security
const validateFileUpload = (req, res, next) => {
  if (req.file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
        error: 'INVALID_FILE_TYPE'
      });
    }

    if (req.file.size > maxSize) {
      return res.status(400).json({
        message: 'File too large. Maximum size is 5MB.',
        error: 'FILE_TOO_LARGE'
      });
    }
  }
  
  next();
};

// SQL injection prevention (additional layer)
const preventSQLInjection = (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(--|\/\*|\*\/|;|'|"|`)/g,
    /(\bOR\b|\bAND\b).*?[=<>]/gi
  ];

  const checkForSQL = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        for (const pattern of sqlPatterns) {
          if (pattern.test(obj[key])) {
            return true;
          }
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkForSQL(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  if ((req.body && checkForSQL(req.body)) || 
      (req.query && checkForSQL(req.query)) || 
      (req.params && checkForSQL(req.params))) {
    return res.status(400).json({
      message: 'Invalid input detected',
      error: 'INVALID_INPUT'
    });
  }

  next();
};

module.exports = {
  rateLimiters,
  validationSchemas,
  sanitizeInput,
  handleValidationErrors,
  securityHeaders,
  validateFileUpload,
  preventSQLInjection,
  hpp: hpp()
};
