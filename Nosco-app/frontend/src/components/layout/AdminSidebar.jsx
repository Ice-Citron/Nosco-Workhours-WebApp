// src/components/layout/AdminSidebar.jsx

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FaHome,
  FaUsers,
  FaProjectDiagram,
  FaClock,
  FaReceipt,
  FaMoneyBillWave,
  FaChartLine,
  FaBell,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';

const AdminSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Updated navItems array to match the pages from AdminDashboard.jsx
  const navItems = [
    { title: 'Dashboard', icon: FaHome, path: '/admin/dashboard' },
    { title: 'Workers', icon: FaUsers, path: '/admin/workers' },
    { title: 'Projects', icon: FaProjectDiagram, path: '/admin/projects' },
    { title: 'Work Hours', icon: FaClock, path: '/admin/approvals/work-hours' },
    { title: 'Expenses', icon: FaReceipt, path: '/admin/approvals/expenses' },
    { title: 'Payments', icon: FaMoneyBillWave, path: '/admin/payments' },
    { title: 'Analytics', icon: FaChartLine, path: '/admin/analytics' },
    { title: 'Reports', icon: FaChartLine, path: '/admin/reports' },
    { title: 'Notifications', icon: FaBell, path: '/admin/notifications' },
    { title: 'Profile', icon: FaUser, path: '/admin/profile' },
    // Settings & Logout are handled separately below
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="relative">
      {/* Sidebar container */}
      <div
        className="bg-gray-900 text-white h-screen overflow-hidden flex flex-col"
        style={{
          width: isExpanded ? '210px' : '0px',
          transition: 'width 0.3s ease-in-out'
        }}
      >
        {/* Admin Profile Section */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <img
              src={user?.profilePic || '../assets/images/default-pfp.png'}
              alt="Admin Profile"
              className="w-10 h-10 rounded-full"
            />
            {isExpanded && (
              <div>
                <p className="font-semibold">{user?.name || 'Admin'}</p>
                <p className="text-sm text-gray-400">
                  {user?.position || 'Administrator'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-grow overflow-y-auto py-4">
          <ul className="space-y-1 pl-3">
            {navItems.map((item, idx) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={idx}>
                  <Link
                    to={item.path}
                    className={`flex items-center py-2 px-3 transition-colors duration-200
                      ${
                        isActive
                          ? 'bg-nosco-red text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                      no-underline
                    `}
                  >
                    <item.icon
                      className={`text-lg ${
                        isExpanded ? 'mr-3' : 'mx-auto'
                      }`}
                    />
                    {isExpanded && <span>{item.title}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Settings and Logout */}
        <div className="p-4 border-t border-gray-700">
          {/* Settings link */}
          <Link
            to="/admin/settings"
            className={`flex items-center py-2 px-0 mb-2 rounded transition-colors duration-200
              ${
                location.pathname === '/admin/settings'
                  ? 'bg-nosco-red text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }
              no-underline
            `}
          >
            <FaCog
              className={`text-lg ${isExpanded ? 'mr-3' : 'mx-auto'}`}
            />
            {isExpanded && <span>Settings</span>}
          </Link>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center w-full py-2 px-0 rounded text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-200"
          >
            <FaSignOutAlt
              className={`text-lg ${isExpanded ? 'mr-3' : 'mx-auto'}`}
            />
            {isExpanded && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`absolute top-1/2 -translate-y-1/2 -right-8
          bg-nosco-red hover:bg-nosco-red-dark text-white p-2 rounded-r-md shadow-lg
          transition-all duration-500 ease-in-out transform hover:scale-110
          flex items-center justify-center w-8 h-16
        `}
        title={isExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
      >
        {isExpanded ? <FaChevronLeft size={20} /> : <FaChevronRight size={20} />}
      </button>
    </div>
  );
};

export default AdminSidebar;
