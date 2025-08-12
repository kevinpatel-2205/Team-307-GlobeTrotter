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
  Grid,
} from '@mui/material';
import {
  Person,
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  TravelExplore,
  PhotoCamera,
} from '@mui/icons-material';
import { authAPI } from '../api/client.js';

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({
          type: 'error',
          text: 'Please select an image file'
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({
          type: 'error',
          text: 'Image size must be less than 5MB'
        });
        return;
      }

      setAvatar(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate form data
  const validateForm = () => {
    const errors = [];

    if (!formData.fullName.trim()) {
      errors.push('Full name is required');
    } else if (formData.fullName.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long');
    }

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

    if (!formData.confirmPassword) {
      errors.push('Please confirm your password');
    } else if (formData.password !== formData.confirmPassword) {
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
      const userData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        avatar: avatar
      };

      const response = await authAPI.signup(userData);

      setMessage({
        type: 'success',
        text: 'Account created successfully! Redirecting to login...'
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('Signup error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create account. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="md">
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
                Join GlobeTrotter
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                Start planning your next adventure
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

            {/* Signup Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2}>
                {/* Avatar Upload */}
                <Grid item xs={12} sx={{ textAlign: 'center', mb: 2 }}>
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Avatar
                      src={avatarPreview}
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        bgcolor: 'grey.300',
                        cursor: 'pointer'
                      }}
                      onClick={() => document.getElementById('avatar-upload').click()}
                    >
                      <PhotoCamera />
                    </Avatar>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      style={{ display: 'none' }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Click to upload avatar (optional)
                  </Typography>
                </Grid>

                {/* Full Name */}
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="fullName"
                    label="Full Name"
                    name="fullName"
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Email */}
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
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
                </Grid>

                {/* Password */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="new-password"
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
                </Grid>

                {/* Confirm Password */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
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
                            aria-label="toggle password visibility"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>

              {/* Links */}
              <Box sx={{ textAlign: 'center' }}>
                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    or
                  </Typography>
                </Divider>
                
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <MuiLink component={Link} to="/login" fontWeight="medium">
                    Sign in here
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

export default Signup;
