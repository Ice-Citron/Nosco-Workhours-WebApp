import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/common/Logo';
import LoginForm from '../components/auth/LoginForm';
import Footer from '../components/layout/Footer';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (email, password, role) => {
    // Call login function from AuthContext
    login(email, password, role);
    // Directly navigate to the appropriate dashboard based on the role
    navigate(role === 'admin' ? '/admin/dashboard' : '/worker/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="bg-white shadow-md">
        <div className="container mx-auto py-8 px-6">
          <Logo className="h-20 mx-auto" />
        </div>
      </header>
      
      <main className="flex-grow container mx-auto py-16 px-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-nosco-red">
            Login to Your Account
          </h1>
          <LoginForm onSubmit={handleLogin} />
        </div>
      </main>
      
      <Footer>
        <div className="flex justify-center space-x-4 text-sm">
          <Link to="/password-reset" className="text-nosco-red hover:underline">
            Forgot Password?
          </Link>
          <span className="text-gray-400">|</span>
          <Link to="/contact-support" className="text-nosco-red hover:underline">
            Contact Support
          </Link>
        </div>
      </Footer>
    </div>
  );
};

export default LoginPage;

/**
// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Logo from '../components/common/Logo';
import LoginForm from '../components/auth/LoginForm';
import Footer from '../components/layout/Footer';

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // Extract the role from the location state
  const role = location.state?.role || 'worker'; // Default to 'worker' if not specified

  const handleLogin = async (credentials) => {
    // TODO: Implement actual authentication logic
    console.log('Login attempt:', { ...credentials, role });
    
    // Simulate authentication
    if (credentials.username === 'test' && credentials.password === 'password') {
      // Redirect to the appropriate dashboard based on the role
      navigate(role === 'admin' ? '/admin/dashboard' : '/worker/dashboard');
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="bg-white shadow-md">
        <div className="container mx-auto py-8 px-6">
          <Logo className="h-20 mx-auto" />
        </div>
      </header>
      
      <main className="flex-grow container mx-auto py-16 px-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-nosco-red">
            Login to Your Account
          </h1>
          <LoginForm onSubmit={handleLogin} error={error} role={role} />
        </div>
      </main>
      
      <Footer>
        <div className="flex justify-center space-x-4 text-sm">
          <Link to="/password-reset" className="text-nosco-red hover:underline">
            Forgot Password?
          </Link>
          <span className="text-gray-400">|</span>
          <Link to="/contact-support" className="text-nosco-red hover:underline">
            Contact Support
          </Link>
        </div>
      </Footer>
    </div>
  );
};

export default LoginPage;
**/