import React from 'react';
import ContactSupportForm from '../components/auth/ContactSupportForm';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const ContactSupportPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-nosco-red mb-6">Contact Support</h1>
        <p className="mb-6">We're here to help. Please fill out the form below, and we'll get back to you as soon as possible.</p>
        <ContactSupportForm />
      </main>
      <Footer />
    </div>
  );
};

export default ContactSupportPage;