import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from './Logo';

const AuthenticatedHeader = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // For now, just redirect to the login page
    // In the future, implement actual logout logic here
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/worker/dashboard">
          <Logo className="h-10" />
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link to="/worker/dashboard" className="text-nosco-red hover:text-nosco-red-dark">Dashboard</Link>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="bg-nosco-red text-white py-2 px-4 rounded hover:bg-nosco-red-dark transition duration-300"
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default AuthenticatedHeader;