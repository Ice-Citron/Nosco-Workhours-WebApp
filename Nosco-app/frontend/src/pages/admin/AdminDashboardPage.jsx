// src/pages/admin/AdminDashboardPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from '../../components/dashboard/AdminDashboard';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Mock data for now
  const metrics = {
    pendingWorkHours: 5,
    pendingExpenses: 3,
    pendingInvitations: 2,
    totalExpensesThisMonth: 15000,
    totalPaymentsProcessed: 25
  };

  return <AdminDashboard metrics={metrics} />;
};

export default AdminDashboardPage;