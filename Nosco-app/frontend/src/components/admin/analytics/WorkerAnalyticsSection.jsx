// src/components/admin/analytics/WorkerAnalyticsSection.jsx
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

// Example aggregator imports:
import {
  getWorkerHoursStats,
  getWorkerWagesStats,
  getWorkerClaimedExpenses,
} from '../../../services/adminAnalyticsService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

function WorkerAnalyticsSection() {
  const [filters, setFilters] = useState(null);

  const [hoursData, setHoursData] = useState([]);
  const [wagesData, setWagesData] = useState([]);
  const [claimedData, setClaimedData] = useState([]);

  // Chart refs (for reset zoom)
  const hoursChartRef = useRef(null);
  const wagesChartRef = useRef(null);
  const claimedChartRef = useRef(null);

  // Callback from the filter bar
  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  // Whenever filters changes => fetch aggregator data
  useEffect(() => {
    if (!filters) return;
    (async () => {
      try {
        const [resHours, resWages, resClaimed] = await Promise.all([
          getWorkerHoursStats(filters),
          getWorkerWagesStats(filters),
          getWorkerClaimedExpenses(filters),
        ]);
        setHoursData(resHours);
        setWagesData(resWages);
        setClaimedData(resClaimed);
      } catch (error) {
        console.error('Error loading worker analytics:', error);
      }
    })();
  }, [filters]);

  // 1) Worker Hours => stacked chart
  const hoursLabels = hoursData.map((h) => h.workerName);
  const datasetRegular = hoursData.map((h) => h.totalRegular);
  const datasetOT15 = hoursData.map((h) => h.totalOT15);
  const datasetOT20 = hoursData.map((h) => h.totalOT20);

  const hoursChartData = {
    labels: hoursLabels,
    datasets: [
      {
        label: 'Regular Hours',
        data: datasetRegular,
        backgroundColor: 'rgba(54, 162, 235, 0.6)', // blue
      },
      {
        label: 'OT 1.5',
        data: datasetOT15,
        backgroundColor: 'rgba(255, 206, 86, 0.6)', // yellow
      },
      {
        label: 'OT 2.0',
        data: datasetOT20,
        backgroundColor: 'rgba(255, 99, 132, 0.6)', // red
      },
    ],
  };

  const hoursChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: false },
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'xy',
        },
        pan: {
          enabled: true,
          mode: 'xy',
        },
      },
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true },
    },
  };

  // 2) Worker Wages => stacked chart
  const wageLabels = wagesData.map((w) => w.workerName);

  // If aggregator doesn't directly provide baseRate, you might define a fallback
  function deriveBaseRate(item) {
    return item.baseRate || 0;
  }

  const wageRegular = wagesData.map(
    (w) => w.totalRegularHours * (w.baseRate ?? deriveBaseRate(w))
  );
  const wageOT15 = wagesData.map(
    (w) => w.totalOT15Hours * (w.baseRate ?? deriveBaseRate(w)) * 1.5
  );
  const wageOT20 = wagesData.map(
    (w) => w.totalOT20Hours * (w.baseRate ?? deriveBaseRate(w)) * 2.0
  );

  const wagesChartData = {
    labels: wageLabels,
    datasets: [
      {
        label: 'Regular Wages',
        data: wageRegular,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
      {
        label: 'OT 1.5 Wages',
        data: wageOT15,
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
      },
      {
        label: 'OT 2.0 Wages',
        data: wageOT20,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
    ],
  };

  const wagesChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: false },
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'xy',
        },
        pan: {
          enabled: true,
          mode: 'xy',
        },
      },
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true },
    },
  };

  // 3) Worker Claimed Expenses => stacked by expenseType
  const allTypesSet = new Set();
  claimedData.forEach((cd) => {
    Object.keys(cd.totalsByType).forEach((t) => allTypesSet.add(t));
  });
  const allTypes = Array.from(allTypesSet);

  const claimedLabels = claimedData.map((c) => c.workerName);

  const expenseTypeDatasets = allTypes.map((type, i) => {
    const colors = [
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(255, 99, 132, 0.6)',
    ];
    const color = colors[i % colors.length];
    return {
      label: type,
      data: claimedData.map((c) => c.totalsByType[type] || 0),
      backgroundColor: color,
    };
  });

  const claimedChartData = {
    labels: claimedLabels,
    datasets: expenseTypeDatasets,
  };

  const claimedChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: false },
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'xy',
        },
        pan: {
          enabled: true,
          mode: 'xy',
        },
      },
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true },
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
      <h2 className="text-2xl font-semibold">Worker Analytics</h2>

      {/* Collapsible Filter Bar */}
      <AdminFilterBar onApply={handleApplyFilters} collapsible />

      {/* 1) Worker Hours */}
      <div className="bg-white p-4 shadow rounded">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Worker Hours</h3>
          <button
            className="bg-gray-200 hover:bg-gray-300 text-sm px-2 py-1 rounded"
            onClick={() => handleResetZoom(hoursChartRef)}
          >
            Reset Zoom
          </button>
        </div>
        <Bar ref={hoursChartRef} data={hoursChartData} options={hoursChartOptions} />
      </div>

      {/* 2) Worker Wages */}
      <div className="bg-white p-4 shadow rounded">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Worker Wages</h3>
          <button
            className="bg-gray-200 hover:bg-gray-300 text-sm px-2 py-1 rounded"
            onClick={() => handleResetZoom(wagesChartRef)}
          >
            Reset Zoom
          </button>
        </div>
        <Bar ref={wagesChartRef} data={wagesChartData} options={wagesChartOptions} />
      </div>

      {/* 3) Worker Claimed Expenses */}
      <div className="bg-white p-4 shadow rounded">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Worker Claimed Expenses</h3>
          <button
            className="bg-gray-200 hover:bg-gray-300 text-sm px-2 py-1 rounded"
            onClick={() => handleResetZoom(claimedChartRef)}
          >
            Reset Zoom
          </button>
        </div>
        <Bar ref={claimedChartRef} data={claimedChartData} options={claimedChartOptions} />
      </div>
    </div>
  );
}

export default WorkerAnalyticsSection;
