import React from 'react';
import { X, User, MessageSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';

const PaymentDetailsModal = ({ payment, isOpen, onClose, onCommentAdd }) => {
  if (!payment || !isOpen) return null;

  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = date?.toDate?.() ? date.toDate() : new Date(date);
    return format(dateObj, 'MMM dd, yyyy HH:mm');
  };

  // Handle background click
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
      onClick={handleBackgroundClick}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full m-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Payment Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content - Make Scrollable */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Basic Info Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <div className="text-sm text-gray-500">Date</div>
              <div className="mt-1 font-medium">
                {formatDate(payment.date)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Amount</div>
              <div className="mt-1 font-medium">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: payment.currency || 'USD'
                }).format(payment.amount || 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Type</div>
              <div className="mt-1 font-medium capitalize">
                {payment.paymentType
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .trim()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className="mt-1">
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
          </div>

          {/* Bank Account */}
          {payment.bankAccount && (
            <div>
              <div className="text-sm text-gray-500">Bank Account</div>
              <div className="mt-1 font-medium">{payment.bankAccount}</div>
            </div>
          )}

          {/* Description */}
          <div>
            <div className="text-sm text-gray-500">Description</div>
            <div className="mt-1 font-medium">{payment.description}</div>
          </div>

          {/* Reference Number */}
          {payment.referenceNumber && (
            <div>
              <div className="text-sm text-gray-500">Reference Number</div>
              <div className="mt-1 font-medium">{payment.referenceNumber}</div>
            </div>
          )}

          {/* Admin Comments Section */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium">Comments</h3>
            </div>

            <div className="space-y-4">
              {payment.comments ? (
                <div 
                  className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-700">
                        {payment.comments.userID}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(payment.comments.createdAt)}
                    </div>
                  </div>
                  
                  <div className="text-gray-800 mt-2">
                    {payment.comments.text}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">No comments yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;