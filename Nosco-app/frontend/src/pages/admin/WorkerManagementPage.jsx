import React, { useState, useEffect } from 'react';
import { adminUserService } from '../../services/adminUserService';
import AddWorkerForm from '../../components/admin/workers/AddWorkerForm';
import WorkerDetailsModal from '../../components/admin/workers/WorkerDetailsModal';

const WorkerManagementPage = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const data = await adminUserService.getWorkers();
      setWorkers(data);
      setError(null);
    } catch (err) {
      setError('Failed to load workers');
      console.error('Error loading workers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (workerId, newStatus) => {
    try {
      await adminUserService.updateWorkerStatus(workerId, newStatus);
      await fetchWorkers();
    } catch (err) {
      console.error('Error updating worker status:', err);
    }
  };

  const handleViewDetails = (worker) => {
    setSelectedWorker(worker);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nosco-red"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Worker Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-nosco-red hover:bg-nosco-red-dark text-white px-6 py-2 rounded-md transition-colors duration-200"
        >
          Add New Worker
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 text-nosco-text font-medium">NAME</th>
              <th className="text-left p-4 text-nosco-text font-medium">EMAIL</th>
              <th className="text-left p-4 text-nosco-text font-medium">DEPARTMENT</th>
              <th className="text-left p-4 text-nosco-text font-medium">STATUS</th>
              <th className="text-left p-4 text-nosco-text font-medium">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((worker) => (
              <tr key={worker.id} className="border-b">
                <td className="p-4">
                  <div className="flex items-center">
                    {worker.profilePic ? (
                      <img
                        src={worker.profilePic}
                        alt={worker.name}
                        className="w-10 h-10 rounded-full mr-3 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center text-gray-600">
                        {worker.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-nosco-text">{worker.name}</div>
                      <div className="text-sm text-gray-500">{worker.position}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-nosco-text">{worker.email}</td>
                <td className="p-4 text-nosco-text">{worker.department}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    worker.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {worker.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetails(worker)}
                      className="px-4 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleStatusChange(
                        worker.id,
                        worker.status === 'active' ? 'archived' : 'active'
                      )}
                      className={`px-4 py-1 rounded transition-colors duration-200 ${
                        worker.status === 'active'
                          ? 'bg-red-50 text-nosco-red hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {worker.status === 'active' ? 'Archive' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddWorkerForm
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onWorkerAdded={fetchWorkers}
        />
      )}

      {showDetailsModal && selectedWorker && (
        <WorkerDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedWorker(null);
          }}
          worker={selectedWorker}
          onWorkerUpdated={fetchWorkers}
        />
      )}
    </div>
  );
};

export default WorkerManagementPage;