// src/components/auth/LoginForm.jsx
import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

const LoginForm = ({ onSubmit, error, role }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ username, password });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Email/Username
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-nosco-red focus:border-nosco-red"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="mt-1 relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-nosco-red focus:border-nosco-red pr-10"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            ) : (
              <EyeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input type="hidden" name="role" value={role} />
      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-nosco-red to-nosco-dark-red hover:from-nosco-dark-red hover:to-nosco-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nosco-red"
        >
          Login
        </button>
      </div>
      <div className="flex items-center justify-between mt-4">
        <Link to="/password-reset" className="text-sm text-nosco-red hover:underline">
          Forgot Password?
        </Link>
        <Link to="/contact-support" className="text-sm text-nosco-red hover:underline">
          Contact Support
        </Link>
      </div>
    </form>
  );
};

export default LoginForm;