import React from 'react';
import WorkerDashboard from '../components/worker/WorkerDashboard';

const WorkerDashboardPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <main className="flex-grow container mx-auto px-4 py-2">
        <WorkerDashboard />
      </main>
    </div>
  );
};

export default WorkerDashboardPage;