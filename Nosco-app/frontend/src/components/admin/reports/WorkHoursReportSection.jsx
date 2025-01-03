// src/components/admin/reports/WorkHoursReportSection.jsx
import React, { useState } from 'react';
import WorkHoursFilterBar from './WorkHoursFilterBar';
import { saveAs } from 'file-saver';

// 1) Import the aggregator function that DOES exist in adminReportService.js
import { getWorkerHoursByProjectReport } from '../../../services/adminReportService';

// Utility to flatten nested objects or arrays for CSV
function flattenForCSV(val) {
  if (val === null || val === undefined) return '';
  if (typeof val !== 'object') return String(val);
  return JSON.stringify(val);
}

const WorkHoursReportSection = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Handler when user clicks "Apply" on WorkHoursFilterBar
  const handleApplyFilters = async (filters) => {
    console.log('Applying Work Hours filters:', filters);
    try {
      setLoading(true);

      // 2) Call the aggregator that actually exists in adminReportService.js
      //    e.g. getWorkerHoursByProjectReport for single worker, multi projects, date range
      const data = await getWorkerHoursByProjectReport(filters);
      console.log('Fetched hours data:', data);

      setReportData(data);
    } catch (err) {
      console.error('Error fetching hours report:', err);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!reportData.length) {
      alert('No data to export!');
      return;
    }

    // Build CSV from the array of flattened objects
    const headers = Object.keys(reportData[0]); // column names
    let csv = headers.join(',') + '\n';

    reportData.forEach((row) => {
      const rowVals = headers.map((h) => flattenForCSV(row[h]));
      csv += rowVals.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'work-hours-report.csv');
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Work Hours Report</h2>
      
      {/* Filter bar that picks one worker + multi-check projects + date range */}
      <WorkHoursFilterBar onApply={handleApplyFilters} />

      <button
        onClick={handleExportCSV}
        className="bg-nosco-red text-white px-4 py-2 rounded mb-4"
      >
        Export CSV
      </button>

      {loading && <p>Loading...</p>}
      {!loading && reportData.length === 0 && <p>No data found.</p>}

      {!loading && reportData.length > 0 && (
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Object.keys(reportData[0]).map((col) => (
                <th
                  key={col}
                  className="py-2 px-4 border-b text-left text-sm font-semibold"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, idx) => (
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
      )}
    </div>
  );
};

export default WorkHoursReportSection;
