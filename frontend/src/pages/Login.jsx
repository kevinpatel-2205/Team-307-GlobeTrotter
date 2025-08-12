import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Divider,
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  TravelExplore,
} from '@mui/icons-material';
import { authAPI, tokenUtils } from '../api/client.js';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear message when user starts typing
    if (message) setMessage(null);
  };

  // Validate form data
  const validateForm = () => {
    const errors = [];

    if (!formData.email) {
      errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }

    if (!formData.password) {
      errors.push('Password is required');
    } else if (formData.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
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
      const response = await authAPI.login(formData);
      const { token, user } = response.data;

      // Store token and user data
      console.log('🔐 Storing token and user data:', { token: token ? 'exists' : 'missing', user });
      tokenUtils.setToken(token);
      tokenUtils.setUser(user);

      // Verify token was stored
      const storedToken = tokenUtils.getToken();
      const storedUser = tokenUtils.getUser();
      console.log('✅ Verification - Token stored:', storedToken ? 'yes' : 'no', 'User stored:', storedUser ? 'yes' : 'no');

      // Check authentication status
      const isAuth = tokenUtils.isAuthenticated();
      console.log('🔍 Authentication status:', isAuth);

      setMessage({
        type: 'success',
        text: 'Login successful! Redirecting...'
      });

      // Force page reload to ensure React Router picks up the authentication state
      console.log('🚀 Redirecting to dashboard...');
      window.location.href = '/dashboard';

    } catch (error) {
      console.error('Login error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Login failed. Please try again.'
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
              <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
                <TravelExplore fontSize="large" />
              </Avatar>
              <Typography component="h1" variant="h4" color="primary" fontWeight="bold">
                GlobeTrotter
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                Welcome back!
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

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
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
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={formData.password}
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

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

              {/* Links */}
              <Box sx={{ textAlign: 'center' }}>
                <MuiLink
                  component={Link}
                  to="/forgot-password"
                  variant="body2"
                  sx={{ display: 'block', mb: 2 }}
                >
                  Forgot your password?
                </MuiLink>
                
                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    or
                  </Typography>
                </Divider>
                
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <MuiLink component={Link} to="/signup" fontWeight="medium">
                    Sign up here
                  </MuiLink>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default Login;
