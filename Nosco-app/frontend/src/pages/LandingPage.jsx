import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/layout/Footer';
import Logo from '../components/common/Logo';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleEnterAs = (role) => {
    navigate('/login', { state: { role } });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="bg-white py-8 shadow-md">
        <div className="container mx-auto flex justify-center">
          <Logo />
        </div>
      </header>
      <main className="flex-grow flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl font-bold mb-8 text-center text-nosco-red">
          Welcome to NOSCO Workforce Management System
        </h1>
        <div className="space-y-4 w-full max-w-md">
          <button
            onClick={() => handleEnterAs('admin')}
            className="w-full px-6 py-3 bg-nosco-gradient text-white font-semibold rounded-md hover:opacity-90 transition-opacity"
          >
            Enter as Admin
          </button>
          <button
            onClick={() => handleEnterAs('worker')}
            className="w-full px-6 py-3 bg-nosco-gradient text-white font-semibold rounded-md hover:opacity-90 transition-opacity"
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