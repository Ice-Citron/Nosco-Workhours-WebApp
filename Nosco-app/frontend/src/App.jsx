import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import PasswordResetRequestPage from './pages/PasswordResetRequestPage';
import ContactSupportPage from './pages/ContactSupportPage';
import WorkerDashboardPage from './pages/WorkerDashboardPage';
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
            <Route path="/loading" element={<LoadingPage />} />

            <Route path="/worker/dashboard" element={<ProtectedRoute><WorkerDashboardPage /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="/worker/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/worker/submit-expense" element={<ProtectedRoute><SubmitExpensePage /></ProtectedRoute>} />
            <Route path="/worker/log-hours" element={<ProtectedRoute><LogHoursPage /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

            <Route path="*" element={<ErrorPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;