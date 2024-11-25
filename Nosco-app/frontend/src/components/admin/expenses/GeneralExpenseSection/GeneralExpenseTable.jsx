import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { adminExpenseService } from '../../../../services/adminExpenseService';

const GeneralExpenseTable = ({ 
  filters, 
  onViewDetails, 
  onEdit, 
  tableType 
}) => {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc'
  });

  useEffect(() => {
    loadExpenses();
  }, [filters, tableType, sortConfig]);

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      let data = await adminExpenseService.getAllExpenses({
        status: tableType === 'historical' ? 'approved' : 'rejected'
      });
  
      // Apply filters
      data = data.filter(expense => {
        if (filters.expenseCategory && filters.expenseCategory !== '') {
          if (filters.expenseCategory === 'company' && !expense.isGeneralExpense) return false;
          if (filters.expenseCategory === 'worker' && expense.isGeneralExpense) return false;
        }
  
        // Only apply expense type filter if a specific type is selected
        if (filters.expenseType && filters.expenseType !== '') {
          if (expense.expenseType !== filters.expenseType) return false;
        }
  
        // Filter by date range
        if (filters.dateRange?.start) {
          const startDate = new Date(filters.dateRange.start);
          if (expense.date.toDate() < startDate) return false;
        }
        if (filters.dateRange?.end) {
          const endDate = new Date(filters.dateRange.end);
          if (expense.date.toDate() > endDate) return false;
        }
  
        // Filter by amount
        if (filters.amount?.min && expense.amount < parseFloat(filters.amount.min)) return false;
        if (filters.amount?.max && expense.amount > parseFloat(filters.amount.max)) return false;
  
        return true;
      });
  
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nosco-red"></div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No {tableType === 'historical' ? 'historical' : 'rejected'} expenses found
      </div>
    );
  }

  return (
    <table className="min-w-full">
      <thead>
        <tr>
          <th className="text-xs font-medium text-gray-500 uppercase text-left py-3">
            DATE ↓
          </th>
          <th className="text-xs font-medium text-gray-500 uppercase text-left py-3">
            EXPENSE TYPE
          </th>
          <th className="text-xs font-medium text-gray-500 uppercase text-left py-3">
            AMOUNT
          </th>
          <th className="text-xs font-medium text-gray-500 uppercase text-left py-3">
            PROJECT
          </th>
          <th className="text-xs font-medium text-gray-500 uppercase text-left py-3">
            DESCRIPTION
          </th>
          <th className="text-xs font-medium text-gray-500 uppercase text-left py-3">
            TYPE
          </th>
          <th className="text-xs font-medium text-gray-500 uppercase text-left py-3">
            STATUS
          </th>
          <th className="text-xs font-medium text-gray-500 uppercase text-left py-3">
            ACTIONS
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {expenses.map((expense) => (
          <tr key={expense.id}>
            <td className="py-4">
              {format(expense.date.toDate(), 'MMM d, yyyy')}
            </td>
            <td className="py-4">
              {expense.expenseType}
            </td>
            <td className="py-4">
              {expense.amount.toFixed(2)} {expense.currency}
            </td>
            <td className="py-4">
              {expense.projectID ? expense.project?.name : 'N/A'}
            </td>
            <td className="py-4">
              {expense.description}
            </td>
            <td className="py-4">
              {expense.isGeneralExpense ? 'Company' : 'Worker'}
            </td>
            <td className="py-4">
              <span className={`px-2 py-1 rounded text-sm ${
                expense.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {expense.status === 'approved' ? 'Approved' : 'Rejected'}
              </span>
            </td>
            <td className="py-4">
              <div className="flex gap-2">
                <button
                  onClick={() => onViewDetails(expense)}
                  className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition text-sm"
                >
                  View Details
                </button>
                <button
                  onClick={() => onEdit(expense)}
                  className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition text-sm"
                >
                  Edit
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default GeneralExpenseTable;