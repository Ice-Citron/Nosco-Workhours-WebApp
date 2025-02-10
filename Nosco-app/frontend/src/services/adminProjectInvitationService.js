// src/services/adminProjectInvitationService.js

import { firestore } from '../firebase/firebase_config';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const adminProjectInvitationService = {
  // 1) Get all invitations for a project
  getProjectInvitations: async (projectId) => {
    try {
      console.log('Fetching invitations for project:', projectId);
      
      const invitationsRef = collection(firestore, 'projectInvitations');
      const q = query(
        invitationsRef,
        where('projectID', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      // Collect userIDs from the invitations
      const userIds = new Set(snapshot.docs.map((docSnap) => docSnap.data().userID));
      
      // Fetch user details in parallel
      const usersMap = new Map();
      await Promise.all(
        Array.from(userIds).map(async (userId) => {
          const userDoc = await getDoc(doc(firestore, 'users', userId));
          if (userDoc.exists()) {
            usersMap.set(userId, {
              id: userId,
              ...userDoc.data(),
            });
          }
        })
      );
      
      // Map invitations with user details
      const invitationsWithUsers = snapshot.docs.map((docSnap) => {
        const invitation = {
          id: docSnap.id,
          ...docSnap.data(),
        };
        invitation.user = usersMap.get(invitation.userID) || null;
        return invitation;
      });

      return invitationsWithUsers;
    } catch (error) {
      console.error('Error fetching invitations:', error);
      throw error;
    }
  },

  // 2) Create a new invitation
  createInvitation: async (projectId, userId, message) => {
    try {
      console.log('[createInvitation] START');
      console.log('[createInvitation] projectId:', projectId);
      console.log('[createInvitation] userId:', userId);
      console.log('[createInvitation] message:', message);

      // Load the user document
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        console.log('[createInvitation] ERROR - userDoc not found for user:', userId);
        throw new Error('User not found');
      }
      const userData = userDoc.data();
      console.log('[createInvitation] userDoc data:', userData);

      // Build the invitation data
      const invitation = {
        projectID: projectId,
        userID: userId,
        status: 'pending', // initial status
        message,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        attempts: [
          {
            // Use client-generated timestamp inside arrays
            date: Timestamp.now(),
            by: getAuth().currentUser?.uid || 'unknownAdmin',
            type: 'initial',
          },
        ],
        requiredResponseDate: Timestamp.fromDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ),
      };

      console.log('[createInvitation] invitation to add:', invitation);

      const projectInvitationsRef = collection(firestore, 'projectInvitations');
      const docRef = await addDoc(projectInvitationsRef, invitation);
      console.log('[createInvitation] docRef.id:', docRef.id);

      // Create a notification document
      const notification = {
        type: 'project_invitation',
        title: 'New Project Invitation',
        message: 'You have been invited to join a new project',
        entityID: docRef.id,
        entityType: 'project_invitation',
        userID: userId,
        createdAt: serverTimestamp(),
        read: false,
        link: '/worker/project-invitations',
      };

      const notificationsRef = collection(firestore, 'notifications');
      const notificationDoc = await addDoc(notificationsRef, notification);
      console.log('[createInvitation] notificationDoc.id:', notificationDoc.id);

      console.log('[createInvitation] SUCCESS - returning invitation data');
      return {
        id: docRef.id,
        ...invitation,
        user: userData,
      };
    } catch (error) {
      console.error('[createInvitation] ERROR creating invitation:', error);
      throw error;
    }
  },

  // 3) Resend invitation (for pending invitations)
  resendInvitation: async (invitationId) => {
    try {
      const invitationRef = doc(firestore, 'projectInvitations', invitationId);
      const invitationSnap = await getDoc(invitationRef);
      if (!invitationSnap.exists()) {
        throw new Error('Invitation not found');
      }
      const invitation = invitationSnap.data();
      if (invitation.status !== 'pending') {
        throw new Error('Can only resend pending invitations');
      }

      const now = Timestamp.now();
      await updateDoc(invitationRef, {
        updatedAt: serverTimestamp(),
        attempts: arrayUnion({
          date: now,
          by: getAuth().currentUser.uid,
          type: 'resend',
        }),
        requiredResponseDate: Timestamp.fromDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ),
      });

      // Create a reminder notification
      const notification = {
        type: 'project_invitation_reminder',
        title: 'Project Invitation Reminder',
        message: 'You have a pending project invitation',
        entityID: invitationId,
        entityType: 'project_invitation',
        userID: invitation.userID,
        createdAt: serverTimestamp(),
        read: false,
        link: '/worker/project-invitations',
      };
      await addDoc(collection(firestore, 'notifications'), notification);

      return true;
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  },

  // 4) Send nudge/reminder (for pending invitations)
  sendNudge: async (invitationId) => {
    try {
      const invitationRef = doc(firestore, 'projectInvitations', invitationId);
      const invitationSnap = await getDoc(invitationRef);
      if (!invitationSnap.exists()) {
        throw new Error('Invitation not found');
      }
      const invitation = invitationSnap.data();
      if (invitation.status !== 'pending') {
        throw new Error('Can only nudge pending invitations');
      }

      const now = Timestamp.now();
      await updateDoc(invitationRef, {
        // Update attempts and record the last nudge sent
        attempts: arrayUnion({
          date: now,
          by: getAuth().currentUser.uid,
          type: 'nudge',
        }),
        lastNudgeSent: now,
      });

      // Create a nudge notification
      const notification = {
        type: 'project_invitation_nudge',
        title: 'Action Required: Project Invitation',
        message: 'Please respond to your pending project invitation',
        entityID: invitationId,
        entityType: 'project_invitation',
        userID: invitation.userID,
        createdAt: serverTimestamp(),
        read: false,
        link: '/worker/project-invitations',
      };
      await addDoc(collection(firestore, 'notifications'), notification);

      return true;
    } catch (error) {
      console.error('Error sending nudge:', error);
      throw error;
    }
  },

  // 5) Cancel invitation (for pending or accepted invitations)
  cancelInvitation: async (invitationId, reason) => {
    try {
      const invitationRef = doc(firestore, 'projectInvitations', invitationId);
      const invitationSnap = await getDoc(invitationRef);
      if (!invitationSnap.exists()) {
        throw new Error('Invitation not found');
      }
      const invitation = invitationSnap.data();
      // Allow cancellation if the status is either pending or accepted
      if (invitation.status !== 'pending' && invitation.status !== 'accepted') {
        throw new Error('Can only cancel pending or accepted invitations');
      }

      const now = Timestamp.now();
      await updateDoc(invitationRef, {
        status: 'cancelled',
        cancelReason: reason,
        cancelledBy: getAuth().currentUser.uid,
        updatedAt: serverTimestamp(),
        attempts: arrayUnion({
          date: now,
          by: getAuth().currentUser.uid,
          type: 'cancel',
        }),
      });

      // Create a cancellation notification
      const notification = {
        type: 'project_invitation_cancelled',
        title: 'Project Invitation Cancelled',
        message: 'Your project invitation has been cancelled',
        entityID: invitationId,
        entityType: 'project_invitation',
        userID: invitation.userID,
        createdAt: serverTimestamp(),
        read: false,
        link: '/worker/project-invitations',
      };
      await addDoc(collection(firestore, 'notifications'), notification);

      return true;
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      throw error;
    }
  },

  // 6) Retry invitation (for rejected invitations; resets status to pending)
  retryInvitation: async (invitationId) => {
    try {
      const invitationRef = doc(firestore, 'projectInvitations', invitationId);
      const invitationSnap = await getDoc(invitationRef);
      if (!invitationSnap.exists()) {
        throw new Error('Invitation not found');
      }
      const invitation = invitationSnap.data();
      if (invitation.status !== 'rejected') {
        throw new Error('Can only retry rejected invitations');
      }
  
      const now = Timestamp.now();
      await updateDoc(invitationRef, {
        status: 'pending',
        updatedAt: serverTimestamp(),
        requiredResponseDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        attempts: arrayUnion({
          date: now,
          by: getAuth().currentUser.uid,
          type: 'retry',
        }),
      });
  
      const notification = {
        type: 'project_invitation_retried',
        title: 'Project Invitation Retried',
        message: 'Your project invitation has been retried. Please respond to it.',
        entityID: invitationId,
        entityType: 'project_invitation',
        userID: invitation.userID,
        createdAt: serverTimestamp(),
        read: false,
        link: '/worker/project-invitations',
      };
      await addDoc(collection(firestore, 'notifications'), notification);
  
      return true;
    } catch (error) {
      console.error('Error retrying invitation:', error);
      throw error;
    }
  },

  // 7) Reinstate invitation (for cancelled invitations; resets status to pending)
  reinstateInvitation: async (invitationId) => {
    try {
      const invitationRef = doc(firestore, 'projectInvitations', invitationId);
      const invitationSnap = await getDoc(invitationRef);
      if (!invitationSnap.exists()) {
        throw new Error('Invitation not found');
      }
      const invitation = invitationSnap.data();
      const now = Timestamp.now();
      // Force status to pending
      await updateDoc(invitationRef, {
        status: 'pending',
        cancelReason: null,
        cancelledBy: null,
        updatedAt: serverTimestamp(),  // Use serverTimestamp() for consistency
        requiredResponseDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        attempts: arrayUnion({
          date: now,
          by: getAuth().currentUser.uid,
          type: 'reinstate'
        })
      });
      // Create a reinstatement notification
      const notification = {
        type: 'project_invitation_reinstated',
        title: 'Project Invitation Reinstated',
        message: 'Your project invitation has been reinstated. Please respond to it.',
        entityID: invitationId,
        entityType: 'project_invitation',
        userID: invitation.userID,
        createdAt: Timestamp.now(),
        read: false,
        link: '/worker/project-invitations'
      };
      await addDoc(collection(firestore, 'notifications'), notification);
      return true;
    } catch (error) {
      console.error('Error reinstating invitation:', error);
      throw error;
    }
  },

  // 8) Delete invitation (admin only, no extra notification)
  deleteInvitation: async (invitationId) => {
    try {
      const invitationRef = doc(firestore, 'projectInvitations', invitationId);
      await deleteDoc(invitationRef);
      return true;
    } catch (error) {
      console.error('Error deleting invitation:', error);
      throw error;
    }
  },

  // 9) Expire invitation (mark pending invitations as rejected if past requiredResponseDate)
  expireInvitation: async (invitationId) => {
    try {
      // Get a reference to the invitation document
      const invitationRef = doc(firestore, 'projectInvitations', invitationId);
      // Fetch the current invitation document
      const invitationSnap = await getDoc(invitationRef);
      if (!invitationSnap.exists()) {
        throw new Error('Invitation not found');
      }
      const invitation = invitationSnap.data();
      // Only update if the status is still pending
      if (invitation.status === 'pending') {
        await updateDoc(invitationRef, {
          status: 'rejected',
          updatedAt: serverTimestamp(),
          declineReason: 'expired'  // you can adjust this message if needed
        });
      }
      return true;
    } catch (error) {
      console.error('Error expiring invitation:', error);
      throw error;
    }
  },

  // 10) Get available workers for a project (workers not already invited)
  getAvailableWorkers: async (projectId) => {
    // Make sure projectId is provided
    if (!projectId) {
      throw new Error("Project ID is undefined");
    }
    try {
      // Query active workers from the 'users' collection
      const workersQuery = query(
        collection(firestore, 'users'),
        where('role', '==', 'worker'),
        where('status', '==', 'active')
      );
      const workersSnapshot = await getDocs(workersQuery);
      const activeWorkers = workersSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
  
      // Query all invitations for the given project
      const invitationsQuery = query(
        collection(firestore, 'projectInvitations'),
        where('projectID', '==', projectId)
      );
      const invitationsSnapshot = await getDocs(invitationsQuery);
      const invitations = invitationsSnapshot.docs.map(docSnap => docSnap.data());
  
      // Extract user IDs that have already been invited
      const invitedWorkerIds = invitations.map(inv => inv.userID);
  
      // Filter active workers to include only those not already invited
      const availableWorkers = activeWorkers.filter(worker =>
        !invitedWorkerIds.includes(worker.id)
      );
  
      return availableWorkers;
    } catch (error) {
      console.error('Error fetching available workers for project:', error);
      throw error;
    }
  },
};

export default adminProjectInvitationService;
