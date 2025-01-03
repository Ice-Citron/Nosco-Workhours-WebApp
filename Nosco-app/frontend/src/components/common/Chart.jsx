// src/components/common/Chart.jsx
import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const LineChart = ({ data, options }) => {
  return <Line data={data} options={options} />;
};

export const BarChart = ({ data, options }) => {
  return <Bar data={data} options={options} />;
};
