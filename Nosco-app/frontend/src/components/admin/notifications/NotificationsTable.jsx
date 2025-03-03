// components/admin/notifications/NotificationsTable.jsx
import React from 'react';

const NotificationsTable = ({ 
  notifications, 
  title, 
  selectedNotifications,
  onSelectNotification,
  onSelectAll 
}) => {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Invalid Date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (notifications.length === 0) {
    return null;
  }

  // Get IDs of all notifications in this table
  const notificationIds = notifications.map(n => n.id);
  
  // Check if all notifications in this table are selected
  const allSelected = notifications.length > 0 && 
    notifications.every(n => selectedNotifications.includes(n.id));

  // Handle select all for only this table's notifications
  const handleSelectAll = (isChecked) => {
    // Pass the notification IDs from this table to the parent handler
    onSelectAll(isChecked, notificationIds);
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-medium">{title}</h2>
        <div className="flex items-center">
          <label className="inline-flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              onChange={(e) => handleSelectAll(e.target.checked)}
              checked={allSelected}
              className="h-4 w-4 text-nosco-red focus:ring-nosco-red border-gray-300 rounded mr-2"
            />
            Select All
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-[450px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="w-8 px-4 py-3">
                    <input
                      type="checkbox"
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      checked={allSelected}
                      className="h-4 w-4 text-nosco-red focus:ring-nosco-red border-gray-300 rounded"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <tr key={notification.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        onChange={() => onSelectNotification(notification.id)}
                        checked={selectedNotifications.includes(notification.id)}
                        className="h-4 w-4 text-nosco-red focus:ring-nosco-red border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-500 max-w-lg">
                        {notification.message}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(notification.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${notification.read ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                        {notification.read ? 'Read' : 'Unread'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsTable;
