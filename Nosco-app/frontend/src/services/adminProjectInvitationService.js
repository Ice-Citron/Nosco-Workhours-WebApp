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
      
      // Collect userIDs found in invitations
      const userIds = new Set(snapshot.docs.map((doc) => doc.data().userID));
      
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

      // 1) Load the user doc
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);

      console.log('[createInvitation] userDoc exists?', userDoc.exists());
      if (!userDoc.exists()) {
        console.log('[createInvitation] ERROR - userDoc not found in /users/' + userId);
        throw new Error('User not found');
      }
      // For debugging, check the role or entire data
      const userData = userDoc.data();
      console.log('[createInvitation] userDoc data:', userData);

      // 2) Build the invitation data
      const invitation = {
        projectID: projectId,
        userID: userId,
        status: 'pending', // or 'invited'
        message,
        createdAt: serverTimestamp(), // top-level serverTimestamp is allowed
        updatedAt: serverTimestamp(),
        attempts: [
          {
            // Inside arrays, use Timestamp.now() instead of serverTimestamp() to avoid the Firestore error
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

      // 3) Write to Firestore
      const projectInvitationsRef = collection(firestore, 'projectInvitations');
      console.log('[createInvitation] about to addDoc(...)');
      const docRef = await addDoc(projectInvitationsRef, invitation);
      console.log('[createInvitation] docRef.id:', docRef.id);

      // 4) Create notification doc
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

      console.log('[createInvitation] notification to add:', notification);

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

  // 3) Resend invitation
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

      // Update doc with a "resend" attempt
      await updateDoc(invitationRef, {
        updatedAt: serverTimestamp(),
        attempts: arrayUnion({
          date: serverTimestamp(),
          by: getAuth().currentUser.uid,
          type: 'resend',
        }),
        requiredResponseDate: Timestamp.fromDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ),
      });

      // Create a “reminder” notification
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

  // 4) Send nudge/reminder
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

      // Update doc with a "nudge" attempt
      await updateDoc(invitationRef, {
        attempts: arrayUnion({
          date: serverTimestamp(),
          by: getAuth().currentUser.uid,
          type: 'nudge',
        }),
      });

      // Create “nudge” notification
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

  // 5) Cancel invitation
  cancelInvitation: async (invitationId, reason) => {
    try {
      const invitationRef = doc(firestore, 'projectInvitations', invitationId);
      const invitationSnap = await getDoc(invitationRef);
      
      if (!invitationSnap.exists()) {
        throw new Error('Invitation not found');
      }
      const invitation = invitationSnap.data();
      if (invitation.status !== 'pending') {
        throw new Error('Can only cancel pending invitations');
      }

      // Update doc
      await updateDoc(invitationRef, {
        status: 'cancelled',
        cancelReason: reason,
        cancelledBy: getAuth().currentUser.uid,
        updatedAt: serverTimestamp(),
        attempts: arrayUnion({
          date: serverTimestamp(),
          by: getAuth().currentUser.uid,
          type: 'cancel',
        }),
      });

      // Create “cancelled” notification
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

  // 6) Delete invitation (admin only, no extra notification)
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
};

export default adminProjectInvitationService;
