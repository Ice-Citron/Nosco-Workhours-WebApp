// src/components/admin/reports/ProjectsReportSection.jsx

import React, { useState } from 'react';
import ProjectsFilterBar from './ProjectsFilterBar';
import { saveAs } from 'file-saver';

// Example aggregator imports from adminReportService.js.
// Replace with the actual names you use in that file:
import {
  getProjectWorkerHoursCsv,
  getProjectExpensesCsv,
} from '../../../services/adminReportService';

/** Utility to flatten nested objects/arrays into JSON strings for CSV */
function flattenForCSV(val) {
  if (val === null || val === undefined) return '';
  if (typeof val !== 'object') return String(val);
  return JSON.stringify(val);
}

const ProjectsReportSection = () => {
  // For the "Worker Hours" table
  const [workerHoursData, setWorkerHoursData] = useState([]);
  // For the "Expenses" table
  const [expensesData, setExpensesData] = useState([]);

  // Single or separate loading states. We'll do a single "loading" to keep it simple:
  const [loading, setLoading] = useState(false);

  /**
   * Called by <ProjectsFilterBar onApply={handleApplyFilters} />
   * We fetch TWO sets of data: Worker Hours CSV + Expenses CSV
   */
  const handleApplyFilters = async (filters) => {
    try {
      setLoading(true);
      // Fetch both in parallel
      const [hoursResult, expensesResult] = await Promise.all([
        getProjectWorkerHoursCsv(filters),
        getProjectExpensesCsv(filters),
      ]);

      setWorkerHoursData(hoursResult);
      setExpensesData(expensesResult);
    } catch (err) {
      console.error('Error fetching Projects data:', err);
      setWorkerHoursData([]);
      setExpensesData([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Export the Worker Hours data to CSV
   */
  const handleExportWorkerCsv = () => {
    if (!workerHoursData.length) {
      alert('No Worker Hours data to export!');
      return;
    }

    const headers = Object.keys(workerHoursData[0]);
    let csvContent = headers.join(',') + '\n';

    workerHoursData.forEach((row) => {
      const rowVals = headers.map((h) => flattenForCSV(row[h]));
      csvContent += rowVals.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'project-worker-hours.csv');
  };

  /**
   * Export the Expenses data to CSV
   */
  const handleExportExpensesCsv = () => {
    if (!expensesData.length) {
      alert('No Expenses data to export!');
      return;
    }

    const headers = Object.keys(expensesData[0]);
    let csvContent = headers.join(',') + '\n';

    expensesData.forEach((row) => {
      const rowVals = headers.map((h) => flattenForCSV(row[h]));
      csvContent += rowVals.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'project-expenses.csv');
  };

  /**
   * Render a simple table for the "Worker Hours" data
   */
  const renderWorkerHoursTable = () => {
    if (loading) return <p>Loading Worker Hours...</p>;
    if (!loading && workerHoursData.length === 0) return <p>No Worker Hours found.</p>;

    return (
      <table className="min-w-full bg-white border">
        <thead className="bg-gray-50">
          <tr>
            {Object.keys(workerHoursData[0]).map((col) => (
              <th key={col} className="py-2 px-4 border-b text-left text-sm font-semibold">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {workerHoursData.map((row, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              {Object.keys(row).map((col) => (
                <td key={col} className="py-2 px-4 text-sm">
                  {flattenForCSV(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  /**
   * Render a simple table for the "Expenses" data
   */
  const renderExpensesTable = () => {
    if (loading) return <p>Loading Expenses...</p>;
    if (!loading && expensesData.length === 0) return <p>No Expenses found.</p>;

    return (
      <table className="min-w-full bg-white border">
        <thead className="bg-gray-50">
          <tr>
            {Object.keys(expensesData[0]).map((col) => (
              <th key={col} className="py-2 px-4 border-b text-left text-sm font-semibold">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {expensesData.map((row, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              {Object.keys(row).map((col) => (
                <td key={col} className="py-2 px-4 text-sm">
                  {flattenForCSV(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Projects Report</h2>

      {/* Filter Bar for projects (status/location/dateRange) */}
      <ProjectsFilterBar onApply={handleApplyFilters} />

      {/* Section 1: Worker Hours */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Worker Hours</h3>
          <button
            onClick={handleExportWorkerCsv}
            className="bg-nosco-red text-white px-3 py-1 rounded"
          >
            Export Worker Hours CSV
          </button>
        </div>
        {renderWorkerHoursTable()}
      </div>

      {/* Section 2: Expenses */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Expenses</h3>
          <button
            onClick={handleExportExpensesCsv}
            className="bg-nosco-red text-white px-3 py-1 rounded"
          >
            Export Expenses CSV
          </button>
        </div>
        {renderExpensesTable()}
      </div>
    </div>
  );
};

export default ProjectsReportSection;
