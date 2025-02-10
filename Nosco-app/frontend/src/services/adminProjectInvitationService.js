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

/**
 * Helper function: Updates the "workers" map inside the associated project doc
 * based on the new invitation status. 
 *   - If "accepted", add the user to the `workers` map.
 *   - If "cancelled" or "rejected", remove them from the `workers` map if present.
 */
async function syncProjectWorkersMap(invitation, newStatus) {
  // 1) Fetch the project doc
  const projectRef = doc(firestore, 'projects', invitation.projectID);
  const projectSnap = await getDoc(projectRef);
  if (!projectSnap.exists()) {
    console.warn('[syncProjectWorkersMap] Project not found:', invitation.projectID);
    return; // or throw new Error('Project not found');
  }

  const projectData = projectSnap.data() || {};
  const workersMap = projectData.workers || {};

  const userId = invitation.userID;
  if (newStatus === 'accepted') {
    // Add/overwrite a worker entry
    workersMap[userId] = {
      status: 'active',
      joinedAt: Timestamp.now()
      // you can store more if you want
    };
    console.log(`[syncProjectWorkersMap] Added worker ${userId} to project ${invitation.projectID}`);
  } else if (newStatus === 'cancelled' || newStatus === 'rejected') {
    // Remove worker from map if they exist
    if (workersMap[userId]) {
      delete workersMap[userId];
      console.log(`[syncProjectWorkersMap] Removed worker ${userId} from project ${invitation.projectID}`);
    }
    // If it was "pending," they might not be in the map yet, so no harm in trying.
  }

  // 2) Update the project doc
  await updateDoc(projectRef, { workers: workersMap });
}

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

      // Collect userIDs
      const userIds = new Set(snapshot.docs.map((docSnap) => docSnap.data().userID));

      // For each userID, load user details
      const usersMap = new Map();
      for (const uid of userIds) {
        const userDoc = await getDoc(doc(firestore, 'users', uid));
        if (userDoc.exists()) {
          usersMap.set(uid, {
            id: uid,
            ...userDoc.data()
          });
        }
      }

      // Map invitations with user details
      const invitationsWithUsers = snapshot.docs.map((docSnap) => {
        const invitation = {
          id: docSnap.id,
          ...docSnap.data()
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
      console.log('[createInvitation] START', { projectId, userId, message });

      // Check user doc
      const userRef = doc(firestore, 'users', userId);
      const userDocSnap = await getDoc(userRef);
      if (!userDocSnap.exists()) {
        throw new Error('User not found');
      }

      const invitationData = {
        projectID: projectId,
        userID: userId,
        status: 'pending',
        message,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        attempts: [
          {
            date: Timestamp.now(),
            by: getAuth().currentUser?.uid || 'unknownAdmin',
            type: 'initial'
          }
        ],
        requiredResponseDate: Timestamp.fromDate(new Date(Date.now() + 7*24*60*60*1000))
      };

      const docRef = await addDoc(collection(firestore, 'projectInvitations'), invitationData);
      console.log('[createInvitation] Created invitation docId:', docRef.id);

      // Notification
      const notif = {
        type: 'project_invitation',
        title: 'New Project Invitation',
        message: 'You have been invited to join a new project',
        entityID: docRef.id,
        entityType: 'project_invitation',
        userID: userId,
        createdAt: serverTimestamp(),
        read: false,
        link: '/worker/project-invitations'
      };
      await addDoc(collection(firestore, 'notifications'), notif);

      return { id: docRef.id, ...invitationData, user: userDocSnap.data() };
    } catch (error) {
      console.error('[createInvitation] ERROR:', error);
      throw error;
    }
  },

  // 3) Resend invitation (for pending invitations)
  resendInvitation: async (invitationId) => {
    try {
      const invRef = doc(firestore, 'projectInvitations', invitationId);
      const snap = await getDoc(invRef);
      if (!snap.exists()) throw new Error('Invitation not found');
      const invitation = snap.data();
      if (invitation.status !== 'pending') {
        throw new Error('Can only resend pending invitations');
      }

      const now = Timestamp.now();
      await updateDoc(invRef, {
        updatedAt: serverTimestamp(),
        attempts: arrayUnion({
          date: now,
          by: getAuth().currentUser.uid,
          type: 'resend'
        }),
        requiredResponseDate: Timestamp.fromDate(new Date(Date.now() + 7*24*60*60*1000))
      });

      // Notification
      const notif = {
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
      await addDoc(collection(firestore, 'notifications'), notif);

      return true;
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  },

  // 4) Send nudge (for pending)
  sendNudge: async (invitationId) => {
    try {
      const invRef = doc(firestore, 'projectInvitations', invitationId);
      const snap = await getDoc(invRef);
      if (!snap.exists()) throw new Error('Invitation not found');
      const invitation = snap.data();
      if (invitation.status !== 'pending') {
        throw new Error('Can only nudge pending invitations');
      }

      const now = Timestamp.now();
      await updateDoc(invRef, {
        attempts: arrayUnion({
          date: now,
          by: getAuth().currentUser.uid,
          type: 'nudge'
        }),
        lastNudgeSent: now,
        updatedAt: serverTimestamp()
      });

      // Notification
      const notif = {
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
      await addDoc(collection(firestore, 'notifications'), notif);

      return true;
    } catch (error) {
      console.error('Error sending nudge:', error);
      throw error;
    }
  },

  // 5) Cancel invitation (for pending or accepted)
  cancelInvitation: async (invitationId, reason) => {
    try {
      const invRef = doc(firestore, 'projectInvitations', invitationId);
      const snap = await getDoc(invRef);
      if (!snap.exists()) throw new Error('Invitation not found');
      const invitation = snap.data();

      if (!(invitation.status === 'pending' || invitation.status === 'accepted')) {
        throw new Error('Can only cancel pending or accepted invitations');
      }

      const now = Timestamp.now();
      const newData = {
        status: 'cancelled',
        cancelReason: reason || '',
        cancelledBy: getAuth().currentUser.uid,
        updatedAt: serverTimestamp(),
        attempts: arrayUnion({
          date: now,
          by: getAuth().currentUser.uid,
          type: 'cancel'
        })
      };

      await updateDoc(invRef, newData);

      // Also update project doc (remove user from project if present)
      await syncProjectWorkersMap(invitation, 'cancelled');

      // Notification
      const notif = {
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
      await addDoc(collection(firestore, 'notifications'), notif);

      return true;
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      throw error;
    }
  },

  // 6) Retry invitation (for 'rejected')
  retryInvitation: async (invitationId) => {
    try {
      const invRef = doc(firestore, 'projectInvitations', invitationId);
      const snap = await getDoc(invRef);
      if (!snap.exists()) throw new Error('Invitation not found');
      const invitation = snap.data();

      if (invitation.status !== 'rejected') {
        throw new Error('Can only retry rejected invitations');
      }

      const now = Timestamp.now();
      const newData = {
        status: 'pending',
        updatedAt: serverTimestamp(),
        requiredResponseDate: Timestamp.fromDate(new Date(Date.now() + 7*24*60*60*1000)),
        attempts: arrayUnion({
          date: now,
          by: getAuth().currentUser.uid,
          type: 'retry'
        })
      };
      await updateDoc(invRef, newData);

      // Worker wouldn't be in project doc if it was 'rejected' before, so no changes needed.
      // If you prefer to remove them from the doc, do so. Typically they're not in the doc anyway.

      // Notification
      const notif = {
        type: 'project_invitation_retried',
        title: 'Project Invitation Retried',
        message: 'Your project invitation has been retried. Please respond to it.',
        entityID: invitationId,
        entityType: 'project_invitation',
        userID: invitation.userID,
        createdAt: serverTimestamp(),
        read: false,
        link: '/worker/project-invitations'
      };
      await addDoc(collection(firestore, 'notifications'), notif);

      return true;
    } catch (error) {
      console.error('Error retrying invitation:', error);
      throw error;
    }
  },

  // 7) Reinstate invitation (for 'cancelled')
  reinstateInvitation: async (invitationId) => {
    try {
      const invRef = doc(firestore, 'projectInvitations', invitationId);
      const snap = await getDoc(invRef);
      if (!snap.exists()) {
        throw new Error('Invitation not found');
      }
      const invitation = snap.data();
      if (invitation.status !== 'cancelled') {
        throw new Error('Can only reinstate cancelled invitations');
      }

      const now = Timestamp.now();
      const newData = {
        status: 'pending',
        cancelReason: null,
        cancelledBy: null,
        updatedAt: serverTimestamp(),
        requiredResponseDate: Timestamp.fromDate(new Date(Date.now() + 7*24*60*60*1000)),
        attempts: arrayUnion({
          date: now,
          by: getAuth().currentUser.uid,
          type: 'reinstate'
        })
      };
      await updateDoc(invRef, newData);

      // If it was "cancelled," the user might have been removed from project doc. 
      // No immediate action to add them unless they "accept" again.

      // Notification
      const notif = {
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
      await addDoc(collection(firestore, 'notifications'), notif);

      return true;
    } catch (error) {
      console.error('Error reinstating invitation:', error);
      throw error;
    }
  },

  // 8) Accept invitation – for workers (or admin on behalf)
  /**
   * If you want the worker or an admin to set invitation.status='accepted',
   * then we add them to the project doc.
   */
  acceptInvitation: async (invitationId) => {
    try {
      const invRef = doc(firestore, 'projectInvitations', invitationId);
      const snap = await getDoc(invRef);
      if (!snap.exists()) throw new Error('Invitation not found');
      const invitation = snap.data();

      if (invitation.status !== 'pending') {
        throw new Error('Can only accept a pending invitation');
      }

      const now = Timestamp.now();
      const newData = {
        status: 'accepted',
        updatedAt: serverTimestamp(),
        responseDate: now,  // store the acceptance date
        // Optionally remove declineReason if it existed
        declineReason: null
      };
      await updateDoc(invRef, newData);

      // Now also update project doc => add user to workers map
      await syncProjectWorkersMap(invitation, 'accepted');

      // Possibly create a notification for the user or for the admin:
      // e.g., "Worker accepted your invitation"
      // For brevity, we skip here or do:
      /*
      const notif = {
        type: 'project_invitation_accepted',
        title: 'Invitation Accepted',
        message: 'The project invitation was accepted',
        entityID: invitationId,
        entityType: 'project_invitation',
        userID: <some-admin-id or invitation.projectOwnerId>,
        createdAt: serverTimestamp(),
        read: false,
        link: '/admin/projects/...'
      };
      await addDoc(collection(firestore, 'notifications'), notif);
      */

      return true;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  },

  // 9) Decline invitation
  /**
   * If the worker or admin sets invitation.status='rejected',
   * remove them from project doc if they were in it (though typically they are not yet).
   */
  declineInvitation: async (invitationId, reason = '') => {
    try {
      const invRef = doc(firestore, 'projectInvitations', invitationId);
      const snap = await getDoc(invRef);
      if (!snap.exists()) throw new Error('Invitation not found');
      const invitation = snap.data();

      if (invitation.status !== 'pending') {
        throw new Error('Can only decline a pending invitation');
      }

      const now = Timestamp.now();
      const newData = {
        status: 'rejected',
        declineReason: reason,
        updatedAt: serverTimestamp(),
        responseDate: now
      };
      await updateDoc(invRef, newData);

      // Remove user from project doc if for some reason they were added (rare for "pending").
      await syncProjectWorkersMap(invitation, 'rejected');

      // Possibly create a notification "Worker declined your invitation"
      // omitted for brevity

      return true;
    } catch (error) {
      console.error('Error declining invitation:', error);
      throw error;
    }
  },

  // 10) Delete invitation (admin only)
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

  // 11) Expire invitation (status='rejected' if past requiredResponseDate)
  expireInvitation: async (invitationId) => {
    try {
      const invitationRef = doc(firestore, 'projectInvitations', invitationId);
      const snap = await getDoc(invitationRef);
      if (!snap.exists()) throw new Error('Invitation not found');

      const invitation = snap.data();
      if (invitation.status === 'pending') {
        await updateDoc(invitationRef, {
          status: 'rejected',
          updatedAt: serverTimestamp(),
          declineReason: 'expired'
        });
        // Remove from project doc if any partial was there
        await syncProjectWorkersMap(invitation, 'rejected');
      }
      return true;
    } catch (error) {
      console.error('Error expiring invitation:', error);
      throw error;
    }
  },

  // 12) Get available workers for a project (not already invited)
  getAvailableWorkers: async (projectId) => {
    if (!projectId) throw new Error('Project ID is undefined');
    try {
      const workersSnap = await getDocs(
        query(
          collection(firestore, 'users'),
          where('role', '==', 'worker'),
          where('status', '==', 'active')
        )
      );
      const allWorkers = workersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // get current invitations
      const invSnap = await getDocs(
        query(collection(firestore, 'projectInvitations'), where('projectID', '==', projectId))
      );
      const invites = invSnap.docs.map(d => d.data());

      // userIDs that are already invited
      const invitedUserIDs = invites.map(i => i.userID);

      // filter out from allWorkers
      return allWorkers.filter(w => !invitedUserIDs.includes(w.id));
    } catch (error) {
      console.error('Error getAvailableWorkers:', error);
      throw error;
    }
  }
};
