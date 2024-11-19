// src/components/rewards/RewardPointsChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';  // Added this import

const RewardPointsChart = ({ history }) => {
  // Transform history data for the chart
  const chartData = history
    .sort((a, b) => a.createdAt.toDate() - b.createdAt.toDate())
    .map(entry => ({
      date: format(entry.createdAt.toDate(), 'MMM dd'),
      points: entry.balance
    }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="points" 
            stroke="#8884d8" 
            name="Points Balance"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RewardPointsChart;
