// ExpenseDetailsModal.jsx
import React from 'react';
import { format } from 'date-fns';

const ExpenseDetailsModal = ({ isOpen, onClose, expense }) => {
  if (!expense) return null;

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${isOpen ? 'block' : 'hidden'} m-0`}>
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="bg-white px-6 py-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-semibold text-gray-900">Expense Details</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                <span className="text-3xl">&times;</span>
              </button>
            </div>

            {/* Main Content */}
            <div className="space-y-8">
              {/* Worker and Project Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Worker</label>
                  <p className="text-lg font-medium text-gray-900">{expense.worker?.name}</p>
                  <p className="text-sm text-gray-600">{expense.worker?.department}</p>
                </div>
                {expense.project && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Project</label>
                    <p className="text-lg font-medium text-gray-900">{expense.project?.name}</p>
                  </div>
                )}
              </div>

              {/* Expense Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Amount</label>
                    <p className="text-2xl font-semibold text-nosco-red">
                      {expense.amount.toFixed(2)} {expense.currency}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Type</label>
                    <p className="text-lg text-gray-900">{expense.expenseType}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Date</label>
                    <p className="text-lg text-gray-900">
                      {format(expense.date.toDate(), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900">{expense.description}</p>
                </div>
              </div>

              {/* Receipts */}
              {expense.receipts && expense.receipts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Receipts</label>
                  <div className="grid grid-cols-2 gap-4">
                    {expense.receipts.map((receipt, index) => (
                      <a
                        key={index}
                        href={receipt}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-gray-50 p-3 rounded-lg text-nosco-red hover:bg-gray-100 hover:text-red-700 transition-colors text-center"
                      >
                        View Receipt {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Information */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-lg font-medium text-gray-700">Status</label>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                    expense.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                  </span>
                </div>

                {/* Processing Details */}
                {expense.status !== 'pending' && (
                  <div className="space-y-4 mt-6">
                    {/* ... existing processing details code ... */}
                  </div>
                )}

                {/* Points Information */}
                {expense.pointsAwarded && (
                  <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Points Awarded
                    </label>
                    <p className="text-xl font-semibold text-nosco-red">
                      {expense.pointsAwarded} points
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDetailsModal;