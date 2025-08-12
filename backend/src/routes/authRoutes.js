const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateFileUpload } = require('../utils/validation');
const { validationSchemas, handleValidationErrors } = require('../middleware/security');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📁 Created uploads directory: ${uploadDir}`);
}

// Multer configuration for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${extension}`);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 1 // Only one file at a time
  }
});

// Custom multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum size is 5MB.',
        error: 'FILE_TOO_LARGE'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Unexpected file field.',
        error: 'UNEXPECTED_FILE'
      });
    }
  }
  
  if (err.message.includes('Only image files')) {
    return res.status(400).json({
      message: err.message,
      error: 'INVALID_FILE_TYPE'
    });
  }
  
  next(err);
};

// Routes

/**
 * POST /api/auth/signup
 * User registration with optional avatar upload
 */
router.post('/signup', upload.single('avatar'), handleMulterError, (req, res, next) => {
  // Additional file validation
  if (req.file) {
    const validation = validateFileUpload(req.file);
    if (!validation.isValid) {
      // Clean up uploaded file if validation fails
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting invalid file:', err);
      });
      
      return res.status(400).json({
        message: validation.errors.join(', '),
        error: 'INVALID_FILE'
      });
    }
  }
  
  AuthController.signup(req, res, next);
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login',
  validationSchemas.userLogin,
  handleValidationErrors,
  AuthController.login
);

/**
 * GET /api/auth/profile
 * Get current user profile (protected route)
 */
router.get('/profile', authenticateToken, AuthController.getProfile);

/**
 * POST /api/auth/forgot-password
 * Password reset request (placeholder)
 */
router.post('/forgot-password', AuthController.forgotPassword);

/**
 * GET /api/auth/verify
 * Verify JWT token (useful for frontend to check if token is still valid)
 */
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.full_name
    }
  });
});

/**
 * POST /api/auth/reset-password
 * Reset password endpoint - checks if email exists and updates password
 */
router.post('/reset-password', [
  validationSchemas.resetPassword,
  handleValidationErrors
], AuthController.resetPassword);

/**
 * POST /api/auth/logout
 * Logout endpoint (placeholder - JWT is stateless, so this is mainly for client-side cleanup)
 */
router.post('/logout', (req, res) => {
  // In a stateless JWT system, logout is handled client-side by removing the token
  // For enhanced security, you could implement a token blacklist here
  res.json({
    message: 'Logged out successfully',
    note: 'Please remove the token from client storage'
  });
});

module.exports = router;
