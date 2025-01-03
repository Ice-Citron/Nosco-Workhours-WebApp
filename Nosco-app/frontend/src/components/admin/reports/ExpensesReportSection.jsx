// src/components/admin/reports/ExpensesReportSection.jsx
import React, { useState } from 'react';
import ExpensesFilterBar from './ExpensesFilterBar';
import { saveAs } from 'file-saver';
import { getExpensesForReport } from '../../../services/adminReportService'; // aggregator
// or your aggregator that returns flattened objects

function flattenForCSV(val) {
  if (val === null || val === undefined) return '';
  if (typeof val !== 'object') return String(val);
  return JSON.stringify(val);
}

const ExpensesReportSection = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleApplyFilters = async (filters) => {
    setLoading(true);
    try {
      const data = await getExpensesForReport(filters);
      setReportData(data);
    } catch (err) {
      console.error('Error loading expenses report:', err);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData.length) {
      alert('No data to export!');
      return;
    }
    const headers = Object.keys(reportData[0]);
    let csvContent = headers.join(',') + '\n';
    reportData.forEach((row) => {
      const rowVals = headers.map((h) => flattenForCSV(row[h]));
      csvContent += rowVals.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'expenses-report.csv');
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Expenses Report</h2>
      <ExpensesFilterBar onApply={handleApplyFilters} />

      <button onClick={handleExportCSV} className="bg-nosco-red text-white px-4 py-2 rounded mb-4">
        Export CSV
      </button>

      {loading && <p>Loading...</p>}
      {!loading && reportData.length === 0 && <p>No data found.</p>}
      {!loading && reportData.length > 0 && (
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-50">
            <tr>
              {Object.keys(reportData[0]).map((col) => (
                <th key={col} className="py-2 px-4 border-b text-left text-sm font-semibold">
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

export default ExpensesReportSection;
