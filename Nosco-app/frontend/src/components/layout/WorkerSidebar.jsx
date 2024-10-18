import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    FaHome, FaEnvelope, FaClock, FaReceipt, FaMoneyBillWave, 
    FaTrophy, FaBell, FaComments, FaUser, FaCog, FaSignOutAlt,
    FaChevronLeft, FaChevronRight
  } from 'react-icons/fa';

const WorkerSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { title: 'Home', icon: FaHome, path: '/worker/dashboard' },
    { title: 'Project Invitations', icon: FaEnvelope, path: '/worker/project-invitations' },
    { title: 'Work Hours', icon: FaClock, path: '/worker/work-hours' },
    { title: 'Expenses', icon: FaReceipt, path: '/worker/expenses' },
    { title: 'Payments', icon: FaMoneyBillWave, path: '/worker/payments' },
    { title: 'Rewards', icon: FaTrophy, path: '/worker/rewards' },
    { title: 'Notifications', icon: FaBell, path: '/worker/notifications' },
    { title: 'Feedback', icon: FaComments, path: '/worker/feedback' },
  ];

  const bottomNavItems = [
    { title: 'Profile', icon: FaUser, path: '/worker/profile' },
    { title: 'Settings', icon: FaCog, path: '/worker/settings' },
  ];

  const toggleSidebar = () => setIsExpanded(!isExpanded);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="relative">
      <div 
        className={`bg-gray-800 text-white h-screen overflow-hidden flex flex-col`}
        style={{
          width: isExpanded ? '200px' : '0px',
          transition: 'width 0.5s ease-in-out'
        }}
      >
        <div className="p-4 flex items-center justify-center bg-gray-800">
          {user ? (
            <img 
              src={user.profilePic || '../assets/images/default-pfp.png'} 
              alt="Profile" 
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <img 
              src="../assets/images/default-pfp.png" 
              alt="Default Profile" 
              className="w-10 h-10 rounded-full"
            />
          )}
        </div>
        
        <nav className="flex-grow overflow-y-auto">
          <ul className="space-y-2 px-2">
            {navItems.map((item, index) => (
              <li key={index}>
                <Link 
                  to={item.path}
                  className={`flex items-center py-2 px-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 text-white no-underline
                  ${location.pathname === item.path ? 'bg-gray-700' : ''}`}
                >
                  <item.icon className="text-xl mr-3" />
                  <span className="whitespace-nowrap">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="px-2 pb-4 bg-gray-800">
          <ul className="space-y-2 px-2">
            {bottomNavItems.map((item, index) => (
              <li key={index}>
                <Link 
                  to={item.path}
                  className={`flex items-center py-2 px-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 text-white no-underline
                  ${location.pathname === item.path ? 'bg-gray-700' : ''}`}
                >
                  <item.icon className="text-xl mr-3" />
                  <span className="whitespace-nowrap">{item.title}</span>
                </Link>
              </li>
            ))}
            <li>
              <button 
                onClick={handleLogout}
                className="flex items-center py-2 px-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 w-full text-white"
              >
                <FaSignOutAlt className="text-xl mr-3" />
                <span className="whitespace-nowrap">Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <button 
        onClick={toggleSidebar}
        className={`absolute top-1/2 -translate-y-1/2 -right-8
        bg-nosco-red hover:bg-nosco-red-dark text-white p-2 rounded-r-md shadow-lg 
        transition-all duration-500 ease-in-out transform hover:scale-110
        flex items-center justify-center w-8 h-16`}
        title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        {isExpanded ? <FaChevronLeft size={20} /> : <FaChevronRight size={20} />}
      </button>
    </div>
  );
};

export default WorkerSidebar;