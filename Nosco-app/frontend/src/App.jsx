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
import SubmitExpensePage from './pages/SubmitExpensePage';
import LogHoursPage from './pages/LogHoursPage';
import ReportsPage from './pages/admin/AdminReportsPage';
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
import RewardsPage from './pages/RewardsPage';
import FeedbackPage from './pages/FeedbackPage';
import ProjectInvitationsPage from './pages/ProjectInvitationsPage';

import AdminLayout from './components/layout/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import WorkerManagementPage from './pages/admin/WorkerManagementPage';
import ProjectManagementPage from './pages/admin/ProjectManagementPage';
import PaymentProcessingPage from './pages/admin/PaymentProcessingPage';
import AdminProjectInvitationsPage from './pages/admin/AdminProjectInvitationsPage';
import WorkHoursApprovalPage from './pages/admin/WorkHoursApprovalPage';

import ApprovalsLayout from './components/admin/approvals/ApprovalsLayout';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

import AdminProvider from './context/AdminContext';
import AdminExpensePage from './pages/admin/AdminExpensePage';
import WorkerPaymentDetailsPage from './pages/admin/WorkerPaymentDetailsPage';
import ProjectDetailsPage from './pages/admin/ProjectDetailsPage';

import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminDocumentsPage from './pages/admin/AdminDocumentsPage';
import AdminAuditPage from './pages/admin/AdminAuditPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';


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
          <Route path="/worker/rewards" element={<ProtectedRoute><RewardsPage /></ProtectedRoute>} />
          <Route path="/worker/feedback" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
          <Route path="/worker/project-invitations" element={<ProtectedRoute><ProjectInvitationsPage /></ProtectedRoute>} />
        </Route>
        

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute> <AdminProvider> <AdminLayout /> </AdminProvider> </ProtectedRoute> }>
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute><AdminProfilePage /></ProtectedRoute>} />  {/* Add this line */}
          <Route path="/admin/workers" element={<ProtectedRoute><WorkerManagementPage /></ProtectedRoute>} />
          <Route path="/admin/projects" element={<ProtectedRoute><ProjectManagementPage /></ProtectedRoute>} />
          <Route path="/admin/projects/:projectId/management" element={<ProtectedRoute><ProjectDetailsPage /></ProtectedRoute>} />

          <Route path="/admin/approvals" element={<ProtectedRoute><ApprovalsLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="work-hours" />} />
            <Route path="work-hours" element={<WorkHoursApprovalPage />} />
            <Route path="expenses" element={<AdminExpensePage />} />
          </Route>
          
          <Route path="/admin/payments" element={<ProtectedRoute><PaymentProcessingPage /></ProtectedRoute>} />
          <Route path="/admin/payments/worker/:workerId" element={<ProtectedRoute><WorkerPaymentDetailsPage /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/admin/project-invitations" element={<ProtectedRoute><AdminProjectInvitationsPage /></ProtectedRoute>} />

          <Route path="/admin/notifications" element={<ProtectedRoute><AdminNotificationsPage /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalyticsPage /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><AdminSettingsPage /></ProtectedRoute>}/>
        </Route>

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
