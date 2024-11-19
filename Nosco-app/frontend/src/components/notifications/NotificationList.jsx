// components/notifications/NotificationList.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { getNotificationsQuery, markAllAsRead } from '../../services/notificationService';
import { NOTIFICATION_TYPES } from '../../utils/constants';

import { NotificationItem } from './NotificationItem';


export const NotificationList = () => {
  const { user } = useAuth();
  const notificationsQuery = getNotificationsQuery(user?.uid);
  const [notifications, loading, error] = useCollectionData(notificationsQuery);
  const [typeFilter, setTypeFilter] = useState('all');

  console.log('Notifications:', notifications); // Debug log
  console.log('Loading:', loading);
  console.log('Error:', error);

  const filteredNotifications = notifications?.filter(
    notification => typeFilter === 'all' || notification.type === typeFilter
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border p-2"
        >
          <option value="all">All Notifications</option>
          {Object.values(NOTIFICATION_TYPES).map(type => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
        <button
          onClick={() => markAllAsRead(user?.uid)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          Mark All as Read
        </button>
      </div>
      
      {loading ? (
        <div>Loading notifications...</div>
      ) : error ? (
        <div>Error loading notifications: {error.message}</div>
      ) : notifications?.length === 0 ? (
        <div>No notifications found</div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications?.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))}
        </div>
      )}
    </div>
  );
};