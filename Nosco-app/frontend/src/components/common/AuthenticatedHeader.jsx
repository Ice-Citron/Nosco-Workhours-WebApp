import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../common/Logo';
import { useAuth } from '../../context/AuthContext';

const AuthenticatedHeader = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    return user?.role === 'admin' ? '/admin/dashboard' : '/worker/dashboard';
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Logo className="h-16 w-auto" linkTo={getDashboardPath()} />
        <div>
          <button
            onClick={handleLogout}
            className="bg-nosco-red text-white py-2 px-4 rounded hover:bg-nosco-red-dark transition duration-300"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default AuthenticatedHeader;