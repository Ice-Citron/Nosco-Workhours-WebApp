// pages/admin/AdminNotificationsPage.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { firestore as db } from '../../firebase/firebase_config';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';

// Import components
import NotificationsTable from '../../components/admin/notifications/NotificationsTable';
import PendingSummaryCards from '../../components/admin/notifications/PendingSummaryCards';
import PendingInvitationsTable from '../../components/admin/notifications/PendingInvitationsTable';
import { adminPaymentService } from '../../services/adminPaymentService';

// Define notification categories
const NOTIFICATION_CATEGORIES = {
  INVITATION: ['invitation_sync_accepted', 'invitation_sync_other', 'project_invitation_created', 
               'project_invitation_accepted', 'project_invitation_cancelled', 'project_invitation_nudge', 
               'invitation_auto_expired'],
  PROJECT_STATUS: ['project_archived', 'project_unarchived', 'project_ended', 'project_created'],
  USER_ADMIN: ['admin_created', 'admin_archived', 'admin_unarchived', 'worker_created', 
               'worker_archived', 'worker_unarchived'],
  EXPENSE_APPROVAL: ['expense_approved', 'expense_rejected'],
  WORKHOUR_APPROVAL: ['workhour_approved', 'workhour_rejection'],
};

const AdminNotificationsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [pendingItems, setPendingItems] = useState({
    workHours: 0,
    expenses: 0,
    paymentAmount: 0,
    amountDue: 0,
    payments: 0,
    invitations: []
  });
  const [filters, setFilters] = useState({
    readStatus: 'unread',
    category: 'all'
  });
  
  // Modal state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempFilters, setTempFilters] = useState({ ...filters });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [notifications, filters]);

  // Reset temp filters when main filters change
  useEffect(() => {
    setTempFilters({ ...filters });
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchNotifications(),
        fetchPendingItems()
      ]);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userID', 'in', [user.uid, 'all_admins']),
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
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchPendingItems = async () => {
    try {
      // Get pending work hours
      const workHoursRef = collection(db, 'workHours');
      const workHoursQuery = query(
        workHoursRef,
        where('status', '==', 'pending')
      );
      const workHoursSnapshot = await getDocs(workHoursQuery);
      
      // Get pending expenses
      const expensesRef = collection(db, 'expense');
      const expensesQuery = query(
        expensesRef,
        where('status', '==', 'pending')
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      
      // Get pending payments
      const paymentsRef = collection(db, 'payments');
      const paymentsQuery = query(
        paymentsRef,
        where('status', '==', 'processing')
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      // Calculate total pending payment amount
      let totalPaymentAmount = 0;
      paymentsSnapshot.docs.forEach(doc => {
        const paymentData = doc.data();
        totalPaymentAmount += parseFloat(paymentData.amount) || 0;
      });
      
      // Get pending project invitations
      const invitationsRef = collection(db, 'projectInvitations');
      const invitationsQuery = query(
        invitationsRef,
        where('status', '==', 'pending')
      );
      const invitationsSnapshot = await getDocs(invitationsQuery);
      const invitationsData = invitationsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          requiredResponseDate: data.requiredResponseDate?.toDate?.() || new Date(data.requiredResponseDate)
        };
      });
      
      // Get amount due (approved but unpaid)
      let totalAmountDue = 0;
      try {
        const unpaidWorkersData = await adminPaymentService.getAllWorkersUnpaidData();
        unpaidWorkersData.forEach(worker => {
          totalAmountDue += worker.unpaidAmount || 0;
        });
      } catch (error) {
        console.error('Error fetching unpaid worker data:', error);
      }
      
      setPendingItems({
        workHours: workHoursSnapshot.size,
        expenses: expensesSnapshot.size,
        paymentAmount: totalPaymentAmount,
        amountDue: totalAmountDue,
        payments: paymentsSnapshot.size,
        invitations: invitationsData
      });
    } catch (error) {
      console.error('Error fetching pending items:', error);
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
        result = result.filter(notification => categoryTypes.includes(notification.type));
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
      NOTIFICATION_CATEGORIES[category].includes(notification.type)
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          <button 
            className={`pb-2 px-2 ${activeTab === 'notifications' ? 
              'border-b-2 border-nosco-red text-nosco-red font-medium' : 
              'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
          <button 
            className={`pb-2 px-2 ${activeTab === 'pending' ? 
              'border-b-2 border-nosco-red text-nosco-red font-medium' : 
              'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Items
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nosco-red"></div>
        </div>
      ) : (
        <>
          {activeTab === 'notifications' ? (
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

              {/* Invitation Notifications */}
              <NotificationsTable
                notifications={getNotificationsByCategory('INVITATION')}
                title="Invitation Notifications"
                selectedNotifications={selectedNotifications}
                onSelectNotification={handleSelectNotification}
                onSelectAll={handleSelectAll}
              />

              {/* Project Status Notifications */}
              <NotificationsTable
                notifications={getNotificationsByCategory('PROJECT_STATUS')}
                title="Project Status Notifications"
                selectedNotifications={selectedNotifications}
                onSelectNotification={handleSelectNotification}
                onSelectAll={handleSelectAll}
              />

              {/* User/Admin Notifications */}
              <NotificationsTable
                notifications={getNotificationsByCategory('USER_ADMIN')}
                title="User/Admin Notifications"
                selectedNotifications={selectedNotifications}
                onSelectNotification={handleSelectNotification}
                onSelectAll={handleSelectAll}
              />

              {/* Expense Approval Notifications */}
              <NotificationsTable
                notifications={getNotificationsByCategory('EXPENSE_APPROVAL')}
                title="Expense Notifications"
                selectedNotifications={selectedNotifications}
                onSelectNotification={handleSelectNotification}
                onSelectAll={handleSelectAll}
              />

              {/* Work Hour Approval Notifications */}
              <NotificationsTable
                notifications={getNotificationsByCategory('WORKHOUR_APPROVAL')}
                title="Work Hour Notifications"
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
          ) : (
            <div>
              <PendingSummaryCards pendingItems={pendingItems} />
              <PendingInvitationsTable invitations={pendingItems.invitations} />
            </div>
          )}

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
                  <option value="invitation">Invitations</option>
                  <option value="project_status">Project Status</option>
                  <option value="user_admin">User/Admin</option>
                  <option value="expense_approval">Expense Approval</option>
                  <option value="workhour_approval">Work Hour Approval</option>
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

export default AdminNotificationsPage;
