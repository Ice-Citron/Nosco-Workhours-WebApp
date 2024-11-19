// src/components/rewards/RewardRankingTable.jsx
import React from 'react';
import { Trophy } from 'lucide-react';

const RewardRankingTable = ({ rankings }) => {
  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-amber-700';
      default: return 'text-gray-700';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rankings.map((rank, index) => (
            <tr key={rank.id}>
              <td className={`px-6 py-4 whitespace-nowrap ${getRankColor(index + 1)}`}>
                {index < 3 ? (
                  <Trophy className="h-5 w-5 inline-block mr-1" />
                ) : null}
                #{index + 1}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{rank.userName}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                {rank.totalPoints.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RewardRankingTable;