// src/pages/admin/AdminReportsPage.jsx
import React, { useState } from 'react';
import Tab from '../../components/common/Tab'; // same Tab component used in AdminExpensePage
import WorkHoursReportSection from '../../components/admin/reports/WorkHoursReportSection';
import ExpensesReportSection from '../../components/admin/reports/ExpensesReportSection';
import ProjectsReportSection from '../../components/admin/reports/ProjectsReportSection';

const AdminReportsPage = () => {
  const [activeTab, setActiveTab] = useState('workHours');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'workHours':
        return <WorkHoursReportSection />;
      case 'expenses':
        return <ExpensesReportSection />;
      case 'projects':
        return <ProjectsReportSection />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4" aria-label="Tabs">
          <Tab
            isActive={activeTab === 'workHours'}
            onClick={() => setActiveTab('workHours')}
          >
            Report - Work Hours
          </Tab>
          <Tab
            isActive={activeTab === 'expenses'}
            onClick={() => setActiveTab('expenses')}
          >
            Report - Expenses
          </Tab>
          <Tab
            isActive={activeTab === 'projects'}
            onClick={() => setActiveTab('projects')}
          >
            Report - Projects
          </Tab>
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default AdminReportsPage;
