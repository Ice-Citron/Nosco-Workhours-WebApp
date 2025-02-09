// src/components/admin/workers/WorkerExpenseHistoryTab.jsx
import React, { useEffect, useState } from 'react';
import { expenseService } from '../../../services/expenseService';
import Modal from '../../common/Modal';

const WorkerExpenseHistoryTab = ({ workerId }) => {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState(null);

  // For the modal
  const [selectedExpense, setSelectedExpense] = useState(null);

  useEffect(() => {
    if (!workerId) {
      console.log('[WorkerExpenseHistoryTab] No workerId => skip fetch');
      setLoading(false);
      return;
    }

    const fetchWorkerExpenses = async () => {
      try {
        setLoading(true);
        // Use the new getExpensesForWorker function
        const data = await expenseService.getExpensesForWorker(workerId);
        console.log('[WorkerExpenseHistoryTab] got expenses:', data);
        setExpenses(data);
        setError(null);
      } catch (err) {
        console.error('[WorkerExpenseHistoryTab] error:', err);
        setError('Failed to load expenses');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkerExpenses();
  }, [workerId]);

  // Open modal with selected expense
  const handleViewDetails = (expense) => {
    setSelectedExpense(expense);
  };

  // Close modal
  const handleCloseModal = () => {
    setSelectedExpense(null);
  };

  if (loading) {
    return <div className="p-4 text-gray-500">Loading expenses...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }
  if (!expenses || expenses.length === 0) {
    return <div className="p-4 text-gray-500">No expenses found.</div>;
  }

  return (
    <div className="bg-white p-4 rounded shadow relative">
      <h2 className="text-xl font-semibold mb-2">Expense History</h2>
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
                Expense Type
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
            {expenses.map((exp) => {
              let displayDate = 'N/A';
              if (exp.date?.toDate) {
                displayDate = exp.date.toDate().toLocaleDateString();
              } else if (exp.date instanceof Date) {
                displayDate = exp.date.toLocaleDateString();
              }
              return (
                <tr key={exp.id}>
                  <td className="py-3 px-3 text-sm text-gray-700 whitespace-nowrap">
                    {displayDate}
                  </td>
                  <td className="py-3 px-3 text-sm text-gray-700 whitespace-nowrap">
                    {exp.amount} {exp.currency || 'USD'}
                  </td>
                  <td className="py-3 px-3 text-sm text-gray-700 whitespace-nowrap">
                    {exp.expenseType || 'N/A'}
                  </td>
                  <td className="py-3 px-3 text-sm">
                    <span
                      className={
                        exp.status === 'approved'
                          ? 'px-2 py-1 text-xs rounded bg-green-100 text-green-800'
                          : exp.status === 'rejected'
                          ? 'px-2 py-1 text-xs rounded bg-red-100 text-red-800'
                          : 'px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800'
                      }
                    >
                      {exp.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-sm">
                    <button
                      onClick={() => handleViewDetails(exp)}
                      className="px-3 py-1 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal for detailed view */}
      <Modal
        isOpen={!!selectedExpense}
        onClose={handleCloseModal}
        title="Expense Details"
      >
        {selectedExpense && (
          <div className="p-4 space-y-3">
            <p>
              <strong>Amount:</strong> {selectedExpense.amount}{' '}
              {selectedExpense.currency}
            </p>
            <p>
              <strong>Date:</strong>{' '}
              {selectedExpense.date?.toDate
                ? selectedExpense.date.toDate().toLocaleDateString()
                : selectedExpense.date instanceof Date
                ? selectedExpense.date.toLocaleDateString()
                : 'N/A'}
            </p>
            <p>
              <strong>Type:</strong> {selectedExpense.expenseType || 'N/A'}
            </p>
            <p>
              <strong>Status:</strong> {selectedExpense.status}
            </p>
            <p>
              <strong>Description:</strong>{' '}
              {selectedExpense.description || 'N/A'}
            </p>
            {selectedExpense.status === 'rejected' && (
              <p>
                <strong>Rejection Reason:</strong>{' '}
                {selectedExpense.rejectionReason || 'N/A'}
              </p>
            )}
            {Array.isArray(selectedExpense.receipts) &&
              selectedExpense.receipts.length > 0 && (
                <div>
                  <strong>Receipts:</strong>
                  <ul className="list-disc list-inside">
                    {selectedExpense.receipts.map((url, idx) => (
                      <li key={idx}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
            )}
            {selectedExpense.adminComments && (
              <p>
                <strong>Admin Comments:</strong> {selectedExpense.adminComments}
              </p>
            )}
            <p>
              <strong>Expense Category:</strong>{' '}
              {selectedExpense.isGeneralExpense ? 'Company / General' : 'Worker'}
            </p>
            {selectedExpense.updatedAt?.toDate && (
              <p className="text-sm text-gray-500">
                <em>
                  Last updated:{' '}
                  {selectedExpense.updatedAt.toDate().toLocaleString()}
                </em>
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WorkerExpenseHistoryTab;
