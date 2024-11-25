// src/components/admin/projects/InviteWorkerModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import { adminUserService } from '../../../services/adminUserService';

const InviteWorkerModal = ({ isOpen, onClose, onInvite, existingWorkers = [] }) => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAvailableWorkers();
  }, []);

  const fetchAvailableWorkers = async () => {
    try {
      setLoading(true);
      const allWorkers = await adminUserService.getActiveWorkers();
      // Filter out already invited workers
      const availableWorkers = allWorkers.filter(
        worker => !existingWorkers.includes(worker.id)
      );
      setWorkers(availableWorkers);
      setError(null);
    } catch (err) {
      setError('Failed to load workers');
      console.error('Error loading workers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWorker) {
      setError('Please select a worker');
      return;
    }

    try {
      await onInvite(selectedWorker, message);
      onClose();
    } catch (err) {
      setError('Failed to send invitation');
      console.error('Error sending invitation:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Worker to Project"
    >
      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Worker
          </label>
          {loading ? (
            <div className="animate-pulse h-10 bg-gray-100 rounded-md"></div>
          ) : (
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Select a worker...</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.name} - {worker.department}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Invitation Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            rows={4}
            placeholder="Enter a message for the worker..."
            required
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-nosco-red hover:bg-nosco-red-dark text-white rounded-md"
            disabled={loading || !selectedWorker}
          >
            Send Invitation
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default InviteWorkerModal;