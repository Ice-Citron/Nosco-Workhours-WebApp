// src/pages/admin/AdminAnalyticsPage.jsx
import React, { useState } from 'react';
import Tab from '../../components/common/Tab';
// ^ this is the same "Tab" component you use in PaymentProcessingPage
import ExpensesAnalyticsSection from '../../components/admin/analytics/ExpensesAnalyticsSection';
import WorkerAnalyticsSection from '../../components/admin/analytics/WorkerAnalyticsSection';

const AdminAnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('expenses');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Analytics</h1>

      {/* Tabs (similar to PaymentProcessingPage) */}
      <div className="flex mb-4 border-b border-gray-200">
        <Tab
          isActive={activeTab === 'expenses'}
          onClick={() => setActiveTab('expenses')}
        >
          Expenses
        </Tab>
        <Tab
          isActive={activeTab === 'worker'}
          onClick={() => setActiveTab('worker')}
        >
          Worker
        </Tab>
      </div>

      {/* Conditionally Render Sub-Sections */}
      {activeTab === 'expenses' ? (
        <ExpensesAnalyticsSection />
      ) : (
        <WorkerAnalyticsSection />
      )}
    </div>
  );
};

export default AdminAnalyticsPage;
