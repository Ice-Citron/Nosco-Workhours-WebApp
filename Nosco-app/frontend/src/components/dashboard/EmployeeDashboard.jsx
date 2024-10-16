// src/components/dashboard/EmployeeDashboard.jsx
import React, { useEffect, useState, useContext } from 'react';
import { userService } from '../../services/userService';
import { AuthContext } from '../../context/AuthContext';
import ProfileSummary from '../profile/ProfileSummary';
import QuickActions from './QuickActions';
import RecentActivities from './RecentActivities';
import Notification from '../common/Notification';

const EmployeeDashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const getUserData = async () => {
      const data = await userService.fetchUserData(currentUser.uid);
      setUserData(data);
    };
    getUserData();
  }, [currentUser]);

  useEffect(() => {
    // Subscribe to Firestore real-time updates for notifications
    const unsubscribe = userService.subscribeToNotifications(currentUser.uid, (newNotifications) => {
      setNotifications(newNotifications);
    });
    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className="dashboard-container">
      <ProfileSummary data={userData} />
      <QuickActions />
      <RecentActivities activities={userData?.activities} />
      {notifications.map((note) => (
        <Notification key={note.id} message={note.message} type={note.type} />
      ))}
    </div>
  );
};

export default EmployeeDashboard;
