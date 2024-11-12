// src/components/timesheets/WorkHoursSummary.jsx
import React, { useEffect, useState } from 'react';
import { timesheetService } from '../../services/timesheetService';
import { useAuth } from '../../context/AuthContext';

const WorkHoursSummary = () => {
  const [workHours, setWorkHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchWorkHours = async () => {
      try {
        if (user?.uid) {
          const hours = await timesheetService.getRecentWorkHours(user.uid);
          setWorkHours(hours);
        }
      } catch (err) {
        setError('Failed to fetch work hours');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkHours();
  }, [user]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm">{error}</div>
    );
  }

  if (!workHours.length) {
    return (
      <div className="text-gray-500 text-sm">No recent work hours logged.</div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          Recent Work Hours
        </h3>
        <div className="flow-root">
          <ul className="-my-5 divide-y divide-gray-200">
            {workHours.map((entry) => (
              <li key={entry.id} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {entry.date.toDate().toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Regular: {entry.regularHours}h | OT1.5: {entry.overtime15x}h | OT2.0: {entry.overtime20x}h
                    </p>
                    {entry.remarks && (
                      <p className="text-sm text-gray-500 truncate">
                        {entry.remarks}
                      </p>
                    )}
                  </div>
                  <div className="inline-flex items-center text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      entry.status === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : entry.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {entry.status}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WorkHoursSummary;