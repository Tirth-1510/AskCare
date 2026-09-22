/**
 * ProtectedRoute.jsx — Authentication Guard Component
 *
 * A wrapper component that protects routes requiring authentication.
 * Redirects unauthenticated users to /login and preserves where they
 * were trying to go so they can be redirected back after signing in.
 *
 * Usage in App.jsx:
 *   <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
 *
 * Behavior:
 *   1. While auth state is loading (e.g., token being validated) → show spinner
 *   2. If user is NOT authenticated → redirect to /login with current location saved
 *   3. If user IS authenticated → render the children (the protected page)
 *
 * The { from: location } state passed to /login allows the Login page to
 * redirect the user back to their intended destination after successful login.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — Route guard that enforces authentication.
 * @param {React.ReactNode} children — The page/component to render if authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation(); // Current URL the user was trying to access

  // Show a loading spinner while auth state is being determined
  // (e.g., during the initial page load when reading from localStorage)
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0B0E14] text-white flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-neon border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-400 font-medium tracking-wide">Securing connection...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save the current location the user was trying to go to
    // Login.jsx reads location.state.from to redirect after successful sign-in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated — render the protected content
  return children;
};

export default ProtectedRoute;
