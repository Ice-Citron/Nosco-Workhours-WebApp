// src/components/admin/projects/InviteWorkerModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import { adminProjectInvitationService } from '../../../services/adminProjectInvitationService';

const InviteWorkerModal = ({ 
  isOpen, 
  onClose, 
  onInvite, 
  projectId,
  existingWorkers = [] 
}) => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);

  const fetchAvailableWorkers = async () => {
    try {
      setLoading(true);
      // Use the new function passing the projectId prop from the parent
      const availableWorkers = await adminProjectInvitationService.getAvailableWorkers(projectId);
      setWorkers(availableWorkers);
      setError(null);
    } catch (err) {
      setError('Failed to load workers');
      console.error('Error loading available workers:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAvailableWorkers();
  }, [projectId]); // Make sure projectId is in the dependency array

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedWorker) {
      setError('Please select a worker');
      return;
    }

    if (!message.trim()) {
      setError('Please enter an invitation message');
      return;
    }

    try {
      await onInvite(selectedWorker, message);
      onClose();
      // Reset form
      setSelectedWorker('');
      setMessage('');
    } catch (err) {
      setError('Failed to send invitation');
      console.error('Error sending invitation:', err);
    }
  };

  // Generate default message when worker is selected
  useEffect(() => {
    if (selectedWorker) {
      const worker = workers.find(w => w.id === selectedWorker);
      if (worker) {
        setMessage(`Dear ${worker.name},\n\nYou are invited to join this project. Please review and respond to this invitation.\n\nBest regards,\nProject Management Team`);
      }
    }
  }, [selectedWorker, workers]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Worker to Project"
    >
      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Worker Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Worker
            </label>
            {loading ? (
              <div className="animate-pulse h-10 bg-gray-100 rounded-md"></div>
            ) : workers.length === 0 ? (
              <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded-md">
                No available workers to invite
              </div>
            ) : (
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-nosco-red"
                required
              >
                <option value="">Select a worker...</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name} - {worker.department} ({worker.position})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Invitation Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invitation Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-nosco-red"
              rows={6}
              placeholder="Enter invitation message..."
              required
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-nosco-red hover:bg-nosco-red-dark text-white rounded-md transition-colors duration-200"
            disabled={loading || !selectedWorker || !message.trim()}
          >
            Send Invitation
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default InviteWorkerModal;