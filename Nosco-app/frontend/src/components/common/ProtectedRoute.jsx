// src/components/common/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingPage from '../../pages/LoadingPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingPage />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check if admin is trying to access worker routes
  if (user.role === 'admin' && location.pathname.startsWith('/worker')) {
    return <Navigate to="/admin/dashboard" />;
  }

  // Check if worker is trying to access admin routes
  if (user.role === 'worker' && location.pathname.startsWith('/admin')) {
    return <Navigate to="/worker/dashboard" />;
  }

  return children;
};

export default ProtectedRoute;