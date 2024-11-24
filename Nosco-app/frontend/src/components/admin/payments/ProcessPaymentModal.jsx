import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

const ProcessPaymentModal = ({ 
  payment, 
  isOpen, 
  onClose, 
  onStatusUpdate,
  onCommentAdd 
}) => {
  const [paymentMethod, setPaymentMethod] = useState(payment?.paymentMethod || '');
  const [referenceNumber, setReferenceNumber] = useState(payment?.referenceNumber || '');
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!payment || !isOpen) return null;

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      const dateObj = date?.toDate?.() ? date.toDate() : new Date(date);
      return format(dateObj, 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return '-';
    }
  };

  // Determine available next statuses based on current status
  const getAvailableStatuses = () => {
    switch (payment.status) {
      case 'pending':
        return ['processing'];
      case 'processing':
        return ['completed', 'failed'];
      default:
        return [];
    }
  };

  // Get required comment template based on status change
  const getCommentTemplate = (status) => {
    switch (status) {
      case 'processing':
        return `Payment being processed via ${paymentMethod}. Reference: ${referenceNumber}. `;
      case 'completed':
        return `Payment completed. Final reference: ${referenceNumber}. `;
      case 'failed':
        return 'Payment failed. Reason: ';
      default:
        return '';
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setLoading(true);
    try {
      await onStatusUpdate(payment.id, {
        newStatus,
        paymentMethod,
        referenceNumber,
        comment
      });
      onClose();
    } catch (error) {
      console.error('Error updating payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status) => {
    setNewStatus(status);
    setComment(getCommentTemplate(status));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full m-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {getStatusIcon(payment.status)}
            <h2 className="text-xl font-semibold">Process Payment</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm text-gray-500">Worker</label>
              <p className="font-medium">{payment.userName || payment.userID}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Amount</label>
              <p className="font-medium">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: payment.currency || 'USD'
                }).format(payment.amount || 0)}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Payment Type</label>
              <p className="font-medium">
                {payment.paymentType
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .trim()}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Current Status</label>
              <p className="font-medium capitalize">{payment.status}</p>
            </div>
          </div>

          {/* Processing Form */}
          {payment.status !== 'completed' && (
            <form onSubmit={handleStatusUpdate} className="space-y-4 border-t pt-4">
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                  className="w-full p-2 border rounded-md focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Payment Method</option>
                  <option value="bankTransfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  required
                  className="w-full p-2 border rounded-md focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter reference number"
                />
              </div>

              {/* Status Update */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Update Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  required
                  className="w-full p-2 border rounded-md focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select New Status</option>
                  {getAvailableStatuses().map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comment
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  rows={3}
                  className="w-full p-2 border rounded-md focus:ring-1 focus:ring-blue-500"
                  placeholder="Add processing details or notes..."
                />
              </div>

              <button
                type="submit"
                disabled={loading || !newStatus || !comment.trim()}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300"
              >
                {loading ? 'Updating...' : 'Update Payment Status'}
              </button>
            </form>
          )}

          {/* Comments History */}
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium">Processing History</h3>
            </div>

            <div className="space-y-4">
              {payment.comments ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">{payment.comments.userID}</span>
                    <span className="text-sm text-gray-500">
                      {formatDate(payment.comments.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700">{payment.comments.text}</p>
                </div>
              ) : (
                <p className="text-gray-500">No processing history yet</p>
              )}
            </div>
          </div>

          {/* Standalone Comment Section */}
            {payment.status !== 'completed' && (
            <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium mb-4">Add Comment</h3>
                <div className="space-y-4">
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-1 focus:ring-blue-500"
                    placeholder="Add a comment without changing status..."
                    rows={3}
                />
                <button
                    type="button"
                    onClick={() => {
                    if (comment.trim()) {
                        onCommentAdd(payment.id, comment);
                        setComment('');
                    }
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                    Add Comment
                </button>
                </div>
            </div>
            )}

            {/* Processing History Section - Update to include all history types */}
            <div className="mt-6 border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-medium">Processing History</h3>
            </div>

            <div className="space-y-4">
                {payment.processingHistory ? (
                payment.processingHistory.map((entry, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                        <span className="font-medium">{entry.adminId}</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            entry.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            entry.status === 'completed' ? 'bg-green-100 text-green-800' :
                            entry.status === 'comment' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                            {entry.status}
                        </span>
                        </div>
                        <span className="text-sm text-gray-500">
                        {formatDate(entry.timestamp)}
                        </span>
                    </div>
                    <p className="text-gray-700">{entry.comment}</p>
                    {entry.paymentMethod && (
                        <p className="text-sm text-gray-500 mt-1">
                        Method: {entry.paymentMethod}, Ref: {entry.referenceNumber}
                        </p>
                    )}
                    </div>
                ))
                ) : (
                <p className="text-gray-500">No processing history yet</p>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessPaymentModal;