// File: src/services/workerProjectInvitationService.js

import { firestore as db } from '../firebase/firebase_config';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
  getDoc,
  arrayUnion,
  Timestamp
} from 'firebase/firestore';

/**
 * Optionally fetch project details if you want to enrich the data.
 * Otherwise, you can skip this if you don't need the project info in your worker UI.
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
      // If you want to fetch project details, do so here:
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
 * updateInvitationStatus
 * - Sets the invitation's "status" and "responseDate".
 * - Appends an attempt to the "attempts" array (e.g. { type: 'accepted', date, by })
 * - Creates a notification with userID == worker's UID
 */
export const updateInvitationStatus = async (
  invitationId,
  newStatus,    // "accepted" or "rejected"
  userId,
  extraFields = {}
) => {
  if (!userId) {
    throw new Error('userId is required to update the invitation');
  }
  try {
    const invitationRef = doc(db, 'projectInvitations', invitationId);

    // Build an attempt object
    const attempt = {
      date: Timestamp.now(),
      by: userId,
      type: newStatus // e.g. "accepted", "rejected"
    };

    // Prepare the update data
    const updateData = {
      status: newStatus,
      responseDate: serverTimestamp(),
      attempts: arrayUnion(attempt),
      ...extraFields
    };

    await updateDoc(invitationRef, updateData);

    // Create a notification for the worker
    const notificationsRef = collection(db, 'notifications');
    const notification = {
      type: 'projectInvitation',
      title: `Project Invitation ${newStatus}`,
      message: `Worker has ${newStatus} the invitation.`,
      entityID: invitationId,
      entityType: 'projectInvitation',
      userID: userId, // must match the worker's UID for your rules
      createdAt: serverTimestamp(),
      read: false
    };
    await addDoc(notificationsRef, notification);

    return true;
  } catch (error) {
    console.error('Error updating invitation status:', error);
    throw error;
  }
};

/**
 * Accepts an invitation
 * - sets status = 'accepted'
 * - logs an attempt in attempts[]
 */
export const acceptProjectInvitation = async (invitationId, userId) => {
  return updateInvitationStatus(invitationId, 'accepted', userId);
};

/**
 * Declines an invitation
 * - sets status = 'rejected'
 * - logs an attempt in attempts[]
 * - includes declineReason if provided
 */
export const declineProjectInvitation = async (invitationId, userId, declineReason) => {
  return updateInvitationStatus(invitationId, 'rejected', userId, {
    declineReason
  });
};

export default {
  getWorkerProjectInvitations,
  acceptProjectInvitation,
  declineProjectInvitation
};
