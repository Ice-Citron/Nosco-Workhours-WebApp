// src/components/dashboard/AdminDashboard.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const AdminDashboard = ({ metrics }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Navigation Links for the top menu
  const navLinks = [
    { title: "Users", path: "/admin/workers" },
    { title: "Projects", path: "/admin/projects" },
    { title: "Work Hours", path: "/admin/approvals/work-hours" },
    { title: "Expenses", path: "/admin/approvals/expenses" },
    { title: "Payments", path: "/admin/payments" },
    { title: "Analytics", path: "/admin/analytics" },
    { title: "Reports", path: "/admin/reports" },
    { title: "Notifications", path: "/admin/notifications" },
    { title: "Profile", path: "/admin/profile" },
    { title: "Settings", path: "/admin/settings" },
  ];

  // Updated quick actions as requested
  const quickActions = [
    { 
      title: 'Approve Work Hours', 
      path: '/admin/approvals/work-hours',
      badge: metrics.pendingWorkHours 
    },
    { 
      title: 'Approve Expenses', 
      path: '/admin/approvals/expenses',
      badge: metrics.pendingExpenses 
    },
    { 
      title: 'Manage Project Invitations', 
      path: '/admin/projects',
      badge: metrics.pendingInvitations 
    },
    { 
      title: 'Add New Worker', 
      path: '/admin/workers/' 
    },
    { 
      title: 'Add New Project', 
      path: '/admin/projects/' 
    }
  ];

  return (
    <div className="space-y-6">
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

      {/* Welcome Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {user?.name}
        </h1>
        <p className="text-gray-600">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Pending Items Summary - First Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Work Hours</h3>
          <p className="mt-2 text-3xl font-bold text-nosco-red">{metrics.pendingWorkHours}</p>
          <p className="text-sm text-gray-500">Pending approvals</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Expenses</h3>
          <p className="mt-2 text-3xl font-bold text-nosco-red">{metrics.pendingExpenses}</p>
          <p className="text-sm text-gray-500">Pending approvals</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Amount Due</h3>
          <p className="mt-2 text-3xl font-bold text-nosco-red">${metrics.amountDue?.toFixed(2) || '0.00'}</p>
          <p className="text-sm text-gray-500">Approved, not paid</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Payment Processing</h3>
          <p className="mt-2 text-3xl font-bold text-nosco-red">${metrics.paymentProcessingAmount?.toFixed(2) || '0.00'}</p>
          <p className="text-sm text-gray-500">{metrics.paymentsProcessing} payments</p>
        </div>
      </div>

      {/* Additional Metrics - Second Row (Fixed Styling) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Project Invitations</h3>
          <p className="mt-2 text-3xl font-bold text-nosco-red">{metrics.pendingInvitations}</p>
          <p className="text-sm text-gray-500">Awaiting response</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Active Workers</h3>
          <p className="mt-2 text-3xl font-bold text-gray-800">{metrics.activeWorkers || 0}</p>
          <p className="text-sm text-gray-500">Currently employed</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Expenses This Month</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">${metrics.totalExpensesThisMonth?.toFixed(2) || '0.00'}</p>
          <p className="text-sm text-gray-500">Total approved</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Payments This Month</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">${metrics.totalPaymentsThisMonth?.toFixed(2) || '0.00'}</p>
          <p className="text-sm text-gray-500">{metrics.totalPaymentsProcessed || 0} payments processed</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <span>{action.title}</span>
              {action.badge > 0 && (
                <span className="bg-nosco-red text-white px-3 py-1 rounded-full text-sm">
                  {action.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
