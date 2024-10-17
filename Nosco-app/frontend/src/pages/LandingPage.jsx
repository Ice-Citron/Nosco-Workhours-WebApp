import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleEnterAs = (role) => {
    navigate('/login', { state: { role } });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Welcome to NOSCO Workforce Management System
        </h1>
        <div className="space-y-4">
          <button
            onClick={() => handleEnterAs('admin')}
            className="w-full px-6 py-3 bg-maroon text-white font-semibold rounded-md hover:bg-maroon-dark transition-colors"
          >
            Enter as Admin
          </button>
          <button
            onClick={() => handleEnterAs('worker')}
            className="w-full px-6 py-3 bg-maroon text-white font-semibold rounded-md hover:bg-maroon-dark transition-colors"
          >
            Enter as Worker
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;