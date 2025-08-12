import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AdvancedDashboard from './pages/AdvancedDashboard.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import CreateTrip from './pages/CreateTrip.jsx';
import MyTrips from './pages/MyTrips.jsx';
import EnhancedTrips from './pages/EnhancedTrips.jsx';
import Explore from './pages/Explore.jsx';
import Flights from './pages/Flights.jsx';
import Hotels from './pages/Hotels.jsx';
import ItineraryBuilder from './pages/ItineraryBuilder.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { tokenUtils } from './api/client.js';

function App() {
  const isAuthenticated = tokenUtils.isAuthenticated();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          } 
        />
        <Route 
          path="/signup" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />
          } 
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/advanced-dashboard"
          element={
            <ProtectedRoute>
              <AdvancedDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/new"
          element={
            <ProtectedRoute>
              <CreateTrip />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips"
          element={
            <ProtectedRoute>
              <MyTrips />
            </ProtectedRoute>
          }
        />
        <Route
          path="/enhanced-trips"
          element={
            <ProtectedRoute>
              <EnhancedTrips />
            </ProtectedRoute>
          }
        />
        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <Explore />
            </ProtectedRoute>
          }
        />
        <Route
          path="/flights"
          element={
            <ProtectedRoute>
              <Flights />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hotels"
          element={
            <ProtectedRoute>
              <Hotels />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:tripId/itinerary"
          element={
            <ProtectedRoute>
              <ItineraryBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route 
          path="*" 
          element={<Navigate to="/" replace />} 
        />
      </Routes>
    </Box>
  );
}

export default App;
