import React from 'react';

const ExpenseItem = ({ expense, onClick }) => {
  const {
    date,
    expenseType,
    amount,
    currency,
    projectName,
    status,
    pointsAwarded,
    description
  } = expense;

  // Add date conversion handling
  const formatDate = (date) => {
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    if (date?.toDate) {
      return date.toDate().toLocaleDateString();
    }
    return 'Invalid Date';
  };

  return (
    <div 
      onClick={() => onClick?.(expense)}
      className="p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors duration-150 ease-in-out"
    >
      <div className="grid grid-cols-6 gap-4">
        <div>
            <p className="text-sm text-gray-600">Date</p>
            <p className="font-medium">{formatDate(date)}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600">Type</p>
          <p className="font-medium">{expenseType}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600">Amount</p>
          <p className="font-medium">{amount.toFixed(2)} {currency}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600">Project</p>
          <p className="font-medium">{projectName || '-'}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-600">Status</p>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
            status === 'approved' ? 'bg-green-100 text-green-800' :
            status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        
        <div>
          <p className="text-sm text-gray-600">Points</p>
          <p className="font-medium">{pointsAwarded || '-'}</p>
        </div>
      </div>
      
      {description && (
        <div className="mt-2">
          <p className="text-sm text-gray-600">Description</p>
          <p className="text-sm text-gray-800">{description}</p>
        </div>
      )}
    </div>
  );
};

export default ExpenseItem;