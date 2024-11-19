// src/components/rewards/RewardHistoryTable.jsx
import React from 'react';
import { format } from 'date-fns';

const RewardHistoryTable = ({ history }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {history.map((entry) => (
            <tr key={entry.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                {format(entry.createdAt.toDate(), 'MMM dd, yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`${entry.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {entry.change > 0 ? '+' : ''}{entry.change}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{entry.reason}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                {entry.balance.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RewardHistoryTable;