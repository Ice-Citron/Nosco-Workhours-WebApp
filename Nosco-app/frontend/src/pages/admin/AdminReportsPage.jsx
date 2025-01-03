// src/pages/admin/AdminReportsPage.jsx
import React, { useState } from 'react';

// Each "section" is a separate component
import WorkHoursReportSection from '../../components/admin/reports/WorkHoursReportSection';
import ExpensesReportSection from '../../components/admin/reports/ExpensesReportSection';
import ProjectsReportSection from '../../components/admin/reports/ProjectsReportSection';

function AdminReportsPage() {
  const [reportType, setReportType] = useState('workHours');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>

      <div className="mb-4 flex gap-4 items-center">
        <span className="font-semibold text-gray-700">Report Type:</span>

        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="reportType"
            value="workHours"
            checked={reportType === 'workHours'}
            onChange={(e) => setReportType(e.target.value)}
          />
          <span>Work Hours</span>
        </label>

        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="reportType"
            value="expenses"
            checked={reportType === 'expenses'}
            onChange={(e) => setReportType(e.target.value)}
          />
          <span>Expenses</span>
        </label>

        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="reportType"
            value="projects"
            checked={reportType === 'projects'}
            onChange={(e) => setReportType(e.target.value)}
          />
          <span>Projects</span>
        </label>
      </div>

      {/* Render the relevant sub-section */}
      {reportType === 'workHours' && <WorkHoursReportSection />}
      {reportType === 'expenses' && <ExpensesReportSection />}
      {reportType === 'projects' && <ProjectsReportSection />}
    </div>
  );
}

export default AdminReportsPage;
