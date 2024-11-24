import React, { useState } from 'react';
import Modal from '../../common/Modal';

const RejectionReasonModal = ({ isOpen, onClose, onConfirm, isBulk = false }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim()) {
      onConfirm(reason.trim());
      setReason('');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reject Selected Work Hours`}
    >
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-base font-medium text-gray-900 mb-2">
            Reason for Rejection
          </h3>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nosco-red focus:border-transparent"
            placeholder="Please provide a reason for rejection..."
            required
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-nosco-red text-white font-medium rounded-lg hover:bg-nosco-red-dark"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!reason.trim()}
            className="px-6 py-2 bg-[#D88C8C] text-white font-medium rounded-lg hover:bg-[#C77C7C] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RejectionReasonModal;