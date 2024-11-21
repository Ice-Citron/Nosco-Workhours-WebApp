// src/components/layout/AdminLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AuthenticatedHeader from '../common/AuthenticatedHeader';
import AuthenticatedFooter from '../common/AuthenticatedFooter';
import { useAuth } from '../../context/AuthContext';
import LoadingPage from '../../pages/LoadingPage';

const AdminLayout = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <AuthenticatedHeader />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>

        <AuthenticatedFooter />
      </div>
    </div>
  );
};

export default AdminLayout;