import React from 'react';
import ExpenseItem from './ExpenseItem';

const ExpenseList = ({ expenses, onExpenseClick, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-gray-100 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!expenses?.length) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No expense records found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => (
        <ExpenseItem
          key={expense.id}
          expense={expense}
          onClick={() => onExpenseClick(expense)}
        />
      ))}
    </div>
  );
};

export default ExpenseList;