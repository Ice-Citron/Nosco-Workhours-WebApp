// src/pages/PasswordResetRequestPage.jsx
import React from 'react';
import PasswordResetRequestForm from '../components/auth/PasswordResetRequestForm';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const PasswordResetRequestPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow container mx-auto py-8 px-4">
        <PasswordResetRequestForm />
      </main>
      <Footer />
    </div>
  );
};

export default PasswordResetRequestPage;