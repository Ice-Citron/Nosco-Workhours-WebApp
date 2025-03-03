// src/components/common/NotificationList.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const NotificationList = ({ notifications }) => {
  const formatDate = (date) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="max-h-64 overflow-y-auto">
        {notifications.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <li key={notification.id} className="p-4 hover:bg-gray-50">
                <Link 
                  to={notification.link || '#'} 
                  className="block no-underline"
                >
                  <div className="flex justify-between">
                    <p className={`text-sm font-medium ${notification.read ? 'text-gray-900' : 'text-nosco-red'}`}>
                      {notification.title}
                    </p>
                    {notification.createdAt && (
                      <p className="text-xs text-gray-500">
                        {formatDate(notification.createdAt)}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-center text-gray-500">
            No notifications to display.
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationList;
