// src/services/adminNotificationService.js
import { firestore } from '../firebase/firebase_config';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export const adminNotificationService = {
  /**
   * 1) Generic single-user notification creation
   * (Already in your code)
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
   * 2) Helper: Get All Admins from Firestore
   *    (where role == 'admin')
   */
  getAllAdmins: async () => {
    try {
      const qAdmins = query(
        collection(firestore, 'users'),
        where('role', '==', 'admin')
      );
      const snapshot = await getDocs(qAdmins);
      // Return array of { uid: '...', ...restOfUserDoc }
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
   * 3) Notify *each admin* by looping over getAllAdmins() results
   *    Reuses createNotification to actually insert docs.
   */
  createNotificationForAllAdmins: async (notificationData) => {
    try {
      const admins = await adminNotificationService.getAllAdmins();
      for (const adminUser of admins) {
        // create a separate doc for each admin
        await adminNotificationService.createNotification({
          ...notificationData,
          userID: adminUser.uid, // override userID for each admin
        });
      }
    } catch (error) {
      console.error('Error notifying all admins:', error);
      throw error;
    }
  },

  // ----------------------------------------------------------------
  // Existing single-user notifications for expenses, work hours, etc.
  // ----------------------------------------------------------------

  notifyExpenseApproval: async (expenseId, userID, amount, currency) => {
    try {
      const notificationData = {
        type: 'expense_approval',
        title: 'Expense Approved',
        message: `Your expense claim for ${currency} ${amount} has been approved.`,
        entityID: expenseId,
        entityType: 'expense',
        userID
      };
      return await adminNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },

  notifyExpenseRejection: async (expenseId, userID, rejectionReason) => {
    try {
      const notificationData = {
        type: 'expense_rejection',
        title: 'Expense Rejected',
        message: `Your expense claim was rejected: ${rejectionReason}`,
        entityID: expenseId,
        entityType: 'expense',
        userID
      };
      return await adminNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },

  notifyWorkhourApproval: async (workhourId, userID, amount) => {
    try {
      const notificationData = {
        type: 'workhour_approval',
        title: 'Work Hours Approved',
        message: `Your submitted work hours totaling ${amount} have been approved.`,
        entityID: workhourId,
        entityType: 'workhour',
        userID
      };
      return await adminNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },

  notifyWorkhourRejection: async (workhourId, userID, rejectionReason) => {
    try {
      const notificationData = {
        type: 'workhour_rejection',
        title: 'Work Hours Rejected',
        message: `Your submitted work hours were rejected: ${rejectionReason}`,
        entityID: workhourId,
        entityType: 'workhour',
        userID
      };
      return await adminNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },

  // ----------------------------------------------------------------
  // 4) Single-user invitation notifications (already existed)
  // ----------------------------------------------------------------
  notifyProjectInvitation: async (invitationId, userID) => {
    try {
      const notificationData = {
        type: 'project_invitation',
        title: 'New Project Invitation',
        message: 'You have a new project invitation. Please check your dashboard.',
        entityID: invitationId,
        entityType: 'project_invitation',
        userID
      };
      return await adminNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },

  notifyInvitationCancellation: async (invitationId, userID) => {
    try {
      const notificationData = {
        type: 'invitation_cancellation',
        title: 'Invitation Cancelled',
        message: 'Your project invitation has been cancelled.',
        entityID: invitationId,
        entityType: 'project_invitation',
        userID
      };
      return await adminNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },

  notifyInvitationNudge: async (invitationId, userID) => {
    try {
      const notificationData = {
        type: 'invitation_nudge',
        title: 'Invitation Reminder',
        message: 'Please respond to your pending project invitation.',
        entityID: invitationId,
        entityType: 'project_invitation',
        userID
      };
      return await adminNotificationService.createNotification(notificationData);
    } catch (error) {
      throw error;
    }
  },

  // ----------------------------------------------------------------
  // 5) **New**: Notify *all admins* about invitation events
  // ----------------------------------------------------------------
  
  // 5a) When an invitation is created for a worker
  notifyAllAdminsInvitationCreated: async (invitationId, workerName, projectName) => {
    const link = '/admin/project-invitations'; // Or /admin/projects if you prefer
    const notificationData = {
      type: 'project_invitation_created',
      title: 'Invitation Created',
      message: `Worker "${workerName}" was invited to project "${projectName}".`,
      entityID: invitationId,
      entityType: 'project_invitation',
      link
    };
    return await adminNotificationService.createNotificationForAllAdmins(notificationData);
  },

  // 5b) When an invitation is cancelled
  notifyAllAdminsInvitationCancelled: async (invitationId, workerName, projectName, reason) => {
    const link = '/admin/project-invitations';
    const msg = `Invitation for worker "${workerName}" to project "${projectName}" was cancelled.`;
    const notificationData = {
      type: 'project_invitation_cancelled',
      title: 'Invitation Cancelled',
      message: reason ? `${msg} Reason: ${reason}` : msg,
      entityID: invitationId,
      entityType: 'project_invitation',
      link
    };
    return await adminNotificationService.createNotificationForAllAdmins(notificationData);
  },

  // 5c) When an invitation is reinstated
  notifyAllAdminsInvitationReinstated: async (invitationId, workerName, projectName) => {
    const link = '/admin/project-invitations';
    const notificationData = {
      type: 'project_invitation_reinstated',
      title: 'Invitation Reinstated',
      message: `Invitation for worker "${workerName}" on project "${projectName}" was reinstated.`,
      entityID: invitationId,
      entityType: 'project_invitation',
      link
    };
    return await adminNotificationService.createNotificationForAllAdmins(notificationData);
  },

  // 5d) When a worker accepts the invitation
  notifyAllAdminsInvitationAccepted: async (invitationId, workerName, projectName) => {
    const link = '/admin/project-invitations';
    const notificationData = {
      type: 'project_invitation_accepted',
      title: 'Invitation Accepted',
      message: `Worker "${workerName}" accepted the invitation to project "${projectName}".`,
      entityID: invitationId,
      entityType: 'project_invitation',
      link
    };
    return await adminNotificationService.createNotificationForAllAdmins(notificationData);
  },

  // 5e) When a worker rejects the invitation
  notifyAllAdminsInvitationRejected: async (invitationId, workerName, projectName, declineReason) => {
    const link = '/admin/project-invitations';
    const msg = `Worker "${workerName}" rejected the invitation to "${projectName}".`;
    const notificationData = {
      type: 'project_invitation_rejected',
      title: 'Invitation Rejected',
      message: declineReason ? `${msg} Reason: ${declineReason}` : msg,
      entityID: invitationId,
      entityType: 'project_invitation',
      link
    };
    return await adminNotificationService.createNotificationForAllAdmins(notificationData);
  },

  // ----------------------------------------------------------------------
  //  NEW: for "retried" and "nudged"
  // ----------------------------------------------------------------------

  notifyAllAdminsInvitationRetried: async (invitationId, workerName, projectName) => {
    const link = '/admin/project-invitations';
    const notificationData = {
      type: 'project_invitation_retried',
      title: 'Invitation Retried',
      message: `Invitation for worker "${workerName}" on project "${projectName}" was retried.`,
      entityID: invitationId,
      entityType: 'project_invitation',
      link
    };
    return await adminNotificationService.createNotificationForAllAdmins(notificationData);
  },

  notifyAllAdminsInvitationNudged: async (invitationId, workerName, projectName) => {
    const link = '/admin/project-invitations';
    const notificationData = {
      type: 'project_invitation_nudged',
      title: 'Invitation Nudged',
      message: `A nudge was sent for worker "${workerName}" on project "${projectName}".`,
      entityID: invitationId,
      entityType: 'project_invitation',
      link
    };
    return await adminNotificationService.createNotificationForAllAdmins(notificationData);
  },
};

export default adminNotificationService;
