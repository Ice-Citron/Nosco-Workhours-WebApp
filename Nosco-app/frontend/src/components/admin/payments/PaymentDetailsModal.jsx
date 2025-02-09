// src/components/admin/payments/PaymentDetailsModal.jsx
import React from 'react';
import Modal from '../../common/Modal';
import { format } from 'date-fns';
import { Clock, DollarSign, FileText } from 'lucide-react';

const PaymentDetailsModal = ({ isOpen, onClose, payment, usersMapping }) => {
  if (!payment) return null;

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      const dateObj = date?.toDate ? date.toDate() : new Date(date);
      return format(dateObj, 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return '-';
    }
  };

  // Retrieve user name using the payment's userID
  const user = usersMapping && payment.userID ? usersMapping[payment.userID] : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Details">
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">User</div>
            <div className="font-medium">{user ? user.name : payment.userID}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Payment Date</div>
            <div className="font-medium">{formatDate(payment.updatedAt)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Amount</div>
            <div className="font-medium">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: payment.currency || 'USD'
              }).format(payment.amount || 0)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Reference</div>
            <div className="font-medium">{payment.referenceNumber}</div>
          </div>
          <div className="col-span-2">
            <div className="text-sm text-gray-500">Description</div>
            <div className="font-medium">{payment.description}</div>
          </div>
          <div className="col-span-2">
            <div className="text-sm text-gray-500">Payment Method</div>
            <div className="font-medium">{payment.paymentMethod || 'N/A'}</div>
          </div>
          <div className="col-span-2">
            <div className="text-sm text-gray-500">Status</div>
            <div className="font-medium">{payment.status}</div>
          </div>
          <div className="col-span-2">
            <div className="text-sm text-gray-500">Comments</div>
            <div className="font-medium">
              {payment.comments && payment.comments.text
                ? payment.comments.text
                : 'No comments'}
            </div>
          </div>
          {payment.processingHistory && payment.processingHistory.length > 0 && (
            <div className="col-span-2">
              <div className="text-sm text-gray-500">Processing History</div>
              <div className="font-medium space-y-2">
                {payment.processingHistory.map((entry, index) => (
                  <div key={index} className="border p-2 rounded">
                    <div className="text-xs text-gray-500">
                      {entry.adminId} on {formatDate(entry.timestamp)}
                    </div>
                    <div>{entry.comment}</div>
                    {entry.paymentMethod && (
                      <div className="text-xs text-gray-500">
                        {entry.paymentMethod}, Ref: {entry.referenceNumber}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PaymentDetailsModal;
