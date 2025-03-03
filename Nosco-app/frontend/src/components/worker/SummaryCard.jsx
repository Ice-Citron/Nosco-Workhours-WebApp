import React from 'react';

const SummaryCard = ({ title, value, unit }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6 flex flex-col" style={{height: "150px"}}>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <div className="mt-auto">
        <span className="text-3xl font-bold text-nosco-red">{value}</span>
        {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
      </div>
    </div>
  );
};

export default SummaryCard;