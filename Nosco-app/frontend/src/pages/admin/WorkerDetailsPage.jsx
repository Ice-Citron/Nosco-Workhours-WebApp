// src/pages/admin/WorkerDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminUserService } from '../../services/adminUserService';

const WorkerDetailsPage = () => {
  const navigate = useNavigate();
  const { workerId } = useParams();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1) fetch worker on mount
  useEffect(() => {
    const fetchWorker = async () => {
      try {
        setLoading(true);
        const data = await adminUserService.getWorkerDetails(workerId);
        setWorker(data);
      } catch (err) {
        console.error('Error fetching worker details:', err);
        setError('Failed to load worker details.');
      } finally {
        setLoading(false);
      }
    };
    fetchWorker();
  }, [workerId]);

  // 2) define handleArchive to set worker.status='archived'
  const handleArchive = async (id) => {
    try {
      setLoading(true);
      await adminUserService.updateWorkerStatus(id, 'archived');
      // Refresh the worker data or set worker locally
      const updated = await adminUserService.getWorkerDetails(id);
      setWorker(updated);
    } catch (err) {
      console.error('Error archiving worker:', err);
      setError('Failed to archive worker.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!worker) return <div className="p-6">No worker data found.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Worker Details: {worker.name}
      </h1>

      <div className="bg-white p-4 rounded shadow space-y-4">
        <div><strong>Email:</strong> {worker.email}</div>
        <div><strong>Department:</strong> {worker.department}</div>
        <div><strong>Position:</strong> {worker.position}</div>
        <div>
          <strong>Status:</strong>{' '}
          <span
            className={`px-2 py-1 rounded ${
              worker.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {worker.status}
          </span>
        </div>
      </div>

      {/* ARCHIVE BUTTON */}
      {worker.status === 'active' && (
        <button
          className="mt-4 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded"
          onClick={() => handleArchive(worker.id)}
        >
          Archive This Worker
        </button>
      )}

      {/* Or show a "Re-activate" button if status === 'archived', etc. */}
    </div>
  );
};

export default WorkerDetailsPage;
