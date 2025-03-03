// src/pages/admin/AdminDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from '../../components/admin/dashboard/AdminDashboard';
import { adminDashboardService } from '../../services/adminDashboardService';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Initialize with default values
  const [metrics, setMetrics] = useState({
    pendingWorkHours: 0,
    pendingExpenses: 0,
    pendingInvitations: 0,
    amountDue: 0,
    paymentProcessingAmount: 0,
    paymentsProcessing: 0,
    activeWorkers: 0,
    totalExpensesThisMonth: 0,
    totalPaymentsThisMonth: 0, 
    totalPaymentsProcessed: 0
  });

  useEffect(() => {
    // Fetch dashboard data in the background
    const fetchDashboardData = async () => {
      try {
        const dashboardMetrics = await adminDashboardService.getDashboardMetrics();
        setMetrics(prevMetrics => ({
          ...prevMetrics,
          ...dashboardMetrics
        }));
      } catch (error) {
        // Just log the error, don't change the UI state
        console.error('Error fetching dashboard metrics:', error);
      }
    };

    fetchDashboardData();
  }, []);

  // Always render the dashboard with whatever metrics we have
  return <AdminDashboard metrics={metrics} />;
};

export default AdminDashboardPage;
