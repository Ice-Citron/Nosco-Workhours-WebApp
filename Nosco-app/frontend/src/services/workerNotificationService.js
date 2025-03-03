// src/services/workerNotificationService.js

import { firestore } from '../firebase/firebase_config';
import { 
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  writeBatch,
  orderBy,
  updateDoc,
  deleteDoc,
  getCountFromServer,
} from 'firebase/firestore';

export const workerNotificationService = {

  /**
   * ---------------------------------------------------
   * A) Generic single-user notification (for the worker)
   * ---------------------------------------------------
   */
  createNotification: async (notificationData) => {
    try {
      const docRef = await addDoc(collection(firestore, 'notifications'), {
        ...notificationData,
        createdAt: serverTimestamp(),
        read: false,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  /**
   * ---------------------------------------------------
   * B) Helper to fetch ALL admins from Firestore
   * ---------------------------------------------------
   */
  getAllAdmins: async () => {
    try {
      const adminsQuery = query(
        collection(firestore, 'users'),
        where('role', '==', 'admin')
      );
      const snapshot = await getDocs(adminsQuery);
      return snapshot.docs.map(docSnap => ({
        uid: docSnap.id,
        ...docSnap.data()
      }));
    } catch (error) {
      console.error('Error fetching admins:', error);
      throw error;
    }
  },

  /**
   * ---------------------------------------------------
   * C) Create an admin notification for *each* admin user
   * ---------------------------------------------------
   */
  createNotificationForAllAdmins: async (notificationData) => {
    try {
      const admins = await workerNotificationService.getAllAdmins();
      // For each admin, create a separate notifications doc
      for (const adminUser of admins) {
        await addDoc(collection(firestore, 'notifications'), {
          ...notificationData,
          userID: adminUser.uid,   // override with the admin's UID
          createdAt: serverTimestamp(),
          read: false,
        });
      }
    } catch (error) {
      console.error('Error creating admin notifications:', error);
      throw error;
    }
  },

  /**
   * ---------------------------------------------------
   * D) Single-User Worker Notifications (existing)
   * ---------------------------------------------------
   */
  // Update if needed to match the parameters we're using
  notifyExpenseApproval: async (expenseId, amount, currency, userId) => {
    const notificationData = {
      type: 'expense_approval',
      title: 'Expense Approved',
      message: `Your expense claim for ${currency} ${amount} has been approved.`,
      entityID: expenseId,
      entityType: 'expense',
      userID: userId,
      link: '/worker/expenses'
    };
    return await workerNotificationService.createNotification(notificationData);
  },

  // Update if needed to match the parameters we're using
  notifyExpenseRejection: async (expenseId, rejectionReason, userId) => {
    const notificationData = {
      type: 'expense_rejection',
      title: 'Expense Rejected',
      message: `Your expense claim was rejected: ${rejectionReason}`,
      entityID: expenseId,
      entityType: 'expense',
      userID: userId,
      link: '/worker/expenses'
    };
    return await workerNotificationService.createNotification(notificationData);
  },

  // Work hours approval
  notifyWorkhourApproval: async (workhourId, hours, userId, projectName = "your project") => {
    const notificationData = {
      type: 'workhour_approval',
      title: 'Work Hours Approved',
      message: `Your submitted work hours totaling ${hours} for ${projectName} have been approved.`,
      entityID: workhourId,
      entityType: 'workhour',
      userID: userId,
      link: '/worker/work-hours'
    };
    return await workerNotificationService.createNotification(notificationData);
  },

  // Work hours rejection
  notifyWorkhourRejection: async (workhourId, rejectionReason, userId, projectName = "your project") => {
    const notificationData = {
      type: 'workhour_rejection',
      title: 'Work Hours Rejected',
      message: `Your submitted work hours for ${projectName} were rejected: ${rejectionReason}`,
      entityID: workhourId,
      entityType: 'workhour',
      userID: userId,
      link: '/worker/work-hours'
    };
    return await workerNotificationService.createNotification(notificationData);
  },

  // Project invitation
  notifyProjectInvitation: async (invitationId) => {
    const notificationData = {
      type: 'project_invitation',
      title: 'New Project Invitation',
      message: 'You have received a new project invitation. Please check your dashboard.',
      entityID: invitationId,
      entityType: 'project_invitation',
    };
    return await workerNotificationService.createNotification(notificationData);
  },

  // Invitation cancellation
  notifyInvitationCancellation: async (invitationId) => {
    const notificationData = {
      type: 'invitation_cancellation',
      title: 'Invitation Cancelled',
      message: 'Your project invitation has been cancelled.',
      entityID: invitationId,
      entityType: 'project_invitation',
    };
    return await workerNotificationService.createNotification(notificationData);
  },

  // Invitation nudge
  notifyInvitationNudge: async (invitationId) => {
    const notificationData = {
      type: 'invitation_nudge',
      title: 'Invitation Reminder',
      message: 'Please respond to your pending project invitation.',
      entityID: invitationId,
      entityType: 'project_invitation',
    };
    return await workerNotificationService.createNotification(notificationData);
  },

  /**
   * ------------------------------------------------------------
   * E) NEW: Notify *all admins* that a worker accepted or rejected
   * ------------------------------------------------------------
   */

  notifyAllAdminsInvitationAccepted: async (invitationId, workerName, projectName) => {
    const link = '/admin/project-invitations'; // or /admin/projects
    const data = {
      type: 'project_invitation_accepted',
      title: 'Invitation Accepted',
      message: `Worker "${workerName}" accepted the invitation for project "${projectName}".`,
      entityID: invitationId,
      entityType: 'project_invitation',
      link
    };
    return await workerNotificationService.createNotificationForAllAdmins(data);
  },

  notifyAllAdminsInvitationRejected: async (invitationId, workerName, projectName, declineReason) => {
    const link = '/admin/project-invitations';
    let msg = `Worker "${workerName}" rejected the invitation for project "${projectName}".`;
    if (declineReason) {
      msg += ` Reason: ${declineReason}`;
    }
    const data = {
      type: 'project_invitation_rejected',
      title: 'Invitation Rejected',
      message: msg,
      entityID: invitationId,
      entityType: 'project_invitation',
      link
    };
    return await workerNotificationService.createNotificationForAllAdmins(data);
  },

  /**
   * ---------------------------------------------------
   * F) Notify ALL workers assigned to a project
   * ---------------------------------------------------
   */
  notifyAllProjectWorkers: async (projectId, notificationData) => {
    try {
      // 1. Get the project document to find assigned workers
      const projectRef = doc(firestore, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        console.error('Project not found:', projectId);
        return false;
      }
      
      // 2. Extract worker UIDs from the workers map
      const projectData = projectSnap.data();
      const projectName = projectData.name || 'Unknown Project';
      const workersMap = projectData.workers || {};
      const workerIds = Object.keys(workersMap);
      
      if (workerIds.length === 0) {
        console.log('No workers to notify for project:', projectId);
        return false;
      }
      
      // 3. Create a notification for each worker (using batch write for efficiency)
      const batch = writeBatch(firestore);
      
      for (const workerId of workerIds) {
        const notificationRef = doc(collection(firestore, 'notifications'));
        batch.set(notificationRef, {
          ...notificationData,
          userID: workerId,
          projectName: projectName, // Include project name for context
          createdAt: serverTimestamp(),
          read: false,
        });
      }
      
      await batch.commit();
      console.log(`Sent notifications to ${workerIds.length} workers for project ${projectId}`);
      return true;
    } catch (error) {
      console.error('Error notifying project workers:', error);
      throw error;
    }
  },

  /**
   * ---------------------------------------------------
   * G) Project Status Change Notifications
   * ---------------------------------------------------
   */
  // Project Started
  notifyProjectStarted: async (projectId) => {
    try {
      const projectRef = doc(firestore, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) return false;
      
      const projectName = projectSnap.data().name || 'Unknown Project';
      
      return await workerNotificationService.notifyAllProjectWorkers(projectId, {
        type: 'project_started',
        title: 'Project Started',
        message: `Project "${projectName}" has officially started.`,
        entityID: projectId,
        entityType: 'project',
        link: '/worker/projects'
      });
    } catch (error) {
      console.error('Error creating project started notification:', error);
      throw error;
    }
  },

  // Project Ended
  notifyProjectEnded: async (projectId) => {
    try {
      const projectRef = doc(firestore, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) return false;
      
      const projectName = projectSnap.data().name || 'Unknown Project';
      
      return await workerNotificationService.notifyAllProjectWorkers(projectId, {
        type: 'project_ended',
        title: 'Project Ended',
        message: `Project "${projectName}" has been completed.`,
        entityID: projectId,
        entityType: 'project',
        link: '/worker/projects'
      });
    } catch (error) {
      console.error('Error creating project ended notification:', error);
      throw error;
    }
  },

  // Project Archived
  notifyProjectArchived: async (projectId) => {
    try {
      const projectRef = doc(firestore, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) return false;
      
      const projectName = projectSnap.data().name || 'Unknown Project';
      
      return await workerNotificationService.notifyAllProjectWorkers(projectId, {
        type: 'project_archived',
        title: 'Project Archived',
        message: `Project "${projectName}" has been archived.`,
        entityID: projectId,
        entityType: 'project',
        link: '/worker/projects'
      });
    } catch (error) {
      console.error('Error creating project archived notification:', error);
      throw error;
    }
  },

  // Project Unarchived
  notifyProjectUnarchived: async (projectId) => {
    try {
      const projectRef = doc(firestore, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) return false;
      
      const projectName = projectSnap.data().name || 'Unknown Project';
      
      return await workerNotificationService.notifyAllProjectWorkers(projectId, {
        type: 'project_unarchived',
        title: 'Project Unarchived',
        message: `Project "${projectName}" has been restored from archive.`,
        entityID: projectId,
        entityType: 'project',
        link: '/worker/projects'
      });
    } catch (error) {
      console.error('Error creating project unarchived notification:', error);
      throw error;
    }
  },

  // Payment processing started
  notifyPaymentProcessing: async (paymentId, amount, currency, referenceNumber, userId) => {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
    
    const notificationData = {
      type: 'payment_processing',
      title: 'Payment Processing',
      message: `Your payment of ${formattedAmount} is now being processed. Reference: ${referenceNumber}.`,
      entityID: paymentId,
      entityType: 'payment',
      userID: userId,
      link: '/worker/payments'
    };
    return await workerNotificationService.createNotification(notificationData);
  },

  // Payment completed
  notifyPaymentCompleted: async (paymentId, amount, currency, referenceNumber, userId) => {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
    
    const notificationData = {
      type: 'payment_completed',
      title: 'Payment Completed',
      message: `Your payment of ${formattedAmount} has been completed. Reference: ${referenceNumber}.`,
      entityID: paymentId,
      entityType: 'payment',
      userID: userId,
      link: '/worker/payments'
    };
    return await workerNotificationService.createNotification(notificationData);
  },

  // Payment failed
  notifyPaymentFailed: async (paymentId, amount, currency, userId) => {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
    
    const notificationData = {
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `Your payment of ${formattedAmount} could not be processed. Our admin team has been notified.`,
      entityID: paymentId,
      entityType: 'payment',
      userID: userId,
      link: '/worker/payments'
    };
    return await workerNotificationService.createNotification(notificationData);
  },

  /**
   * Get all notifications for a specific worker
   * @param {string} userId - The worker's user ID
   * @returns {Promise<Array>} - Array of notification objects
   */
  getNotificationsForWorker: async (userId) => {
    try {
      const notificationsRef = collection(firestore, 'notifications');
      const q = query(
        notificationsRef,
        where('userID', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  /**
   * Mark a single notification as read
   * @param {string} notificationId - The notification ID to mark as read
   */
  markNotificationAsRead: async (notificationId) => {
    try {
      const notificationRef = doc(firestore, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark multiple notifications as read
   * @param {Array<string>} notificationIds - Array of notification IDs to mark as read
   */
  markMultipleNotificationsAsRead: async (notificationIds) => {
    try {
      const batch = writeBatch(firestore);
      
      notificationIds.forEach(id => {
        const notificationRef = doc(firestore, 'notifications', id);
        batch.update(notificationRef, {
          read: true,
          readAt: serverTimestamp()
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking multiple notifications as read:', error);
      throw error;
    }
  },

  /**
   * Delete a single notification
   * @param {string} notificationId - The notification ID to delete
   */
  deleteNotification: async (notificationId) => {
    try {
      const notificationRef = doc(firestore, 'notifications', notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  /**
   * Delete multiple notifications
   * @param {Array<string>} notificationIds - Array of notification IDs to delete
   */
  deleteMultipleNotifications: async (notificationIds) => {
    try {
      const batch = writeBatch(firestore);
      
      notificationIds.forEach(id => {
        const notificationRef = doc(firestore, 'notifications', id);
        batch.delete(notificationRef);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting multiple notifications:', error);
      throw error;
    }
  },

  /**
   * Get the count of unread notifications for a worker
   * @param {string} userId - The worker's user ID
   * @returns {Promise<number>} - Number of unread notifications
   */
  getUnreadNotificationsCount: async (userId) => {
    try {
      const notificationsRef = collection(firestore, 'notifications');
      const q = query(
        notificationsRef,
        where('userID', '==', userId),
        where('read', '==', false)
      );
      
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      console.error('Error getting unread notifications count:', error);
      return 0;
    }
  },
};

export default workerNotificationService;
