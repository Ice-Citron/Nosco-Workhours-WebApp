// src/components/notifications/NotificationList.jsx
export const NotificationList = () => {
    const { user } = useAuth();
    const notificationsQuery = getNotificationsQuery(user.uid);
    const [notifications, loading] = useCollectionData(notificationsQuery);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [typeFilter, setTypeFilter] = useState('all');
  
    const filteredNotifications = notifications?.filter(
      notification => typeFilter === 'all' || notification.type === typeFilter
    );
  
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <select
            className="rounded-md border p-2"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Notifications</option>
            <option value="expense">Expenses</option>
            <option value="payment">Payments</option>
            <option value="project">Projects</option>
          </select>
          <button
            onClick={() => markAllAsRead(user.uid)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Mark All as Read
          </button>
        </div>
        
        {loading ? (
          <div>Loading notifications...</div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications?.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => setSelectedNotification(notification)}
              />
            ))}
          </div>
        )}
        
        {selectedNotification && (
          <NotificationModal
            notification={selectedNotification}
            onClose={() => setSelectedNotification(null)}
          />
        )}
      </div>
    );
  };