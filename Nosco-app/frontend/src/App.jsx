import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import WorkerLayout from './components/layout/WorkerLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PasswordResetRequestPage from './pages/PasswordResetRequestPage';
import ContactSupportPage from './pages/ContactSupportPage';
import WorkerDashboardPage from './pages/worker/WorkerDashboardPage';
import SubmitExpensePage from './pages/worker/SubmitExpensePage';
import LogHoursPage from './pages/worker/LogHoursPage';
import ReportsPage from './pages/admin/AdminReportsPage';
import WorkerProfilePage from './pages/worker/WorkerProfilePage';
import SettingsPage from './pages/worker/SettingsPage';
import ErrorPage from './pages/ErrorPage';
import LoadingPage from './pages/LoadingPage';
import ProtectedRoute from './components/common/ProtectedRoute';

import WorkHoursLayout from './components/timesheets/WorkHoursLayout';
import WorkHoursHistoryPage from './pages/worker/WorkHoursHistoryPage';
import ExpensesLayout from './components/expenses/ExpensesLayout';
import ExpenseHistoryPage from './pages/worker/ExpenseHistoryPage';
import PaymentHistoryPage from './pages/worker/PaymentHistoryPage';
import NotificationsPage from './pages/worker/WorkerNotificationsPage';
import FeedbackPage from './pages/worker/FeedbackPage';

import AdminLayout from './components/layout/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import WorkerManagementPage from './pages/admin/WorkerManagementPage';
import ProjectManagementPage from './pages/admin/ProjectManagementPage';
import PaymentProcessingPage from './pages/admin/PaymentProcessingPage';
import WorkHoursApprovalPage from './pages/admin/WorkHoursApprovalPage';

import ApprovalsLayout from './components/admin/approvals/ApprovalsLayout';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

import AdminProvider from './context/AdminContext';
import AdminExpensePage from './pages/admin/AdminExpensePage';
import WorkerPaymentDetailsPage from './pages/admin/WorkerPaymentDetailsPage';
import WorkerDetailsPage from './pages/admin/WorkerDetailsPage';
import ProjectDetailsPage from './pages/admin/ProjectDetailsPage';

import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminDocumentsPage from './pages/admin/AdminDocumentsPage';
import AdminAuditPage from './pages/admin/AdminAuditPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';

import WorkerProjectsPage from './pages/worker/WorkerProjectsPage';
import WorkerProjectDetailPage from './pages/worker/WorkerProjectDetailPage';
import WorkerSettingsPage from './pages/worker/WorkerSettingsPage';


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
        <Route path="/password-reset" element={<PasswordResetRequestPage />} />
        <Route path="/contact-support" element={<ContactSupportPage />} />
        <Route path="/loading" element={<LoadingPage />} />
        
        {/* Worker Routes */}
        <Route path="/worker" element={<WorkerLayout />}>
          <Route path="/worker/dashboard" element={<ProtectedRoute><WorkerDashboardPage /></ProtectedRoute>} />
          <Route path="/worker/profile" element={<ProtectedRoute><WorkerProfilePage /></ProtectedRoute>} />
          <Route path="/worker/settings" element={<ProtectedRoute><WorkerSettingsPage /></ProtectedRoute>} />
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
          { /* <Route path="/worker/feedback" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} /> */}
          <Route path="/worker/projects" element={<ProtectedRoute><WorkerProjectsPage /></ProtectedRoute>} />
          <Route path="/worker/projects/:projectId/details" element={<ProtectedRoute><WorkerProjectDetailPage /></ProtectedRoute>} />
        </Route>
        

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute> <AdminProvider> <AdminLayout /> </AdminProvider> </ProtectedRoute> }>
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute><AdminProfilePage /></ProtectedRoute>} />  {/* Add this line */}
          <Route path="/admin/workers" element={<ProtectedRoute><WorkerManagementPage /></ProtectedRoute>} />
          <Route path="/admin/workers/:workerId" element={<ProtectedRoute><WorkerDetailsPage /></ProtectedRoute>} />
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