import React from 'react';

const NotificationList = ({ notifications }) => {
  return (
    <ul className="bg-white shadow rounded-lg divide-y divide-gray-200">
      {notifications.map((notification) => (
        <li key={notification.id} className="p-4 hover:bg-gray-50">
          <p className="text-sm text-gray-700">{notification.message}</p>
        </li>
      ))}
    </ul>
  );
};

export default NotificationList;