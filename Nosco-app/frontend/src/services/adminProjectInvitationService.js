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
import adminNotificationService from './adminNotificationService'; // Import your new notification file

/**
 * Helper: updates the "workers" map inside the associated project doc
 * if status changed to accepted/rejected/cancelled.
 */
async function syncProjectWorkersMap(invitation, newStatus) {
  const projectRef = doc(firestore, 'projects', invitation.projectID);
  const projectSnap = await getDoc(projectRef);
  if (!projectSnap.exists()) {
    console.warn('[syncProjectWorkersMap] Project not found:', invitation.projectID);
    return;
  }

  const projectData = projectSnap.data() || {};
  const workersMap = projectData.workers || {};
  const userId = invitation.userID;

  if (newStatus === 'accepted') {
    // Add or overwrite worker
    workersMap[userId] = {
      status: 'active',
      joinedAt: Timestamp.now()
    };
    console.log(`[syncProjectWorkersMap] Added worker ${userId} to project ${invitation.projectID}`);
  } else if (newStatus === 'cancelled' || newStatus === 'rejected') {
    // Remove worker from map
    if (workersMap[userId]) {
      delete workersMap[userId];
      console.log(`[syncProjectWorkersMap] Removed worker ${userId} from project ${invitation.projectID}`);
    }
  }
  await updateDoc(projectRef, { workers: workersMap });
}

