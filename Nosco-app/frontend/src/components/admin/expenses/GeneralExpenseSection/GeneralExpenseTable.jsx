// GeneralExpenseTable.jsx
import React, { useState, useEffect } from 'react';
import { adminExpenseService } from '../../../../services/adminExpenseService';
import GeneralExpenseModal from './GeneralExpenseModal';
import ExpenseDetailsModal from '../ExpenseApprovalSection/ExpenseDetailsModal';

const GeneralExpenseTable = () => {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc'
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const generalExpenses = await adminExpenseService.getGeneralExpenses();
      setExpenses(generalExpenses);
    } catch (error) {
      console.error('Error loading general expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedExpenses = [...expenses].sort((a, b) => {
    if (sortConfig.key === 'date') {
      const compareResult = a.date.seconds - b.date.seconds;
      return sortConfig.direction === 'asc' ? compareResult : -compareResult;
    }
    if (sortConfig.key === 'amount') {
      const compareResult = a.amount - b.amount;
      return sortConfig.direction === 'asc' ? compareResult : -compareResult;
    }
    return 0;
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">General Expenses</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add General Expense
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                onClick={() => handleSort('date')}
              >
                Date {sortConfig.key === 'date' && (
                  sortConfig.direction === 'asc' ? '↑' : '↓'
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Expense Type
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                onClick={() => handleSort('amount')}
              >
                Amount {sortConfig.key === 'amount' && (
                  sortConfig.direction === 'asc' ? '↑' : '↓'
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedExpenses.map((expense) => (
              <tr key={expense.id}>
                <td className="px-6 py-4">
                  {new Date(expense.date.seconds * 1000).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">{expense.expenseType}</td>
                <td className="px-6 py-4">
                  {expense.amount.toFixed(2)} {expense.currency}
                </td>
                <td className="px-6 py-4">
                  {expense.project?.name || 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <div className="truncate max-w-xs">
                    {expense.description}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => {
                      setSelectedExpense(expense);
                      setShowDetailsModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <GeneralExpenseModal
          onClose={() => setShowAddModal(false)}
          onSubmit={async (data) => {
            try {
              await adminExpenseService.createGeneralExpense(data);
              loadExpenses();
              setShowAddModal(false);
            } catch (error) {
              console.error('Error creating general expense:', error);
            }
          }}
        />
      )}

      {showDetailsModal && selectedExpense && (
        <ExpenseDetailsModal
          expense={selectedExpense}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedExpense(null);
          }}
        />
      )}
    </div>
  );
};

export default GeneralExpenseTable;