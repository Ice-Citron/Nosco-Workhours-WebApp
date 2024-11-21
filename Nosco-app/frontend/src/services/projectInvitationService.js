import { firestore as db } from '../firebase/firebase_config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc,
  updateDoc,
  orderBy,
  serverTimestamp,
  addDoc 
} from 'firebase/firestore';

// Get project details
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

// Get invitations by status for a worker
export const getInvitationsByStatus = async (userID, status) => {
  try {
    const invitationsRef = collection(db, 'projectInvitations');
    const q = query(
      invitationsRef,
      where('userID', '==', userID),
      where('status', '==', status),
      orderBy('invitationDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const invitations = [];
    
    for (const doc of querySnapshot.docs) {
      const invitation = { id: doc.id, ...doc.data() };
      const project = await getProjectDetails(invitation.projectID);
      invitations.push({ ...invitation, project });
    }
    
    return invitations;
  } catch (error) {
    console.error(`Error fetching ${status} invitations:`, error);
    throw error;
  }
};

// Get all invitations for a worker
export const getAllInvitations = async (userID) => {
  try {
    const [pending, accepted, declined] = await Promise.all([
      getInvitationsByStatus(userID, 'Pending'),
      getInvitationsByStatus(userID, 'Accepted'),
      getInvitationsByStatus(userID, 'Declined')
    ]);

    return {
      pending,
      accepted,
      declined
    };
  } catch (error) {
    console.error('Error fetching all invitations:', error);
    throw error;
  }
};

// Update invitation status with optimistic update
export const updateInvitationStatus = async (invitationId, userID, newStatus) => {
  try {
    const invitationRef = doc(db, 'projectInvitations', invitationId);
    const updateData = {
      status: newStatus,
      responseDate: serverTimestamp()
    };

    // Immediately return the expected new state
    const updatedInvitation = {
      id: invitationId,
      status: newStatus,
      responseDate: new Date() // Use local date for immediate UI update
    };

    // Update Firestore in background
    await updateDoc(invitationRef, updateData);

    // Create notification for admin
    const notificationRef = collection(db, 'notifications');
    const notification = {
      type: 'projectInvitation',
      title: `Project Invitation ${newStatus}`,
      message: `Worker has ${newStatus.toLowerCase()} the project invitation`,
      entityID: invitationId,
      entityType: 'projectInvitation',
      userID: 'admin',
      createdAt: serverTimestamp(),
      read: false
    };

    await addDoc(notificationRef, notification);
    return updatedInvitation;
  } catch (error) {
    console.error('Error updating invitation status:', error);
    throw error;
  }
};

export default {
  getProjectDetails,
  getAllInvitations,
  getInvitationsByStatus,
  updateInvitationStatus
};