// src/components/auth/PasswordResetRequestForm.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../../services/authService';

const PasswordResetRequestForm = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      await requestPasswordReset(emailOrUsername);
      setMessage({ type: 'success', text: 'Password reset instructions have been sent to your email.' });
      setEmailOrUsername('');
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-nosco-red">Reset Your Password</h2>
      <p className="text-sm text-gray-600 mb-6 text-center">
        Enter your email address or username, and we'll send you instructions to reset your password.
      </p>
      {message && (
        <div
          className={`p-4 mb-4 text-sm rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-700">
            Email or Username
          </label>
          <input
            type="text"
            id="emailOrUsername"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-nosco-red focus:border-nosco-red"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-nosco-red to-nosco-dark-red hover:from-nosco-dark-red hover:to-nosco-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nosco-red disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Submit'}
          </button>
        </div>
      </form>
      <div className="mt-4 text-center">
        <Link to="/login" className="text-sm text-nosco-red hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default PasswordResetRequestForm;
