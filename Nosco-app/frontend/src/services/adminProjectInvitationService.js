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
  Timestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const adminProjectInvitationService = {
  // Get all invitations for a project
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
      
      // Get all unique user IDs
      const userIds = new Set(snapshot.docs.map(doc => doc.data().userID));
      
      // Fetch all user details in parallel
      const usersMap = new Map();
      await Promise.all(
        Array.from(userIds).map(async (userId) => {
          const userDoc = await getDoc(doc(firestore, 'users', userId));
          if (userDoc.exists()) {
            usersMap.set(userId, {
              id: userId,
              ...userDoc.data()
            });
          }
        })
      );
      
      // Map invitations with user details
      const invitationsWithUsers = snapshot.docs.map(doc => {
        const invitation = {
          id: doc.id,
          ...doc.data()
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

  // Create new invitation
  createInvitation: async (projectId, userId, message) => {
    try {
      // First verify if user exists
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      // Create invitation document
      const invitation = {
        projectID: projectId,
        userID: userId,
        status: 'pending',
        message,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        attempts: [{
          date: serverTimestamp(),
          by: getAuth().currentUser.uid,
          type: 'initial'
        }],
        requiredResponseDate: Timestamp.fromDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        )
      };

      const docRef = await addDoc(collection(firestore, 'projectInvitations'), invitation);

      // Create notification
      const notification = {
        type: 'project_invitation',
        title: 'New Project Invitation',
        message: `You have been invited to join a new project`,
        entityID: docRef.id,
        entityType: 'project_invitation',
        userID: userId,
        createdAt: serverTimestamp(),
        read: false,
        link: '/worker/project-invitations'
      };

      await addDoc(collection(firestore, 'notifications'), notification);

      return {
        id: docRef.id,
        ...invitation,
        user: userDoc.data()
      };
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  },

  // Resend invitation
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

      // Update invitation
      await updateDoc(invitationRef, {
        updatedAt: serverTimestamp(),
        attempts: arrayUnion({
          date: serverTimestamp(),
          by: getAuth().currentUser.uid,
          type: 'resend'
        }),
        requiredResponseDate: Timestamp.fromDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        )
      });

      // Create notification
      const notification = {
        type: 'project_invitation_reminder',
        title: 'Project Invitation Reminder',
        message: 'You have a pending project invitation',
        entityID: invitationId,
        entityType: 'project_invitation',
        userID: invitation.userID,
        createdAt: serverTimestamp(),
        read: false,
        link: '/worker/project-invitations'
      };

      await addDoc(collection(firestore, 'notifications'), notification);

      return true;
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  },

  // Send nudge/reminder
  sendNudge: async (invitationId) => {
    try {
      const invitationRef = doc(firestore, 'projectInvitations', invitationId);
      const invitationSnap = await getDoc(invitationRef);
      
      if (!invitationSnap.exists()) {
        throw new Error('Invitation not found');
      }

      const invitation = invitationSnap.data();
      
      if (invitation.status !== 'pending') {
        throw new Error('Can only send nudge for pending invitations');
      }

      // Update invitation with nudge attempt
      await updateDoc(invitationRef, {
        attempts: arrayUnion({
          date: serverTimestamp(),
          by: getAuth().currentUser.uid,
          type: 'nudge'
        })
      });

      // Create notification
      const notification = {
        type: 'project_invitation_nudge',
        title: 'Action Required: Project Invitation',
        message: 'Please respond to your pending project invitation',
        entityID: invitationId,
        entityType: 'project_invitation',
        userID: invitation.userID,
        createdAt: serverTimestamp(),
        read: false,
        link: '/worker/project-invitations'
      };

      await addDoc(collection(firestore, 'notifications'), notification);

      return true;
    } catch (error) {
      console.error('Error sending nudge:', error);
      throw error;
    }
  },

  // Cancel invitation
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

      // Update invitation
      await updateDoc(invitationRef, {
        status: 'cancelled',
        cancelReason: reason,
        cancelledBy: getAuth().currentUser.uid,
        updatedAt: serverTimestamp(),
        attempts: arrayUnion({
          date: serverTimestamp(),
          by: getAuth().currentUser.uid,
          type: 'cancel'
        })
      });

      // Create notification
      const notification = {
        type: 'project_invitation_cancelled',
        title: 'Project Invitation Cancelled',
        message: 'Your project invitation has been cancelled',
        entityID: invitationId,
        entityType: 'project_invitation',
        userID: invitation.userID,
        createdAt: serverTimestamp(),
        read: false,
        link: '/worker/project-invitations'
      };

      await addDoc(collection(firestore, 'notifications'), notification);

      return true;
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      throw error;
    }
  },

  // Delete invitation (admin only, no notification since it's removed)
  deleteInvitation: async (invitationId) => {
    try {
      const invitationRef = doc(firestore, 'projectInvitations', invitationId);
      await deleteDoc(invitationRef);
      return true;
    } catch (error) {
      console.error('Error deleting invitation:', error);
      throw error;
    }
  }
};

export default adminProjectInvitationService;