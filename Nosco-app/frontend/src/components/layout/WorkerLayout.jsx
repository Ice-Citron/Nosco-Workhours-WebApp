import React from 'react';
import { Outlet } from 'react-router-dom';
import AuthenticatedHeader from '../common/AuthenticatedHeader';
import AuthenticatedFooter from '../common/AuthenticatedFooter';
import WorkerSidebar from './WorkerSidebar';

const WorkerLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <WorkerSidebar colorScheme="gradient" />
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <AuthenticatedHeader />
          <main className="container mx-auto px-6 py-8">
            <Outlet />
          </main>
          <AuthenticatedFooter />
        </div>
      </div>
    </div>
  );
};

export default WorkerLayout;