// ExpenseFilterModal.jsx
import React, { useState, useEffect } from 'react';

const ExpenseFilterModal = ({ isOpen, onClose, onApplyFilters, activeFilters }) => {
  // Initialize filters with activeFilters when modal opens
  const [filters, setFilters] = useState({
    dateRange: {
      start: '',
      end: ''
    },
    expenseType: '',
    expenseCategory: '',
    amount: {
      min: '',
      max: ''
    }
  });

  // Update filters when modal opens or activeFilters change
  useEffect(() => {
    if (isOpen && activeFilters) {
      setFilters(prev => ({
        dateRange: {
          start: activeFilters.dateRange?.start || '',
          end: activeFilters.dateRange?.end || ''
        },
        expenseType: activeFilters.expenseType || '',
        expenseCategory: activeFilters.expenseCategory || '',
        amount: {
          min: activeFilters.amount?.min || '',
          max: activeFilters.amount?.max || ''
        }
      }));
    }
  }, [isOpen, activeFilters]);

  const handleReset = () => {
    setFilters({
      dateRange: {
        start: '',
        end: ''
      },
      expenseType: '',
      expenseCategory: '',
      amount: {
        min: '',
        max: ''
      }
    });
  };

  const handleApply = () => {
    // Only include non-empty filters
    const appliedFilters = {};
    
    if (filters.dateRange.start || filters.dateRange.end) {
      appliedFilters.dateRange = {};
      if (filters.dateRange.start) appliedFilters.dateRange.start = filters.dateRange.start;
      if (filters.dateRange.end) appliedFilters.dateRange.end = filters.dateRange.end;
    }
    
    if (filters.expenseType !== '') {
      appliedFilters.expenseType = filters.expenseType;
    }
    
    if (filters.expenseCategory !== '') {
      appliedFilters.expenseCategory = filters.expenseCategory;
    }
    
    if (filters.amount.min || filters.amount.max) {
      appliedFilters.amount = {};
      if (filters.amount.min) appliedFilters.amount.min = filters.amount.min;
      if (filters.amount.max) appliedFilters.amount.max = filters.amount.max;
    }

    onApplyFilters(appliedFilters);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${isOpen ? 'block' : 'hidden'} m-0`}>
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="bg-white px-6 py-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Advanced Filters</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-nosco-red focus:border-nosco-red"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-nosco-red focus:border-nosco-red"
                  />
                </div>
              </div>

              {/* Expense Category (Company vs Worker) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Category
                </label>
                <select
                  value={filters.expenseCategory}
                  onChange={(e) => setFilters(prev => ({ ...prev, expenseCategory: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-nosco-red focus:border-nosco-red"
                >
                  <option value="">All Categories</option>
                  <option value="company">Company Expenses</option>
                  <option value="worker">Worker Expenses</option>
                </select>
              </div>

              {/* Specific Expense Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Type
                </label>
                <select
                  value={filters.expenseType}
                  onChange={(e) => setFilters(prev => ({ ...prev, expenseType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-nosco-red focus:border-nosco-red"
                >
                  <option value="">All Types</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Plane Tickets">Plane Tickets</option>
                  <option value="Transportation">Transportation</option>
                  {/* Add other expense types as needed */}
                </select>
              </div>


              {/* Amount Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={filters.amount.min}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      amount: { ...prev.amount, min: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-nosco-red focus:border-nosco-red"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={filters.amount.max}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      amount: { ...prev.amount, max: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-nosco-red focus:border-nosco-red"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Reset Filters
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-sm font-medium text-white bg-nosco-red border border-transparent rounded-md hover:bg-nosco-red-dark"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseFilterModal;