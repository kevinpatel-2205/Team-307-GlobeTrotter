import { Navigate } from 'react-router-dom';
import { tokenUtils } from '../api/client.js';

/**
 * ProtectedRoute component
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children }) {
  const isAuthenticated = tokenUtils.isAuthenticated();

  console.log('🛡️ ProtectedRoute check - isAuthenticated:', isAuthenticated);

  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ Authenticated, rendering protected content');
  return children;
}

export default ProtectedRoute;
