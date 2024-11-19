import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import WorkerLayout from './components/layout/WorkerLayout';

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

import WorkHoursLayout from './components/timesheets/WorkHoursLayout';
import WorkHoursHistoryPage from './pages/WorkHoursHistoryPage';
import ExpensesLayout from './components/expenses/ExpensesLayout';
import ExpenseHistoryPage from './pages/ExpenseHistoryPage';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import NotificationsPage from './pages/NotificationsPage';


const AuthenticatedApp = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/password-reset" element={<PasswordResetRequestPage />} />
        <Route path="/contact-support" element={<ContactSupportPage />} />
        <Route path="/loading" element={<LoadingPage />} />

        {/* Worker Routes */}
        <Route path="/worker" element={<WorkerLayout />}>
          <Route path="/worker/dashboard" element={<ProtectedRoute><WorkerDashboardPage /></ProtectedRoute>} />
          <Route path="/worker/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/worker/submit-expense" element={<ProtectedRoute><SubmitExpensePage /></ProtectedRoute>} />
          <Route path="/worker/log-work-hours" element={<ProtectedRoute><LogHoursPage /></ProtectedRoute>} />
                  {/* Work Hours Routes */}
          <Route path="/worker/work-hours" element={<ProtectedRoute><WorkHoursLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="submit" />} />
            <Route path="submit" element={<LogHoursPage />} />
            <Route path="history" element={<WorkHoursHistoryPage />} />
          </Route>
                  {/* Expense Routes */}
          <Route path="/worker/expenses" element={<ProtectedRoute><ExpensesLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="submit" />} />
            <Route path="submit" element={<SubmitExpensePage />} />
            <Route path="history" element={<ExpenseHistoryPage />} />
          </Route>
          <Route path="/worker/payments" element={<ProtectedRoute><PaymentHistoryPage /></ProtectedRoute>} />
          <Route path="/worker/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        </Route>
        

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AuthenticatedApp />
      </Router>
    </AuthProvider>
  );
};

export default App;