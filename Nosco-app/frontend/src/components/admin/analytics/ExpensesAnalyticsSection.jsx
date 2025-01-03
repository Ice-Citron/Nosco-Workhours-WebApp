// src/components/admin/analytics/ExpensesAnalyticsSection.jsx
import React, { useState, useEffect, useRef } from 'react';
import AdminFilterBar from './AdminFilterBar';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Bar } from 'react-chartjs-2';

// Example aggregator imports (you might rename them in your code):
import {
  getExpensesOverTime,
  getExpensesByProject,
  getExpensesByType,
} from '../../../services/adminAnalyticsService';

// 1) Register Chart.js components + Zoom
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

function ExpensesAnalyticsSection() {
  const [filters, setFilters] = useState(null);

  // Chart data states
  const [overTimeData, setOverTimeData] = useState([]);
  const [byProjectData, setByProjectData] = useState([]);
  const [byTypeData, setByTypeData] = useState([]);

  // Chart references (for resetting zoom)
  const overTimeChartRef = useRef(null);
  const byProjectChartRef = useRef(null);
  const byTypeChartRef = useRef(null);

  /** 
   * onApply callback from AdminFilterBar
   * sets local "filters" which triggers useEffect => fetch aggregator data 
   */
  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  // Whenever filters change, load aggregator data
  useEffect(() => {
    if (!filters) return;
    (async () => {
      try {
        const [resOverTime, resByProject, resByType] = await Promise.all([
          getExpensesOverTime(filters),
          getExpensesByProject(filters),
          getExpensesByType(filters),
        ]);
        setOverTimeData(resOverTime);
        setByProjectData(resByProject);
        setByTypeData(resByType);
      } catch (error) {
        console.error('Error loading expenses analytics:', error);
      }
    })();
  }, [filters]);

  // --- CHART DATA ---

  // 1) Expenses Over Time
  const dataOverTime = {
    labels: overTimeData.map((item) => item.dateKey),
    datasets: [
      {
        label: 'Total Expenses (USD)',
        data: overTimeData.map((item) => item.total),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  // 2) Expenses By Project
  const dataByProject = {
    labels: byProjectData.map((item) => item.projectName),
    datasets: [
      {
        label: 'Total Expenses (USD)',
        data: byProjectData.map((item) => item.total),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
      },
    ],
  };

  // 3) Expenses By Type
  const dataByType = {
    labels: byTypeData.map((item) => item.expenseType),
    datasets: [
      {
        label: 'Total Expenses (USD)',
        data: byTypeData.map((item) => item.total),
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
      },
    ],
  };

  // --- CHART OPTIONS (with Zoom/Pan) ---
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: false },
      // Enable zoom/pan
      zoom: {
        zoom: {
          wheel: { enabled: true },   // Zoom with mouse wheel
          pinch: { enabled: true },   // Zoom with pinch gesture
          mode: 'xy',                 // Allow zooming both axes
        },
        pan: {
          enabled: true,
          mode: 'xy',
        },
      },
    },
  };

  // Reset zoom handler
  const handleResetZoom = (chartRef) => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Expenses Analytics</h2>

      {/* 
        Shared Filter Bar 
        with collapsible checkboxes for Projects/Workers/Expense Types
      */}
      <AdminFilterBar onApply={handleApplyFilters} collapsible />

      {/* 1) Expenses Over Time */}
      <div className="bg-white p-4 shadow rounded">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Expenses Over Time</h3>
          <button
            className="bg-gray-200 hover:bg-gray-300 text-sm px-2 py-1 rounded"
            onClick={() => handleResetZoom(overTimeChartRef)}
          >
            Reset Zoom
          </button>
        </div>
        <Bar ref={overTimeChartRef} data={dataOverTime} options={chartOptions} />
      </div>

      {/* 2) Expenses By Project */}
      <div className="bg-white p-4 shadow rounded">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Expenses by Project</h3>
          <button
            className="bg-gray-200 hover:bg-gray-300 text-sm px-2 py-1 rounded"
            onClick={() => handleResetZoom(byProjectChartRef)}
          >
            Reset Zoom
          </button>
        </div>
        <Bar ref={byProjectChartRef} data={dataByProject} options={chartOptions} />
      </div>

      {/* 3) Expenses By Type */}
      <div className="bg-white p-4 shadow rounded">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Expenses by Type</h3>
          <button
            className="bg-gray-200 hover:bg-gray-300 text-sm px-2 py-1 rounded"
            onClick={() => handleResetZoom(byTypeChartRef)}
          >
            Reset Zoom
          </button>
        </div>
        <Bar ref={byTypeChartRef} data={dataByType} options={chartOptions} />
      </div>
    </div>
  );
}

export default ExpensesAnalyticsSection;
