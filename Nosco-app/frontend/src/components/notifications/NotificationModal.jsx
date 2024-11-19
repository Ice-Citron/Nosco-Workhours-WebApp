// src/components/notifications/NotificationModal.jsx
import { markAsRead } from '../../services/notificationService';

export const NotificationModal = ({ notification, onClose }) => {
    const handleMarkAsRead = async () => {
      await markAsRead(notification.id);
      onClose();
    };
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-lg w-full m-4">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">{notification.title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ×
            </button>
          </div>
          
          <div className="space-y-4">
            <p>{notification.message}</p>
            {notification.link && (
              <a
                href={notification.link}
                className="text-blue-500 hover:underline block"
              >
                View Details
              </a>
            )}
            <div className="text-sm text-gray-500">
              {new Date(notification.createdAt?.toDate()).toLocaleString()}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleMarkAsRead}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              Mark as {notification.read ? 'Unread' : 'Read'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };