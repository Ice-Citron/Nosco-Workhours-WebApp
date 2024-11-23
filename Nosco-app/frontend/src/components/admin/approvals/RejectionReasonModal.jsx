import React, { useState } from 'react';
import Modal from '../../common/Modal';
import Button from '../../common/Button';

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
      title={`Reject ${isBulk ? 'Selected' : ''} Work Hours`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="rejectionReason" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Reason for Rejection
          </label>
          <textarea
            id="rejectionReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-nosco-red focus:border-nosco-red"
            placeholder="Please provide a reason for rejection..."
            required
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            onClick={onClose}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!reason.trim()}
            className="bg-nosco-red hover:bg-nosco-red-dark"
          >
            Confirm Rejection
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RejectionReasonModal;