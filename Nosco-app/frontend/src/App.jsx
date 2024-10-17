import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import PasswordResetRequestPage from './pages/PasswordResetRequestPage';
import ContactSupportPage from './pages/ContactSupportPage';
import EmployeeDashboardPage from './pages/EmployeeDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import SubmitExpensePage from './pages/SubmitExpensePage';
import LogHoursPage from './pages/LogHoursPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ErrorPage from './pages/ErrorPage';
import LoadingPage from './pages/LoadingPage';
import ProtectedRoute from './components/common/ProtectedRoute';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/password-reset" element={<PasswordResetRequestPage />} />
            <Route path="/contact-support" element={<ContactSupportPage />} />

            <Route path="/dashboard" element={<ProtectedRoute requiredRole="Employee"><EmployeeDashboardPage /></ProtectedRoute>} />
            <Route path="/admin-dashboard" element={<ProtectedRoute requiredRole="Admin"><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="/submit-expense" element={<ProtectedRoute requiredRole="Employee"><SubmitExpensePage /></ProtectedRoute>} />
            <Route path="/log-hours" element={<ProtectedRoute requiredRole="Employee"><LogHoursPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute requiredRole="Admin"><ReportsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute requiredRole="Employee"><ProfilePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute requiredRole="Admin"><SettingsPage /></ProtectedRoute>} />
            <Route path="/loading" element={<LoadingPage />} />
            <Route path="*" element={<ErrorPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;