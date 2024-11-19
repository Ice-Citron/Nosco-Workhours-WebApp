// src/components/notifications/NotificationItem.jsx
import PropTypes from 'prop-types';


export const NotificationItem = ({ notification, onClick }) => {
    const getIcon = (type) => {
      switch(type) {
        case 'expense': return '💰';
        case 'payment': return '💳';
        case 'project': return '📋';
        default: return '📬';
      }
    };
  
    return (
      <div
        onClick={onClick}
        className={`p-4 rounded-md border cursor-pointer hover:bg-gray-50 
          ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">{getIcon(notification.type)}</span>
          <div className="flex-1">
            <h3 className="font-medium">{notification.title}</h3>
            <p className="text-sm text-gray-600">{notification.message}</p>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(notification.createdAt?.toDate()).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  NotificationItem.propTypes = {
    notification: PropTypes.shape({
      type: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      createdAt: PropTypes.object.isRequired,
      read: PropTypes.bool.isRequired
    }).isRequired,
    onClick: PropTypes.func.isRequired
  };