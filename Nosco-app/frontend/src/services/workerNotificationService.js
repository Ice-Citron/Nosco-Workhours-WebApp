// src/services/workerNotificationService.js
import { firestore } from '../firebase/firebase_config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const workerNotificationService = {
  // Generic notification creation for workers
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

  // Expense approval notification for worker
  notifyExpenseApproval: async (expenseId, amount, currency) => {
    try {
      const notificationData = {
        type: 'expense_approval',
        title: 'Expense Approved',
        message: `Your expense claim for ${currency} ${amount} has been approved.`,
        entityID: expenseId,
        entityType: 'expense',
      };
      return await workerNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },

  // Expense rejection notification for worker
  notifyExpenseRejection: async (expenseId, rejectionReason) => {
    try {
      const notificationData = {
        type: 'expense_rejection',
        title: 'Expense Rejected',
        message: `Your expense claim was rejected: ${rejectionReason}`,
        entityID: expenseId,
        entityType: 'expense',
      };
      return await workerNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },

  // Work hours approval notification for worker
  notifyWorkhourApproval: async (workhourId, amount) => {
    try {
      const notificationData = {
        type: 'workhour_approval',
        title: 'Work Hours Approved',
        message: `Your submitted work hours totaling ${amount} have been approved.`,
        entityID: workhourId,
        entityType: 'workhour',
      };
      return await workerNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },

  // Work hours rejection notification for worker
  notifyWorkhourRejection: async (workhourId, rejectionReason) => {
    try {
      const notificationData = {
        type: 'workhour_rejection',
        title: 'Work Hours Rejected',
        message: `Your submitted work hours were rejected: ${rejectionReason}`,
        entityID: workhourId,
        entityType: 'workhour',
      };
      return await workerNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },

  // Project invitation notification for worker
  notifyProjectInvitation: async (invitationId) => {
    try {
      const notificationData = {
        type: 'project_invitation',
        title: 'New Project Invitation',
        message: 'You have received a new project invitation. Please check your dashboard for details.',
        entityID: invitationId,
        entityType: 'project_invitation',
      };
      return await workerNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },

  // Invitation cancellation notification for worker
  notifyInvitationCancellation: async (invitationId) => {
    try {
      const notificationData = {
        type: 'invitation_cancellation',
        title: 'Invitation Cancelled',
        message: 'Your project invitation has been cancelled.',
        entityID: invitationId,
        entityType: 'project_invitation',
      };
      return await workerNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },

  // Invitation nudge notification for worker
  notifyInvitationNudge: async (invitationId) => {
    try {
      const notificationData = {
        type: 'invitation_nudge',
        title: 'Invitation Reminder',
        message: 'Please respond to your pending project invitation.',
        entityID: invitationId,
        entityType: 'project_invitation',
      };
      return await workerNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },
};

export default workerNotificationService;
