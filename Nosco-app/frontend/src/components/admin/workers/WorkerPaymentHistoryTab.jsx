// src/components/admin/workers/WorkerPaymentHistoryTab.jsx

import React, { useEffect, useState } from 'react';
import { adminPaymentService } from '../../../services/adminPaymentService';

// Import your existing Modal component
import Modal from '../../common/Modal';

const WorkerPaymentHistoryTab = ({ workerId }) => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);

  // Store the currently selected payment for the modal
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    if (!workerId) {
      setLoading(false);
      return;
    }

    const fetchPayments = async () => {
      try {
        setLoading(true);
        const data = await adminPaymentService.getPaymentsForWorker(workerId);
        setPayments(data);
        setError(null);
      } catch (err) {
        console.error('[WorkerPaymentHistoryTab] Error fetching payments:', err);
        setError('Failed to load payments');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [workerId]);

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
  };

  const handleCloseModal = () => {
    setSelectedPayment(null);
  };

  if (loading) {
    return <div className="p-4 text-gray-500">Loading payments...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (!payments || payments.length === 0) {
    return <div className="p-4 text-gray-500">No payments found.</div>;
  }

  return (
    <div className="bg-white p-4 rounded shadow relative">
      <h2 className="text-xl font-semibold mb-2">Payment History</h2>

      {/* Table of payments */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map((pmt) => (
              <tr key={pmt.id}>
                <td className="py-3 px-3 text-sm text-gray-700 whitespace-nowrap">
                  {pmt.date ? pmt.date.toLocaleDateString() : 'N/A'}
                </td>
                <td className="py-3 px-3 text-sm text-gray-700 whitespace-nowrap">
                  {pmt.amount} {pmt.currency}
                </td>
                <td className="py-3 px-3 text-sm text-gray-700 whitespace-nowrap">
                  {pmt.paymentType || 'N/A'}
                </td>
                <td className="py-3 px-3 text-sm">
                  <span
                    className={
                      pmt.status === 'completed'
                        ? 'px-2 py-1 text-xs rounded bg-green-100 text-green-800'
                        : pmt.status === 'processing'
                        ? 'px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800'
                        : 'px-2 py-1 text-xs rounded bg-gray-200 text-gray-800'
                    }
                  >
                    {pmt.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-sm">
                  <button
                    onClick={() => handleViewDetails(pmt)}
                    className="px-3 py-1 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Detail Modal: use your existing Modal component */}
      <Modal
        isOpen={!!selectedPayment}
        onClose={handleCloseModal}
        title="Payment Details"
      >
        {selectedPayment && (
          <div className="p-4 space-y-3">
            <p>
              <strong>Amount:</strong> {selectedPayment.amount}{' '}
              {selectedPayment.currency}
            </p>
            <p>
              <strong>Date:</strong>{' '}
              {selectedPayment.date
                ? selectedPayment.date.toLocaleDateString()
                : 'N/A'}
            </p>
            <p>
              <strong>Type:</strong>{' '}
              {selectedPayment.paymentType || 'N/A'}
            </p>
            <p>
              <strong>Status:</strong> {selectedPayment.status}
            </p>

            {/* Comments */}
            {selectedPayment.comments ? (
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-700">
                  <strong>Comment:</strong> {selectedPayment.comments.text}
                </p>
                <p className="text-xs text-gray-500">
                  by <em>{selectedPayment.comments.userID}</em>{' '}
                  on{' '}
                  {selectedPayment.comments.createdAt
                    ? selectedPayment.comments.createdAt.toLocaleString()
                    : 'N/A'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No comments for this payment.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WorkerPaymentHistoryTab;
