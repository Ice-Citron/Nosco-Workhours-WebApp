import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  // For development purposes, we'll allow access even if the user isn't authenticated
  // Remove this condition when authentication is fully implemented
  if (process.env.NODE_ENV === 'development') {
    return children;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // For now, we'll ignore role checking
  // Uncomment this when role-based access control is implemented
  // if (user.role !== requiredRole) {
  //   return <Navigate to="/unauthorized" />;
  // }

  return children;
};

export default ProtectedRoute;