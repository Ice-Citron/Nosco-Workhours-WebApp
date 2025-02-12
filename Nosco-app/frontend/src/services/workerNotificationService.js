// src/services/workerNotificationService.js

import { firestore } from '../firebase/firebase_config';
import { 
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs
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
  // Expense approval
  notifyExpenseApproval: async (expenseId, amount, currency) => {
    const notificationData = {
      type: 'expense_approval',
      title: 'Expense Approved',
      message: `Your expense claim for ${currency} ${amount} has been approved.`,
      entityID: expenseId,
      entityType: 'expense',
    };
    return await workerNotificationService.createNotification(notificationData);
  },

  // Expense rejection
  notifyExpenseRejection: async (expenseId, rejectionReason) => {
    const notificationData = {
      type: 'expense_rejection',
      title: 'Expense Rejected',
      message: `Your expense claim was rejected: ${rejectionReason}`,
      entityID: expenseId,
      entityType: 'expense',
    };
    return await workerNotificationService.createNotification(notificationData);
  },

  // Work hours approval
  notifyWorkhourApproval: async (workhourId, amount) => {
    const notificationData = {
      type: 'workhour_approval',
      title: 'Work Hours Approved',
      message: `Your submitted work hours totaling ${amount} have been approved.`,
      entityID: workhourId,
      entityType: 'workhour',
    };
    return await workerNotificationService.createNotification(notificationData);
  },

  // Work hours rejection
  notifyWorkhourRejection: async (workhourId, rejectionReason) => {
    const notificationData = {
      type: 'workhour_rejection',
      title: 'Work Hours Rejected',
      message: `Your submitted work hours were rejected: ${rejectionReason}`,
      entityID: workhourId,
      entityType: 'workhour',
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
};

export default workerNotificationService;
