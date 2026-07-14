import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
