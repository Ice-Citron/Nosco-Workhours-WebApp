import React, { useState } from 'react';

const LoginForm = ({ onSubmit, initialRole, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState(initialRole);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password, role);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-nosco-red focus:border-nosco-red"
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-nosco-red focus:border-nosco-red"
          required
        />
      </div>
      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-nosco-red hover:bg-nosco-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nosco-red"
        >
          Login as {role === 'admin' ? 'Admin' : 'Worker'}
        </button>
      </div>
    </form>
  );
};

export default LoginForm;