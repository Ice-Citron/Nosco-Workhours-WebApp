// src/services/workerProjectInvitationService.js

import { firestore as db } from '../firebase/firebase_config';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import workerNotificationService from './workerNotificationService';

/**
 * If you want the worker to actually join the project,
 * you'll need to update the project doc's "workers" map, similar to how
 * admin code does it. Let's replicate a mini version of syncProjectWorkersMap:
 */
async function syncProjectWorkersMap(invitation, newStatus) {
  const projectRef = doc(db, 'projects', invitation.projectID);
  const projectSnap = await getDoc(projectRef);
  if (!projectSnap.exists()) {
    console.warn('[syncProjectWorkersMap] Project not found:', invitation.projectID);
    return;
  }
  const projectData = projectSnap.data() || {};
  const workersMap = projectData.workers || {};
  const userId = invitation.userID;

  if (newStatus === 'accepted') {
    // add worker
    workersMap[userId] = {
      status: 'active',
      joinedAt: Timestamp.now()
    };
  } else if (newStatus === 'rejected') {
    // remove worker if present
    if (workersMap[userId]) {
      delete workersMap[userId];
    }
  }
  await updateDoc(projectRef, { workers: workersMap });
}

/**
 * Optionally fetch project details if you want to show them in worker UI
 */
export const getProjectDetails = async (projectID) => {
  try {
    const projectRef = doc(db, 'projects', projectID);
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }
    return { id: projectSnap.id, ...projectSnap.data() };
  } catch (error) {
    console.error('Error fetching project details:', error);
    throw error;
  }
};

/**
 * Get all invitations for a worker, ordered by createdAt desc.
 */
export const getWorkerProjectInvitations = async (userId) => {
  try {
    const invitationsRef = collection(db, 'projectInvitations');
    const q = query(
      invitationsRef,
      where('userID', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    const invitations = [];
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      // If you want the project details:
      const project = await getProjectDetails(data.projectID);
      invitations.push({
        id: docSnap.id,
        ...data,
        project
      });
    }
    return invitations;
  } catch (error) {
    console.error('Error fetching worker project invitations:', error);
    throw error;
  }
};

/**
 * Accept an invitation => set status = 'accepted'
 * Then notify all admins (no worker notification).
 */
export const acceptProjectInvitation = async (invitationId, userId) => {
  try {
    // 1) fetch invitation doc
    const invitationRef = doc(db, 'projectInvitations', invitationId);
    const snap = await getDoc(invitationRef);
    if (!snap.exists()) {
      throw new Error('Invitation not found');
    }
    const invitation = snap.data();

    if (invitation.status !== 'pending') {
      throw new Error('Can only accept a pending invitation');
    }
    if (invitation.userID !== userId) {
      throw new Error('You are not the owner of this invitation');
    }

    // 2) update doc
    const attempt = {
      date: Timestamp.now(),
      by: userId,
      type: 'accepted'
    };
    await updateDoc(invitationRef, {
      status: 'accepted',
      responseDate: serverTimestamp(),
      attempts: arrayUnion(attempt),
      // remove declineReason if any
      declineReason: null
    });

    // 3) sync with project doc
    await syncProjectWorkersMap({ ...invitation, id: invitationId }, 'accepted');

    // 4) notify all admins
    // fetch worker & project name for better admin message
    const userSnap = await getDoc(doc(db, 'users', userId));
    const workerName = userSnap.exists() ? userSnap.data().name : 'Unknown Worker';

    const projectSnap = await getDoc(doc(db, 'projects', invitation.projectID));
    const projectName = projectSnap.exists() ? projectSnap.data().name : 'Unknown Project';

    await workerNotificationService.notifyAllAdminsInvitationAccepted(
      invitationId,
      workerName,
      projectName
    );

    return true;
  } catch (error) {
    console.error('Error accepting invitation:', error);
    throw error;
  }
};

/**
 * Decline an invitation => set status = 'rejected'
 * Then notify all admins (no worker notification).
 */
export const declineProjectInvitation = async (invitationId, userId, declineReason) => {
  try {
    // 1) fetch invitation doc
    const invitationRef = doc(db, 'projectInvitations', invitationId);
    const snap = await getDoc(invitationRef);
    if (!snap.exists()) {
      throw new Error('Invitation not found');
    }
    const invitation = snap.data();

    if (invitation.status !== 'pending') {
      throw new Error('Can only reject a pending invitation');
    }
    if (invitation.userID !== userId) {
      throw new Error('You are not the owner of this invitation');
    }

    // 2) update doc
    const attempt = {
      date: Timestamp.now(),
      by: userId,
      type: 'rejected'
    };
    await updateDoc(invitationRef, {
      status: 'rejected',
      responseDate: serverTimestamp(),
      attempts: arrayUnion(attempt),
      declineReason
    });

    // 3) remove from project doc if present
    await syncProjectWorkersMap({ ...invitation, id: invitationId }, 'rejected');

    // 4) notify all admins
    // fetch worker & project name
    const userSnap = await getDoc(doc(db, 'users', userId));
    const workerName = userSnap.exists() ? userSnap.data().name : 'Unknown Worker';

    const projectSnap = await getDoc(doc(db, 'projects', invitation.projectID));
    const projectName = projectSnap.exists() ? projectSnap.data().name : 'Unknown Project';

    await workerNotificationService.notifyAllAdminsInvitationRejected(
      invitationId,
      workerName,
      projectName,
      declineReason
    );

    return true;
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    throw error;
  }
};

export default {
  getWorkerProjectInvitations,
  acceptProjectInvitation,
  declineProjectInvitation
};
