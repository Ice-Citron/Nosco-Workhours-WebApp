import React from 'react';
import Modal from '../common/Modal';
import PaymentCommentSection from './PaymentCommentSection';

const PaymentDetailsModal = ({ payment, isOpen, onClose, onCommentAdd }) => {
  if (!payment) return null;

  const formatDate = (date) => {
    if (!date) return '';
    return date?.toDate?.() 
      ? date.toDate().toLocaleDateString()
      : new Date(date).toLocaleDateString();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Details"
    >
      <div className="space-y-6">
        {/* Payment Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-medium">{formatDate(payment.date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Amount</p>
            <p className="font-medium">
              {payment.currency} {parseFloat(payment.amount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="font-medium">
              {payment.paymentType.charAt(0).toUpperCase() + 
               payment.paymentType.slice(1).replace(/([A-Z])/g, ' $1')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span className={`px-2 py-1 rounded-full text-sm inline-block ${
              payment.status === 'completed' ? 'bg-green-100 text-green-800' :
              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              payment.status === 'processing' ? 'bg-blue-100 text-blue-800' :
              payment.status === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Payment Description */}
        <div>
          <p className="text-sm text-gray-500">Description</p>
          <p className="mt-1">{payment.description}</p>
        </div>

        {/* Reference Information */}
        {payment.referenceNumber && (
          <div>
            <p className="text-sm text-gray-500">Reference Number</p>
            <p className="font-medium">{payment.referenceNumber}</p>
          </div>
        )}

        {/* Payment Method */}
        {payment.paymentMethod && payment.paymentMethod !== 'pending' && (
          <div>
            <p className="text-sm text-gray-500">Payment Method</p>
            <p className="font-medium">
              {payment.paymentMethod.charAt(0).toUpperCase() + 
               payment.paymentMethod.slice(1).replace(/([A-Z])/g, ' $1')}
            </p>
          </div>
        )}

        {/* Comments Section */}
        <PaymentCommentSection
          comments={payment.comments || []}
          onCommentAdd={onCommentAdd}
        />
      </div>
    </Modal>
  );
};

export default PaymentDetailsModal;