// src/components/rewards/RewardPointsDisplay.jsx
import React from 'react';

const RewardPointsDisplay = ({ points }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">Your Reward Points</h2>
      </div>
      <div>
        <div className="text-4xl font-bold text-center text-primary">
          {points?.totalPoints || 0}
        </div>
        <p className="text-sm text-gray-500 text-center mt-2">
          Keep submitting work hours and expenses to earn more points!
        </p>
      </div>
    </div>
  );
};

export default RewardPointsDisplay;