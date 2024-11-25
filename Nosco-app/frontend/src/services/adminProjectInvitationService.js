// src/services/adminProjectInvitationService.js
import { firestore } from '../firebase/firebase_config';
import { 
  collection, 
  query,
  getDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  Timestamp,
  where,
  serverTimestamp
} from 'firebase/firestore';

export const adminProjectInvitationService = {
  // Get all invitations for a project
  getProjectInvitations: async (projectId) => {
    try {
      const invitationsRef = collection(firestore, 'projectInvitations');
      const q = query(
        invitationsRef, 
        where('projectID', '==', projectId),
        where('status', 'in', ['pending', 'accepted', 'declined'])
      );
      
      const snapshot = await getDocs(q);
      const invitations = [];
      
      for (const docSnapshot of snapshot.docs) {
        const userDocRef = doc(firestore, 'users', docSnapshot.data().userID);
        const userDocSnap = await getDoc(userDocRef);
          
        invitations.push({
          id: docSnapshot.id,
          ...docSnapshot.data(),
          user: userDocSnap.exists() ? {
            id: userDocSnap.id,
            name: userDocSnap.data().name,
            email: userDocSnap.data().email,
            department: userDocSnap.data().department
          } : null
        });
      }
      
      return invitations;
    } catch (error) {
      console.error('Error fetching project invitations:', error);
      throw error;
    }
  },

  // Create new invitation
  createInvitation: async (projectId, userId, message) => {
    try {
      const invitation = {
        projectID: projectId,
        userID: userId,
        status: 'pending',
        message,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        attempts: [{
          date: serverTimestamp(),
          by: 'admin',
          type: 'initial'
        }],
        requiredResponseDate: Timestamp.fromDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        )
      };

      // Create invitation
      const docRef = await addDoc(collection(firestore, 'projectInvitations'), invitation);

      // Create notification for worker
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
        ...invitation
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
      const invitationDoc = await invitationRef.get();
      
      if (!invitationDoc.exists()) {
        throw new Error('Invitation not found');
      }

      const invitation = invitationDoc.data();
      
      // Add new attempt
      await updateDoc(invitationRef, {
        updatedAt: serverTimestamp(),
        attempts: [
          ...invitation.attempts,
          {
            date: serverTimestamp(),
            by: 'admin',
            type: 'resend'
          }
        ],
        // Reset required response date
        requiredResponseDate: Timestamp.fromDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        )
      });

      // Create new notification
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

  // Cancel invitation
  cancelInvitation: async (invitationId, reason) => {
    try {
      const invitationRef = doc(firestore, 'projectInvitations', invitationId);
      const invitationDoc = await invitationRef.get();
      
      if (!invitationDoc.exists()) {
        throw new Error('Invitation not found');
      }

      const invitation = invitationDoc.data();

      await updateDoc(invitationRef, {
        status: 'cancelled',
        cancelReason: reason,
        cancelledBy: 'admin',
        updatedAt: serverTimestamp()
      });

      // Create notification for worker
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
  }
};

export default adminProjectInvitationService;