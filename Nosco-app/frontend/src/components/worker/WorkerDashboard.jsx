// src/components/worker/WorkerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCurrentUserProject } from '../../services/workerProjectService';
import { workerDashboardService } from '../../services/workerDashboardService';
import SummaryCard from './SummaryCard';
import NotificationList from '../common/NotificationList';

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentProject, setCurrentProject] = useState(null);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalHoursWorkedThisMonth: 0,
    workHoursPendingApproval: 0,
    expensesPendingApproval: 0,
    pendingProjectInvitations: 0,
    amountToBePaid: 0,
    paymentsProcessing: 0,
    processedPaymentsThisMonth: 0
  });
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Your work hours for last week have been approved." },
    { id: 2, message: "New expense claim policy update. Please review." },
    { id: 3, message: "Reminder: Submit your expense claims by Friday." }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (user?.uid) {
          setLoading(true);
          
          // Try to fetch current project - if it fails, keep null
          try {
            const project = await getCurrentUserProject(user.uid);
            if (project) setCurrentProject(project);
          } catch (err) {
            console.error("Error fetching current project:", err);
            // Don't update state, keep default
          }
          
          // Try to fetch dashboard metrics - if it fails, keep defaults
          try {
            const metrics = await workerDashboardService.getWorkerDashboardMetrics(user.uid);
            if (metrics) setDashboardMetrics(metrics);
          } catch (err) {
            console.error("Error fetching dashboard metrics:", err);
            // Don't update state, keep defaults
          }
          
          // Try to fetch notifications - if it fails, keep defaults
          try {
            const recentNotifications = await workerDashboardService.getRecentNotifications(user.uid, 4);
            if (recentNotifications && recentNotifications.length > 0) {
              setNotifications(recentNotifications);
            }
          } catch (err) {
            console.error("Error fetching notifications:", err);
            // Don't update state, keep defaults
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Format currency values with $ sign for USD
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Generate summary cards data with proper units
  const summaryData = [
    { 
      title: "Total Hours Worked This Month", 
      value: dashboardMetrics.totalHoursWorkedThisMonth.toFixed(1), 
      unit: "hours" 
    },
    { 
      title: "Work Hours Pending Approvals", 
      value: dashboardMetrics.workHoursPendingApproval, 
      unit: "" 
    },
    { 
      title: "Expenses Pending Approval", 
      value: dashboardMetrics.expensesPendingApproval, 
      unit: "" 
    },
    { 
      title: "Pending Project Invitations", 
      value: dashboardMetrics.pendingProjectInvitations, 
      unit: "" 
    },
    { 
      title: "Payments yet to be paid", 
      value: formatCurrency(dashboardMetrics.amountToBePaid), 
      unit: "USD" 
    },
    { 
      title: "Payments processing", 
      value: formatCurrency(dashboardMetrics.paymentsProcessing), 
      unit: "USD" 
    },
    { 
      title: "Processed Payments This Month", 
      value: formatCurrency(dashboardMetrics.processedPaymentsThisMonth), 
      unit: "USD" 
    },
  ];

  const navLinks = [
    { title: "Projects", path: "/worker/projects" },
    { title: "Work Hours", path: "/worker/work-hours" },
    { title: "Expenses", path: "/worker/expenses" },
    { title: "Payments", path: "/worker/payments" },
    { title: "Notifications", path: "/worker/notifications" },
    { title: "Profile", path: "/worker/profile" },
    { title: "Settings", path: "/worker/settings" },
  ];

  // Format date properly, safely
  const formatDate = (dateObj) => {
    if (!dateObj) return 'N/A';
    
    try {
      // If it's a Timestamp object
      if (dateObj.toDate) {
        return dateObj.toDate().toLocaleDateString();
      }
      
      // If it's a string, convert to Date
      if (typeof dateObj === 'string') {
        return new Date(dateObj).toLocaleDateString();
      }
      
      // If it's already a Date object
      if (dateObj instanceof Date) {
        return dateObj.toLocaleDateString();
      }
    } catch (e) {
      console.error("Error formatting date:", e);
    }
    
    return 'N/A';
  };

  return (
    <>
      {/* Navigation Menu */}
      <nav className="flex justify-center flex-wrap gap-2 mb-8">
        {navLinks.map((link, index) => (
          <Link
            key={index}
            to={link.path}
            className="px-4 py-2 bg-white text-nosco-red border border-nosco-red rounded-full hover:bg-nosco-red hover:text-white transition duration-300 no-underline"
          >
            {link.title}
          </Link>
        ))}
      </nav>

      {/* Welcome Banner */}
      <h1 className="text-3xl font-bold text-nosco-red mb-8">
        Welcome, {user?.name || 'Worker'}
      </h1>
      
      {/* Current Project Section */}
      <section className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-2">Current Project</h2>
        {currentProject ? (
          <>
            <h3 className="text-xl font-medium">{currentProject.name}</h3>
            <p className="mb-2">{currentProject.description}</p>
            <p className="text-gray-600">Location: {currentProject.location || 'Not specified'}</p>
            <p className="text-gray-600">
              Duration: {formatDate(currentProject.startDate)} - {formatDate(currentProject.endDate)}
            </p>
            <p className={`font-semibold ${currentProject.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
              Status: {currentProject.status ? (currentProject.status.charAt(0).toUpperCase() + currentProject.status.slice(1)) : 'Unknown'}
            </p>
          </>
        ) : (
          <p className="text-yellow-600">No active project assigned.</p>
        )}
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summaryData.map((data, index) => (
          <SummaryCard key={index} {...data} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex space-x-4">
          {currentProject?.status === 'active' && (
            <button
              onClick={() => navigate('/worker/log-work-hours')}
              className="bg-nosco-red text-white py-2 px-4 rounded hover:bg-nosco-red-dark transition duration-300"
            >
              Log Work Hours
            </button>
          )}
          <button
            onClick={() => navigate('/worker/submit-expense')}
            className="bg-nosco-red text-white py-2 px-4 rounded hover:bg-nosco-red-dark transition duration-300"
          >
            Submit Expense Claim
          </button>
        </div>
      </div>

      {/* Recent Notifications */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Notifications</h2>
        <NotificationList notifications={notifications} />
      </div>
    </>
  );
};

export default WorkerDashboard;