export const adminProjectInvitationService = {
  /**
   * Get all invitations for a project
   */
  getProjectInvitations: async (projectId) => {
    try {
      const invitationsRef = collection(firestore, 'projectInvitations');
      const q = query(
        invitationsRef,
        where('projectID', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      // Collect userIDs to fetch user docs
      const userIds = new Set(snapshot.docs.map((docSnap) => docSnap.data().userID));
      const usersMap = new Map();

      for (const uid of userIds) {
        const userDoc = await getDoc(doc(firestore, 'users', uid));
        if (userDoc.exists()) {
          usersMap.set(uid, { id: uid, ...userDoc.data() });
        }
      }

      // Return invitations plus user object
      return snapshot.docs.map((docSnap) => {
        const inv = { id: docSnap.id, ...docSnap.data() };
        inv.user = usersMap.get(inv.userID) || null;
        return inv;
      });
    } catch (error) {
      console.error('Error fetching invitations:', error);
      throw error;
    }
  },

  /**
   * Create a new invitation (status = 'pending').
   * 1) Create doc
   * 2) Notify worker
   * 3) Notify all admins
   */
  createInvitation: async (projectId, userId, message) => {
    try {
      // 1) Basic validation
      const userSnap = await getDoc(doc(firestore, 'users', userId));
      if (!userSnap.exists()) {
        throw new Error('User not found');
      }
      const workerName = userSnap.data().name || 'Unknown Worker';

      const projectSnap = await getDoc(doc(firestore, 'projects', projectId));
      if (!projectSnap.exists()) {
        throw new Error('Project not found');
      }
      const projectName = projectSnap.data().name || 'Unknown Project';

      // 2) Create invitation doc
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
        requiredResponseDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      };
      const docRef = await addDoc(collection(firestore, 'projectInvitations'), invitationData);

      // 3) Notify the worker
      await addDoc(collection(firestore, 'notifications'), {
        type: 'project_invitation',
        title: 'New Project Invitation',
        message: 'You have been invited to join a new project',
        entityID: docRef.id,
        entityType: 'project_invitation',
        userID: userId,
        createdAt: serverTimestamp(),
        read: false,
        link: '/worker/project-invitations'
      });

      // 4) Notify all admins
      await adminNotificationService.notifyAllAdminsInvitationCreated(
        docRef.id,
        workerName,
        projectName
      );

      console.log('[createInvitation] Created invitation docId:', docRef.id);
      return { id: docRef.id, ...invitationData, user: userSnap.data() };
    } catch (error) {
      console.error('[createInvitation] ERROR:', error);
      throw error;
    }
  },

  /**
   * sendNudge (for pending)
   * Notifying only the worker that there's a "nudge"
   * (If you also want admins to see "nudge" events, you can call an admin notif function.)
   */
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

      // 1) Worker notification
      await addDoc(collection(firestore, 'notifications'), {
        type: 'project_invitation_nudge',
        title: 'Action Required: Project Invitation',
        message: 'Please respond to your pending project invitation',
        entityID: invitationId,
        entityType: 'project_invitation',
        userID: invitation.userID,
        createdAt: serverTimestamp(),
        read: false,
        link: '/worker/project-invitations'
      });

      // 2) Admin notification
      // fetch worker & project names for better message
      const userSnap = await getDoc(doc(firestore, 'users', invitation.userID));
      const workerName = userSnap.exists() ? userSnap.data().name : 'Unknown Worker';
      const projSnap = await getDoc(doc(firestore, 'projects', invitation.projectID));
      const projectName = projSnap.exists() ? projSnap.data().name : 'Unknown Project';

      await adminNotificationService.notifyAllAdminsInvitationNudged(
        invitationId,
        workerName,
        projectName
      );

      return true;
    } catch (error) {
      console.error('Error sending nudge:', error);
      throw error;
    }
  },

  /**
   * cancelInvitation (for pending or accepted).
   *  1) Set status='cancelled'
   *  2) Remove from project doc
   *  3) Notify worker
   *  4) Notify all admins
   */
  cancelInvitation: async (invitationId, reason) => {
    try {
      const invRef = doc(firestore, 'projectInvitations', invitationId);
      const snap = await getDoc(invRef);
      if (!snap.exists()) throw new Error('Invitation not found');
      const invitation = snap.data();

      if (!(invitation.status === 'pending' || invitation.status === 'accepted')) {
        throw new Error('Can only cancel pending or accepted invitations');
      }

      const userRef = doc(firestore, 'users', invitation.userID);
      const userSnap = await getDoc(userRef);
      const workerName = userSnap.exists() ? userSnap.data().name : 'Unknown Worker';

      const projectRef = doc(firestore, 'projects', invitation.projectID);
      const projSnap = await getDoc(projectRef);
      const projectName = projSnap.exists() ? projSnap.data().name : 'Unknown Project';

      // 1) Update doc
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

      // 2) Remove from project doc if present
      await syncProjectWorkersMap(invitation, 'cancelled');

      // 3) Notify the worker
      await addDoc(collection(firestore, 'notifications'), {
        type: 'project_invitation_cancelled',
        title: 'Project Invitation Cancelled',
        message: 'Your project invitation has been cancelled',
        entityID: invitationId,
        entityType: 'project_invitation',
        userID: invitation.userID,
        createdAt: serverTimestamp(),
        read: false,
        link: '/worker/project-invitations'
      });

      // 4) Notify all admins
      await adminNotificationService.notifyAllAdminsInvitationCancelled(
        invitationId,
        workerName,
        projectName,
        reason
      );

      return true;
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      throw error;
    }
  },

  /**
   * retryInvitation (for 'rejected').
   * 1) set status='pending'
   * 2) no change to project doc
   * 3) notify worker
   * 4) optionally notify all admins?
   */
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
      await updateDoc(invRef, {
        status: 'pending',
        updatedAt: serverTimestamp(),
        requiredResponseDate: Timestamp.fromDate(new Date(Date.now() + 7*24*60*60*1000)),
        attempts: arrayUnion({
          date: now,
          by: getAuth().currentUser.uid,
          type: 'retry'
        })
      });

      // 1) Worker notification
      await addDoc(collection(firestore, 'notifications'), {
        type: 'project_invitation_retried',
        title: 'Project Invitation Retried',
        message: 'Your project invitation has been retried. Please respond to it.',
        entityID: invitationId,
        entityType: 'project_invitation',
        userID: invitation.userID,
        createdAt: serverTimestamp(),
        read: false,
        link: '/worker/project-invitations'
      });

      // 2) Admin notification
      // fetch worker & project names
      const userSnap = await getDoc(doc(firestore, 'users', invitation.userID));
      const workerName = userSnap.exists() ? userSnap.data().name : 'Unknown Worker';
      const projectSnap = await getDoc(doc(firestore, 'projects', invitation.projectID));
      const projectName = projectSnap.exists() ? projectSnap.data().name : 'Unknown Project';

      await adminNotificationService.notifyAllAdminsInvitationRetried(
        invitationId,
        workerName,
        projectName
      );

      return true;
    } catch (error) {
      console.error('Error retrying invitation:', error);
      throw error;
    }
  },


  /**
   * reinstateInvitation (for 'cancelled').
   * 1) set status='pending'
   * 2) no immediate project doc change
   * 3) notify worker
   * 4) notify all admins
   */
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

      const userSnap = await getDoc(doc(firestore, 'users', invitation.userID));
      const workerName = userSnap.exists() ? userSnap.data().name : 'Unknown Worker';

      const projectSnap = await getDoc(doc(firestore, 'projects', invitation.projectID));
      const projectName = projectSnap.exists() ? projectSnap.data().name : 'Unknown Project';

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

      // 3) Notify worker
      await addDoc(collection(firestore, 'notifications'), {
        type: 'project_invitation_reinstated',
        title: 'Project Invitation Reinstated',
        message: 'Your project invitation has been reinstated. Please respond to it.',
        entityID: invitationId,
        entityType: 'project_invitation',
        userID: invitation.userID,
        createdAt: serverTimestamp(),
        read: false,
        link: '/worker/project-invitations'
      });

      // 4) Notify all admins
      await adminNotificationService.notifyAllAdminsInvitationReinstated(
        invitationId,
        workerName,
        projectName
      );

      return true;
    } catch (error) {
      console.error('Error reinstating invitation:', error);
      throw error;
    }
  },

  /**
   * expireInvitation: sets status='rejected' if it's pending and past due
   */
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
        await syncProjectWorkersMap(invitation, 'rejected');
      }
      return true;
    } catch (error) {
      console.error('Error expiring invitation:', error);
      throw error;
    }
  },

  /**
   * getAvailableWorkers: returns active workers not yet invited to this project
   */
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
