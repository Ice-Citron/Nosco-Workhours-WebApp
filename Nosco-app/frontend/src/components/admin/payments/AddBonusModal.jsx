// src/components/admin/payments/AddBonusModal.jsx
import React, { useState } from 'react';
import Modal from '../../common/Modal';      // Adjust import path if needed
import Button from '../../common/Button';    // Adjust import path if needed
import { adminPaymentService } from '../../../services/adminPaymentService';

const AddBonusModal = ({
  isOpen,
  onClose,
  worker,       // e.g. { id, name }
  adminUser,    // e.g. { uid, ... } for the admin
}) => {
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!worker) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const now = new Date();
      await adminPaymentService.createPayment({
        description: `Bonus for ${worker.name}`,
        paymentType: 'bonus',
        status: 'processing',   // explicitly set to "processing"
        amount: parseFloat(amount),
        currency: 'USD',        // or your desired currency
        userID: worker.id,
        projectID: '',          // fill in if relevant
        referenceNumber: `BON-${Date.now()}`, // simple approach
        paymentMethod: '',      // e.g. "bankTransfer" or ""
        createdBy: adminUser?.uid || 'unknownAdmin',
        comments: {
          text: comment,
          userID: adminUser?.uid || 'unknownAdmin',
          createdAt: now,
        },
        date: now.toISOString(),
      });

      // Reset fields & close modal
      setAmount('');
      setComment('');
      onClose();
    } catch (err) {
      console.error('Error creating bonus payment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Bonus"
    >
      <div className="p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Add Bonus</h2>
        <p className="text-sm text-gray-500">
          Enter the bonus details for <strong>{worker.name}</strong> below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Worker Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Worker Name
            </label>
            <input
              type="text"
              value={worker.name}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none"
            />
          </div>

          {/* Bonus Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bonus Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none 
                         focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comments
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none 
                         focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Reason for bonus, etc."
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !amount.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Saving...' : 'Confirm Bonus'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddBonusModal;
