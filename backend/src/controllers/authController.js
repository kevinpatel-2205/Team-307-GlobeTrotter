const bcrypt = require('bcrypt');
const UserModel = require('../models/userModel');
const { generateToken } = require('../middleware/auth');
const { validateEmail, validatePassword } = require('../utils/validation');

/**
 * Authentication Controller
 * Handles user registration, login, and related auth operations
 */
class AuthController {
  /**
   * User registration endpoint
   * POST /api/auth/signup
   */
  static async signup(req, res) {
    try {
      const { full_name, fullName, email, password } = req.body;
      const name = full_name || fullName;

      // Input validation
      if (!name || !email || !password) {
        return res.status(400).json({
          message: 'Full name, email, and password are required',
          error: 'MISSING_FIELDS'
        });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({
          message: 'Please provide a valid email address',
          error: 'INVALID_EMAIL'
        });
      }

      if (!validatePassword(password)) {
        return res.status(400).json({
          message: 'Password must be at least 6 characters long',
          error: 'INVALID_PASSWORD'
        });
      }

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          message: 'Email already registered',
          error: 'EMAIL_EXISTS'
        });
      }

      // Hash password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Handle avatar upload
      const avatar_path = req.file ? `/uploads/${req.file.filename}` : null;

      // Create user
      const user = await UserModel.createUser({
        full_name: name,
        email,
        password_hash,
        avatar_path
      });

      // Generate token
      const token = generateToken(user);

      // Return success response (exclude sensitive data)
      res.status(201).json({
        message: 'Account created successfully',
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          avatarPath: user.avatar_path,
          createdAt: user.created_at
        },
        token
      });

    } catch (error) {
      console.error('Signup error:', error);

      if (error.message === 'Email already exists') {
        return res.status(409).json({
          message: 'Email already registered',
          error: 'EMAIL_EXISTS'
        });
      }

      if (error.message === 'Database not configured') {
        return res.status(503).json({
          message: 'Database not configured. Please set up your PostgreSQL database.',
          error: 'DATABASE_NOT_CONFIGURED'
        });
      }

      res.status(500).json({
        message: 'Failed to create account. Please try again.',
        error: 'SIGNUP_ERROR'
      });
    }
  }

  /**
   * User login endpoint
   * POST /api/auth/login
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Input validation
      if (!email || !password) {
        return res.status(400).json({
          message: 'Email and password are required',
          error: 'MISSING_CREDENTIALS'
        });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({
          message: 'Please provide a valid email address',
          error: 'INVALID_EMAIL'
        });
      }

      // Find user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          message: 'Invalid email or password',
          error: 'INVALID_CREDENTIALS'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          message: 'Invalid email or password',
          error: 'INVALID_CREDENTIALS'
        });
      }

      // Generate token
      const token = generateToken(user);

      // Return success response
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          avatarPath: user.avatar_path
        },
        token
      });

    } catch (error) {
      console.error('Login error:', error);

      if (error.message === 'Database not configured') {
        return res.status(503).json({
          message: 'Database not configured. Please set up your PostgreSQL database.',
          error: 'DATABASE_NOT_CONFIGURED'
        });
      }

      res.status(500).json({
        message: 'Login failed. Please try again.',
        error: 'LOGIN_ERROR'
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  static async getProfile(req, res) {
    try {
      // User is already attached to req by auth middleware
      const user = await UserModel.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
      }

      res.json({
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          avatarPath: user.avatar_path,
          createdAt: user.created_at
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        message: 'Failed to get profile',
        error: 'PROFILE_ERROR'
      });
    }
  }

  /**
   * Forgot password endpoint (placeholder)
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email || !validateEmail(email)) {
        return res.status(400).json({
          message: 'Please provide a valid email address',
          error: 'INVALID_EMAIL'
        });
      }

      // TODO: Implement password reset logic
      // 1. Generate reset token
      // 2. Save token to database with expiration
      // 3. Send email with reset link
      
      // For now, return a placeholder response
      res.json({
        message: 'If an account with that email exists, we\'ve sent password reset instructions.',
        note: 'Password reset functionality coming soon!'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        message: 'Failed to process password reset request',
        error: 'FORGOT_PASSWORD_ERROR'
      });
    }
  }

  /**
   * Reset password endpoint
   * POST /api/auth/reset-password
   */
  static async resetPassword(req, res) {
    try {
      const { email, newPassword } = req.body;

      if (!email || !validateEmail(email)) {
        return res.status(400).json({
          message: 'Please provide a valid email address',
          error: 'INVALID_EMAIL'
        });
      }

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          message: 'Password must be at least 6 characters long',
          error: 'INVALID_PASSWORD'
        });
      }

      // Check if user exists
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          message: 'No account found with that email address',
          error: 'USER_NOT_FOUND'
        });
      }

      // Hash the new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update the user's password
      await UserModel.updatePassword(user.id, hashedPassword);

      console.log(`Password reset successful for user: ${email}`);

      res.json({
        message: 'Password reset successful! You can now login with your new password.',
        success: true
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        message: 'Failed to reset password. Please try again.',
        error: 'RESET_PASSWORD_ERROR'
      });
    }
  }
}

module.exports = AuthController;
