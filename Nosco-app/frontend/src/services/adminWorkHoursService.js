// src/services/adminWorkHoursService.js
import { firestore } from '../firebase/firebase_config';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  doc,
  updateDoc,
  Timestamp,
  orderBy
} from 'firebase/firestore';

export const adminWorkHoursService = {
  // Get pending work hours
  getPendingWorkHours: async () => {
    try {
      const q = query(
        collection(firestore, 'workHours'),
        where('status', '==', 'pending'),
        orderBy('date', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const workHours = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Get worker details
        const userDoc = await getDoc(doc.ref.parent.parent
          .collection('users').doc(data.userID));
        
        // Get project details
        const projectDoc = await getDoc(doc.ref.parent.parent
          .collection('projects').doc(data.projectID));
        
        workHours.push({
          id: doc.id,
          ...data,
          worker: userDoc.data(),
          project: projectDoc.data()
        });
      }
      
      return workHours;
    } catch (error) {
      console.error('Error fetching pending work hours:', error);
      throw error;
    }
  },

  // Approve work hours
  approveWorkHours: async (workHourId, adminId) => {
    try {
      const workHourRef = doc(firestore, 'workHours', workHourId);
      await updateDoc(workHourRef, {
        status: 'approved',
        approvedBy: adminId,
        approvalDate: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error approving work hours:', error);
      throw error;
    }
  },

  // Reject work hours
  rejectWorkHours: async (workHourId, adminId, rejectionReason) => {
    try {
      const workHourRef = doc(firestore, 'workHours', workHourId);
      await updateDoc(workHourRef, {
        status: 'rejected',
        approvedBy: adminId,
        approvalDate: Timestamp.now(),
        rejectionReason,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error rejecting work hours:', error);
      throw error;
    }
  },

  // Bulk approve work hours
  bulkApproveWorkHours: async (workHourIds, adminId) => {
    try {
      const batch = firestore.batch();
      const now = Timestamp.now();

      workHourIds.forEach(id => {
        const ref = doc(firestore, 'workHours', id);
        batch.update(ref, {
          status: 'approved',
          approvedBy: adminId,
          approvalDate: now,
          updatedAt: now
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk approving work hours:', error);
      throw error;
    }
  },

  // Bulk reject work hours
  bulkRejectWorkHours: async (workHourIds, adminId, rejectionReason) => {
    try {
      const batch = firestore.batch();
      const now = Timestamp.now();

      workHourIds.forEach(id => {
        const ref = doc(firestore, 'workHours', id);
        batch.update(ref, {
          status: 'rejected',
          approvedBy: adminId,
          approvalDate: now,
          rejectionReason,
          updatedAt: now
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error bulk rejecting work hours:', error);
      throw error;
    }
  }
};