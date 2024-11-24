// RejectionReasonModal.jsx
import React, { useState } from 'react';
import Modal from '../../../common/Modal';

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
    <div className={`fixed inset-0 z-50 overflow-y-auto ${isOpen ? 'block' : 'hidden'}`}>
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-28 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Reject Expense</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <span className="text-2xl">×</span>
              </button>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-nosco-red focus:border-nosco-red"
                rows="4"
                placeholder="Please provide a reason for rejection..."
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!reason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-[#8B0000] border border-transparent rounded-md hover:bg-[#A52A2A] disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectionReasonModal;