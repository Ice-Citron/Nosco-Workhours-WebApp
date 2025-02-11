import React from 'react';
import { X, User, MessageSquare, Clock, ArrowRightCircle } from 'lucide-react';
import { format } from 'date-fns';

// We'll pass in `expenseDictionary` from PaymentHistoryPage
const PaymentDetailsModal = ({
  payment,
  project,
  expenseDictionary,
  isOpen,
  onClose,
  onCommentAdd,
}) => {
  
  const [commentText, setCommentText] = React.useState('');
  
  if (!payment || !isOpen) return null;

  const formatDateTime = (val) => {
    if (!val) return '';
    const dateObj = val?.toDate?.() ? val.toDate() : new Date(val);
    return format(dateObj, 'MMM dd, yyyy HH:mm');
  };

  // For multiple expenses
  const linkedExpenses = Array.isArray(payment.relatedExpenseIDs)
    ? payment.relatedExpenseIDs.map((eid) => expenseDictionary[eid])
    : [];

  // If you want a simple comment input:
  // (this is optional code—just a small text input for adding comments)
  const handleCommentSubmit = () => {
    if (onCommentAdd && commentText.trim()) {
      onCommentAdd(commentText.trim());
      setCommentText('');
    }
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
      <div
        className="bg-white rounded-lg max-w-2xl w-full m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Payment Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Basic Info Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <div className="text-sm text-gray-500">Date</div>
              <div className="mt-1 font-medium">{formatDateTime(payment.date)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Amount</div>
              <div className="mt-1 font-medium">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: payment.currency || 'USD',
                }).format(payment.amount || 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Type</div>
              <div className="mt-1 font-medium capitalize">
                {payment.paymentType
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, (str) => str.toUpperCase())
                  .trim()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className="mt-1">
                <span
                  className={`px-2 py-1 rounded-full text-sm inline-block ${
                    payment.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : payment.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : payment.status === 'processing'
                      ? 'bg-blue-100 text-blue-800'
                      : payment.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Created By */}
          {payment.createdBy && (
            <div>
              <div className="text-sm text-gray-500">Created By</div>
              <div className="mt-1 font-medium">{payment.createdBy}</div>
            </div>
          )}

          {/* Project */}
          {project && (
            <div>
              <div className="text-sm text-gray-500">Project</div>
              <div className="mt-1 font-medium">{project.name}</div>
            </div>
          )}

          {/* Bank Account */}
          {payment.bankAccount && (
            <div>
              <div className="text-sm text-gray-500">Bank Account</div>
              <div className="mt-1 font-medium">{payment.bankAccount}</div>
            </div>
          )}

          {/* Payment Method */}
          {payment.paymentMethod && (
            <div>
              <div className="text-sm text-gray-500">Payment Method</div>
              <div className="mt-1 font-medium">{payment.paymentMethod}</div>
            </div>
          )}

          {/* Description */}
          {payment.description && (
            <div>
              <div className="text-sm text-gray-500">Description</div>
              <div className="mt-1 font-medium">{payment.description}</div>
            </div>
          )}

          {/* Reference Number */}
          {payment.referenceNumber && (
            <div>
              <div className="text-sm text-gray-500">Reference Number</div>
              <div className="mt-1 font-medium">{payment.referenceNumber}</div>
            </div>
          )}

          {/* Linked Expenses */}
          {linkedExpenses.length > 0 && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Linked Expenses</div>
              <ul className="list-disc list-inside space-y-1">
                {linkedExpenses.map((exp, idx) => {
                  if (!exp) {
                    return (
                      <li key={idx} className="text-gray-500 text-sm">
                        Expense not found
                      </li>
                    );
                  }
                  return (
                    <li key={exp.id} className="text-sm">
                      <span className="font-medium text-gray-700">
                        {exp.expenseType || 'Unknown'}:
                      </span>{' '}
                      {exp.amount
                        ? new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: exp.currency || 'USD',
                          }).format(exp.amount)
                        : ''}
                      {' - '}
                      {exp.status || 'Unknown'}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Processing History */}
          {Array.isArray(payment.processingHistory) && payment.processingHistory.length > 0 && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Processing History</div>
              <div className="space-y-2">
                {payment.processingHistory.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                    <ArrowRightCircle className="h-4 w-4 text-gray-600 mt-1" />
                    <div className="text-sm">
                      <div className="text-gray-800 font-medium">
                        Status: {item.status}
                      </div>
                      {item.paymentMethod && (
                        <div className="text-gray-600">
                          Method: {item.paymentMethod}
                        </div>
                      )}
                      {item.referenceNumber && (
                        <div className="text-gray-600">
                          Reference: {item.referenceNumber}
                        </div>
                      )}
                      <div className="text-gray-600">
                        {item.comment || '(No comment)'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDateTime(item.timestamp)} by {item.adminId}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section (existing single comment) */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium">Latest Comment</h3>
            </div>

            {payment.comments ? (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">
                      {payment.comments.userID}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(payment.comments.createdAt)}
                  </div>
                </div>

                <div className="text-gray-800 mt-2">{payment.comments.text}</div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No comments yet</div>
            )}

            {/* Optional: worker can add comment if onCommentAdd is provided */}
            {onCommentAdd && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Comment
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleCommentSubmit}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded"
                  >
                    Post
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;
