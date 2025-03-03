// src/pages/worker/WorkerNotificationsPage.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { firestore as db } from '../../firebase/firebase_config';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import WorkerNotificationsTable from '../../components/worker/notifications/WorkerNotificationsTable';

// Define worker notification categories
const NOTIFICATION_CATEGORIES = {
  PROJECT: ['project_started', 'project_ended', 'project_archived', 'project_unarchived', 'project_update'],
  INVITATION: ['project_invitation', 'invitation_cancellation', 'invitation_nudge'],
  EXPENSE: ['expense_approval', 'expense_rejection'],
  WORKHOUR: ['workhour_approval', 'workhour_rejection'],
  PAYMENT: ['payment_processing', 'payment_completed', 'payment_failed'],
};

const WorkerNotificationsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [filters, setFilters] = useState({
    readStatus: 'unread',
    category: 'all'
  });
  
  // Modal state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempFilters, setTempFilters] = useState({ ...filters });

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [notifications, filters]);

  // Reset temp filters when main filters change
  useEffect(() => {
    setTempFilters({ ...filters });
  }, [filters]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userID', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const notificationsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt)
        };
      });
      
      setNotifications(notificationsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!notifications.length) {
      setFilteredNotifications([]);
      return;
    }
    
    let result = [...notifications];
    
    // Filter by read status
    if (filters.readStatus === 'read') {
      result = result.filter(notification => notification.read);
    } else if (filters.readStatus === 'unread') {
      result = result.filter(notification => !notification.read);
    }
    
    // Filter by category
    if (filters.category !== 'all') {
      const categoryKey = filters.category.toUpperCase();
      const categoryTypes = NOTIFICATION_CATEGORIES[categoryKey];
      if (categoryTypes) {
        result = result.filter(notification => 
          notification.type && categoryTypes.some(type => notification.type.includes(type))
        );
      }
    }
    
    setFilteredNotifications(result);
  };

  // Handle temp filter changes in the modal
  const handleTempFilterChange = (key, value) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply the temp filters when the modal is closed
  const applyFiltersAndCloseModal = () => {
    setFilters(tempFilters);
    setShowFilterModal(false);
  };

  // Clear all filters
  const clearFilters = () => {
    const defaultFilters = { readStatus: 'all', category: 'all' };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
    setShowFilterModal(false);
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => {
      if (prev.includes(notificationId)) {
        return prev.filter(id => id !== notificationId);
      } else {
        return [...prev, notificationId];
      }
    });
  };

  const handleSelectAll = (isSelected, notificationIds = []) => {
    if (isSelected) {
      const idsToSelect = notificationIds.length > 0 ? 
        notificationIds : 
        filteredNotifications.map(n => n.id);
        
      setSelectedNotifications(prev => {
        const newSelected = [...prev];
        idsToSelect.forEach(id => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      });
    } else {
      if (notificationIds.length > 0) {
        setSelectedNotifications(prev => 
          prev.filter(id => !notificationIds.includes(id))
        );
      } else {
        setSelectedNotifications([]);
      }
    }
  };

  const markAsRead = async () => {
    if (!selectedNotifications.length) return;
    
    try {
      const batch = [];
      for (const id of selectedNotifications) {
        const notificationRef = doc(db, 'notifications', id);
        batch.push(updateDoc(notificationRef, { read: true }));
      }
      
      await Promise.all(batch);
      
      // Update local state
      setNotifications(prev => prev.map(notification => {
        if (selectedNotifications.includes(notification.id)) {
          return { ...notification, read: true };
        }
        return notification;
      }));
      
      // Clear selection
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const getNotificationsByCategory = (category) => {
    return filteredNotifications.filter(notification => 
      notification.type && NOTIFICATION_CATEGORIES[category].some(type => notification.type.includes(type))
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nosco-red"></div>
        </div>
      ) : (
        <>
          <div>
            <div className="flex justify-end items-center gap-2 mb-6">
              {/* Filter Button */}
              <button
                onClick={() => setShowFilterModal(true)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 flex items-center gap-2 hover:bg-gray-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414v6.586a1 1 0 01-.293.707l-2 2A1 1 0 0110 22v-6.586l-6.293-6.293A1 1 0 013 8.414V4z" />
                </svg>
                Filter
              </button>
              
              {/* Mark as Read Button */}
              <button
                onClick={markAsRead}
                disabled={selectedNotifications.length === 0}
                className={`px-4 py-2 rounded-md shadow text-white ${
                  selectedNotifications.length === 0 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-nosco-red hover:bg-red-700'
                }`}
              >
                Mark {selectedNotifications.length ? `Selected (${selectedNotifications.length})` : 'All'} as Read
              </button>
            </div>

            {/* Project Notifications */}
            <WorkerNotificationsTable
              notifications={getNotificationsByCategory('PROJECT')}
              title="Project Notifications"
              selectedNotifications={selectedNotifications}
              onSelectNotification={handleSelectNotification}
              onSelectAll={handleSelectAll}
            />

            {/* Invitation Notifications */}
            <WorkerNotificationsTable
              notifications={getNotificationsByCategory('INVITATION')}
              title="Invitation Notifications"
              selectedNotifications={selectedNotifications}
              onSelectNotification={handleSelectNotification}
              onSelectAll={handleSelectAll}
            />

            {/* Expense Notifications */}
            <WorkerNotificationsTable
              notifications={getNotificationsByCategory('EXPENSE')}
              title="Expense Notifications"
              selectedNotifications={selectedNotifications}
              onSelectNotification={handleSelectNotification}
              onSelectAll={handleSelectAll}
            />

            {/* Work Hour Notifications */}
            <WorkerNotificationsTable
              notifications={getNotificationsByCategory('WORKHOUR')}
              title="Work Hour Notifications"
              selectedNotifications={selectedNotifications}
              onSelectNotification={handleSelectNotification}
              onSelectAll={handleSelectAll}
            />

            {/* Payment Notifications */}
            <WorkerNotificationsTable
              notifications={getNotificationsByCategory('PAYMENT')}
              title="Payment Notifications"
              selectedNotifications={selectedNotifications}
              onSelectNotification={handleSelectNotification}
              onSelectAll={handleSelectAll}
            />

            {filteredNotifications.length === 0 && (
              <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
                No notifications match your current filters.
              </div>
            )}
          </div>

          {/* Filter Modal */}
          <Modal
            isOpen={showFilterModal}
            onClose={() => setShowFilterModal(false)}
            title="Filter Notifications"
          >
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="all"
                      checked={tempFilters.readStatus === 'all'}
                      onChange={() => handleTempFilterChange('readStatus', 'all')}
                      className="h-4 w-4 text-nosco-red focus:ring-nosco-red border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">All</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="read"
                      checked={tempFilters.readStatus === 'read'}
                      onChange={() => handleTempFilterChange('readStatus', 'read')}
                      className="h-4 w-4 text-nosco-red focus:ring-nosco-red border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Read</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="unread"
                      checked={tempFilters.readStatus === 'unread'}
                      onChange={() => handleTempFilterChange('readStatus', 'unread')}
                      className="h-4 w-4 text-nosco-red focus:ring-nosco-red border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Unread</span>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={tempFilters.category}
                  onChange={(e) => handleTempFilterChange('category', e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-nosco-red focus:border-nosco-red sm:text-sm rounded-md"
                >
                  <option value="all">All Categories</option>
                  <option value="project">Projects</option>
                  <option value="invitation">Invitations</option>
                  <option value="expense">Expenses</option>
                  <option value="workhour">Work Hours</option>
                  <option value="payment">Payments</option>
                </select>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Clear All
                </button>
                <button
                  onClick={applyFiltersAndCloseModal}
                  className="px-4 py-2 bg-nosco-red text-white rounded hover:bg-red-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
};

export default WorkerNotificationsPage;
