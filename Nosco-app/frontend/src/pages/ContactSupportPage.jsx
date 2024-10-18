import React from 'react';
import { useAuth } from '../context/AuthContext';
import ContactSupportForm from '../components/auth/ContactSupportForm';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import AuthenticatedHeader from '../components/common/AuthenticatedHeader';
import AuthenticatedFooter from '../components/common/AuthenticatedFooter';

const ContactSupportPage = () => {
  const { user } = useAuth();

  const PageHeader = user ? AuthenticatedHeader : Header;
  const PageFooter = user ? AuthenticatedFooter : Footer;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-nosco-red mb-6">Contact Support</h1>
        <p className="mb-6">We're here to help. Please fill out the form below, and we'll get back to you as soon as possible.</p>
        <ContactSupportForm />
      </main>
      <PageFooter />
    </div>
  );
};

export default ContactSupportPage;