// src/components/common/Notification.jsx
import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

const Notification = ({ type, message, onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
  const borderColor = type === 'success' ? 'border-green-200' : 'border-red-200';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 mb-4`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${textColor}`} />
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${textColor}`}>{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={onClose}
            className={`inline-flex rounded-md p-1.5 ${textColor} hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;