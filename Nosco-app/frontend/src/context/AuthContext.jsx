import React, { createContext, useState, useContext } from 'react';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState({ isAuthenticated: true, role: 'worker' });

  const login = (email, password, role) => {
    // Set user as authenticated with the given role
    setCurrentUser({ isAuthenticated: true, role: role });
  };

  const logout = () => {
    // For now, just reset the role to 'worker'
    setCurrentUser({ isAuthenticated: true, role: 'worker' });
  };

  const value = {
    currentUser,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};