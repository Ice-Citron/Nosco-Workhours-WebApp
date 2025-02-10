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
  getDoc
} from 'firebase/firestore';

// Helper to fetch project details (so we can enrich each invitation)
export const getProjectDetails = async (projectID) => {
  try {
    const projectRef = doc(db, 'projects', projectID);
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()) throw new Error('Project not found');
    return { id: projectSnap.id, ...projectSnap.data() };
  } catch (error) {
    console.error('Error fetching project details:', error);
    throw error;
  }
};

// Get all invitations for a worker, ordered by createdAt (descending)
export const getWorkerProjectInvitations = async (userId) => {
  try {
    const invitationsRef = collection(db, 'projectInvitations');
    const q = query(invitationsRef, where('userID', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const invitations = [];
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      // Enrich with project details
      const project = await getProjectDetails(data.projectID);
      invitations.push({ id: docSnap.id, ...data, project });
    }
    return invitations;
  } catch (error) {
    console.error('Error fetching worker project invitations:', error);
    throw error;
  }
};

// Update the invitation status and add a notification
export const updateInvitationStatus = async (invitationId, newStatus, extraFields = {}) => {
  try {
    const invitationRef = doc(db, 'projectInvitations', invitationId);
    const updateData = {
      status: newStatus,
      responseDate: serverTimestamp(),
      ...extraFields
    };
    await updateDoc(invitationRef, updateData);

    // Create a notification (for example, to notify admin)
    const notificationsRef = collection(db, 'notifications');
    const notification = {
      type: 'projectInvitation',
      title: `Project Invitation ${newStatus}`,
      message: `Worker has ${newStatus.toLowerCase()} the invitation.`,
      entityID: invitationId,
      entityType: 'projectInvitation',
      userID: 'admin', // Adjust as needed
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

export const acceptProjectInvitation = async (invitationId, userId) => {
  // For acceptance, simply update the status to "Accepted"
  return updateInvitationStatus(invitationId, 'Accepted');
};

export const declineProjectInvitation = async (invitationId, userId, declineReason) => {
  // For decline, update the status to "Declined" and include the declineReason
  return updateInvitationStatus(invitationId, 'Declined', { declineReason });
};

export default {
  getWorkerProjectInvitations,
  acceptProjectInvitation,
  declineProjectInvitation
};
