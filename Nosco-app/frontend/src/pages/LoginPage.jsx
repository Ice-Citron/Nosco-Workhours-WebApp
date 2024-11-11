import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/common/Logo';
import LoginForm from '../components/auth/LoginForm';
import Footer from '../components/layout/Footer';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState('');

  // Extract the role from the location state, default to 'worker'
  const role = location.state?.role || 'worker';

  const handleLogin = async (email, password) => {
    try {
      await login(email, password, role);
      // Navigate to the appropriate dashboard based on the role
      navigate(role === 'admin' ? '/admin/dashboard' : '/worker/dashboard');
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || 'Failed to login. Please try again.');
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
          <LoginForm onSubmit={handleLogin} initialRole={role} error={error} />
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