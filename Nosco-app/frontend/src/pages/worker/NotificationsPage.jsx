// pages/NotificationsPage.jsx
import React from 'react';
import { NotificationList } from '../../components/notifications/NotificationList';

const NotificationsPage = () => {
  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Notifications</h1>
          <NotificationList />
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;