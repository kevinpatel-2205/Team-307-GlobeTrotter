/**
 * Validation utilities for user input
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean} True if password meets requirements
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  
  // Minimum 6 characters
  return password.length >= 6;
};

/**
 * Validate full name
 * @param {string} fullName - Full name to validate
 * @returns {boolean} True if valid full name
 */
const validateFullName = (fullName) => {
  if (!fullName || typeof fullName !== 'string') return false;
  
  const trimmed = fullName.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
};

/**
 * Sanitize string input
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (input) => {
  if (!input || typeof input !== 'string') return '';
  
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Validate file upload
 * @param {Object} file - Multer file object
 * @returns {Object} Validation result
 */
const validateFileUpload = (file) => {
  const result = {
    isValid: true,
    errors: []
  };

  if (!file) return result;

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    result.isValid = false;
    result.errors.push('File size must be less than 5MB');
  }

  // Check file type (images only)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    result.isValid = false;
    result.errors.push('Only image files (JPEG, PNG, GIF, WebP) are allowed');
  }

  return result;
};

/**
 * Validate signup data
 * @param {Object} data - Signup data
 * @returns {Object} Validation result
 */
const validateSignupData = (data) => {
  const errors = [];

  if (!validateFullName(data.fullName)) {
    errors.push('Full name must be between 2 and 100 characters');
  }

  if (!validateEmail(data.email)) {
    errors.push('Please provide a valid email address');
  }

  if (!validatePassword(data.password)) {
    errors.push('Password must be at least 6 characters long');
  }

  if (data.password !== data.confirmPassword) {
    errors.push('Passwords do not match');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate login data
 * @param {Object} data - Login data
 * @returns {Object} Validation result
 */
const validateLoginData = (data) => {
  const errors = [];

  if (!validateEmail(data.email)) {
    errors.push('Please provide a valid email address');
  }

  if (!data.password || data.password.length === 0) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateFullName,
  sanitizeString,
  validateFileUpload,
  validateSignupData,
  validateLoginData
};
