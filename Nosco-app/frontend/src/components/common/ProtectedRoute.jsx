import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (currentUser.role !== requiredRole) {
    // If the user is logged in but doesn't have the required role,
    // you might want to redirect them to a different page, like a 403 Forbidden page
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;