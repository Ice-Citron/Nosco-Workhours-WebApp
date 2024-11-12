// src/components/timesheets/WorkHoursSummary.jsx
import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase/firebase_config';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

const WorkHoursSummary = () => {
  const [workHours, setWorkHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchWorkHours = async () => {
      try {
        if (!user?.uid) return;

        const workHoursRef = collection(firestore, 'workHours');
        const q = query(
          workHoursRef,
          where('userID', '==', user.uid),
          orderBy('date', 'desc'),
          limit(5) // Get last 5 entries
        );

        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          // No work hours yet - this is not an error state
          setWorkHours([]);
        } else {
          setWorkHours(
            snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
          );
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching work hours:', err);
        setError('Failed to fetch work hours');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkHours();
  }, [user]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Recent Work Hours</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm">{error}</div>
    );
  }

  if (workHours.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        No work hours logged yet. Your submitted hours will appear here.
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Recent Work Hours</h3>
      <div className="space-y-4">
        {workHours.map((entry) => (
          <div key={entry.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">
                {new Date(entry.date.seconds * 1000).toLocaleDateString()}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                entry.status === 'approved' 
                  ? 'bg-green-100 text-green-800'
                  : entry.status === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {entry.status}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <div>Regular Hours: {entry.regularHours}</div>
              {entry.overtime15x > 0 && <div>OT (1.5x): {entry.overtime15x}</div>}
              {entry.overtime20x > 0 && <div>OT (2.0x): {entry.overtime20x}</div>}
              {entry.remarks && <div className="mt-2">Remarks: {entry.remarks}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkHoursSummary;