import React from 'react';
import AuthenticatedHeader from '../components/common/AuthenticatedHeader';
import AuthenticatedFooter from '../components/common/AuthenticatedFooter';
import WorkerDashboard from '../components/worker/WorkerDashboard';

const WorkerDashboardPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <AuthenticatedHeader />
      <main className="flex-grow">
        <WorkerDashboard />
      </main>
      <AuthenticatedFooter />
    </div>
  );
};

export default WorkerDashboardPage;