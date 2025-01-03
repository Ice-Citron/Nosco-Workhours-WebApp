// src/components/dashboard/AdminDashboard.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Add Link import
import { useAuth } from '../../../context/AuthContext';
import { nextWednesday } from 'date-fns';
import WorkerManagementPage from '../../../pages/admin/WorkerManagementPage';

const AdminDashboard = ({ metrics }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Navigation Links for the top menu
  const navLinks = [
    { title: "Workers", path: "/admin/workers" },
    { title: "Projects", path: "/admin/projects" },
    { title: "Work Hours", path: "/admin/approvals/work-hours" },
    { title: "Expenses", path: "/admin/approvals/expenses" },
    { title: "Payments", path: "/admin/payments" },
    { title: "Analytics", path: "/admin/analytics" },
    { title: "Reports", path: "/admin/reports" },
    { title: "Notifications", path: "/admin/notifications" },
    { title: "Settings", path: "/admin/settings" },
  ];

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
      path: '/admin/project-invitations',
      badge: metrics.pendingInvitations 
    },
    { 
      title: 'Add New Worker', 
      path: '/admin/workers/new' 
    },
    { 
      title: 'Add New Project', 
      path: '/admin/projects/new' 
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <MetricCard
          title="Pending Work Hours"
          value={metrics.pendingWorkHours}
          type="pending"
        />
        <MetricCard
          title="Pending Expenses"
          value={metrics.pendingExpenses}
          type="pending"
        />
        <MetricCard
          title="Project Invitations"
          value={metrics.pendingInvitations}
          type="pending"
        />
        <MetricCard
          title="Expenses This Month"
          value={`$${metrics.totalExpensesThisMonth.toLocaleString()}`}
          type="money"
        />
        <MetricCard
          title="Payments Processed"
          value={metrics.totalPaymentsProcessed}
          type="default"
        />
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

// Helper component for metrics display
const MetricCard = ({ title, value, type }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
    <p className={`text-2xl font-bold mt-2 ${
      type === 'pending' ? 'text-nosco-red' : 
      type === 'money' ? 'text-green-600' : 
      'text-gray-900'
    }`}>
      {value}
    </p>
  </div>
);

export default AdminDashboard;