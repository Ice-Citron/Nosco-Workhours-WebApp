// src/services/adminNotificationService.js
import { firestore } from '../firebase/firebase_config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const adminNotificationService = {
  // Create a generic notification document
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

  // Expense approval notification for admin (for example when an expense is approved and the admin wants to notify the worker)
  notifyExpenseApproval: async (expenseId, userId, amount, currency) => {
    try {
      const notificationData = {
        type: 'expense_approval',
        title: 'Expense Approved',
        message: `Your expense claim for ${currency} ${amount} has been approved.`,
        entityID: expenseId,
        entityType: 'expense',
        userID, // worker's id
      };
      return await adminNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },

  // Expense rejection notification
  notifyExpenseRejection: async (expenseId, userId, rejectionReason) => {
    try {
      const notificationData = {
        type: 'expense_rejection',
        title: 'Expense Rejected',
        message: `Your expense claim was rejected: ${rejectionReason}`,
        entityID: expenseId,
        entityType: 'expense',
        userID,
      };
      return await adminNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },

  // Work hours approval notification
  notifyWorkhourApproval: async (workhourId, userId, amount) => {
    try {
      const notificationData = {
        type: 'workhour_approval',
        title: 'Work Hours Approved',
        message: `Your submitted work hours totaling ${amount} have been approved.`,
        entityID: workhourId,
        entityType: 'workhour',
        userID,
      };
      return await adminNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },

  // Work hours rejection notification
  notifyWorkhourRejection: async (workhourId, userId, rejectionReason) => {
    try {
      const notificationData = {
        type: 'workhour_rejection',
        title: 'Work Hours Rejected',
        message: `Your submitted work hours were rejected: ${rejectionReason}`,
        entityID: workhourId,
        entityType: 'workhour',
        userID,
      };
      return await adminNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },

  // Project invitation notification
  notifyProjectInvitation: async (invitationId, userId) => {
    try {
      const notificationData = {
        type: 'project_invitation',
        title: 'New Project Invitation',
        message: 'You have a new project invitation. Please check your dashboard for details.',
        entityID: invitationId,
        entityType: 'project_invitation',
        userID,
      };
      return await adminNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },

  // Invitation cancellation notification
  notifyInvitationCancellation: async (invitationId, userId) => {
    try {
      const notificationData = {
        type: 'invitation_cancellation',
        title: 'Invitation Cancelled',
        message: 'Your project invitation has been cancelled.',
        entityID: invitationId,
        entityType: 'project_invitation',
        userID,
      };
      return await adminNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },

  // Invitation nudge notification
  notifyInvitationNudge: async (invitationId, userId) => {
    try {
      const notificationData = {
        type: 'invitation_nudge',
        title: 'Invitation Reminder',
        message: 'Please respond to your pending project invitation.',
        entityID: invitationId,
        entityType: 'project_invitation',
        userID,
      };
      return await adminNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },
};

export default adminNotificationService;
