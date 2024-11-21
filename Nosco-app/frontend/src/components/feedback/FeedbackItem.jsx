import React from 'react';

const FeedbackItem = ({ feedback }) => {
  const { subject, message, status, createdAt, adminResponse } = feedback;

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'text-blue-500';
      case 'In Progress': return 'text-yellow-500';
      case 'Resolved': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{subject}</h3>
        <span className={`text-sm ${getStatusColor(status)}`}>
          {status}
        </span>
      </div>

      <p className="text-sm text-gray-600">{message}</p>

      <div className="text-xs text-gray-500">
        Submitted: {new Date(createdAt).toLocaleDateString()}
      </div>

      {adminResponse && (
        <div className="mt-3 pl-4 border-l-2 border-blue-200">
          <p className="text-sm font-medium">Admin Response:</p>
          <p className="text-sm text-gray-600">{adminResponse}</p>
        </div>
      )}
    </div>
  );
};

export default FeedbackItem;