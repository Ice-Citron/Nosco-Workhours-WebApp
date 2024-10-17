import React from 'react';

const SummaryCard = ({ title, value, unit }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-nosco-red">
        {value} <span className="text-sm text-gray-500">{unit}</span>
      </p>
    </div>
  );
};

export default SummaryCard;