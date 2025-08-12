import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link as MuiLink,
  Container,
  Avatar,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Email,
  LockReset,
  ArrowBack,
  Visibility,
  VisibilityOff,
  Lock,
} from '@mui/icons-material';
import { authAPI } from '../api/client.js';

function ForgotPassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate email
  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  // Validate form
  const validateForm = () => {
    const errors = [];

    if (!formData.email) {
      errors.push('Email address is required');
    } else if (!validateEmail(formData.email)) {
      errors.push('Please enter a valid email address');
    }

    if (!formData.newPassword) {
      errors.push('New password is required');
    } else if (formData.newPassword.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (!formData.confirmPassword) {
      errors.push('Please confirm your password');
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.push('Passwords do not match');
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setMessage({
        type: 'error',
        text: errors.join('. ')
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Call the reset password API
      const response = await authAPI.resetPassword({
        email: formData.email,
        newPassword: formData.newPassword
      });

      setMessage({
        type: 'success',
        text: 'Password reset successful! Redirecting to login...'
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('Reset password error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to reset password. Please check if the email exists and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ m: 1, bgcolor: 'secondary.main', width: 56, height: 56 }}>
                <LockReset fontSize="large" />
              </Avatar>
              <Typography component="h1" variant="h4" color="primary" fontWeight="bold">
                Reset Password
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                Enter your email address and new password to reset your password
              </Typography>
            </Box>

            {/* Alert Message */}
            {message && (
              <Alert 
                severity={message.type} 
                sx={{ mb: 3 }}
                onClose={() => setMessage(null)}
              >
                {message.text}
              </Alert>
            )}

            {/* Reset Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              {/* Email Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              {/* New Password Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="newPassword"
                label="New Password"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.newPassword}
                onChange={handleChange}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Confirm Password Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="confirmPassword"
                label="Confirm New Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </Button>

              {/* Back to Login Link */}
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <MuiLink
                  component={Link}
                  to="/login"
                  variant="body2"
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ArrowBack sx={{ mr: 1, fontSize: 'small' }} />
                    Back to Sign In
                  </MuiLink>
                </Box>
              </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default ForgotPassword;
