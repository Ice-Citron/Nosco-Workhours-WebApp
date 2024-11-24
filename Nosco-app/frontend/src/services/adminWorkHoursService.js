import { firestore as db } from '../firebase/firebase_config';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  doc,
  updateDoc,
  Timestamp,
  orderBy,
  writeBatch 
} from 'firebase/firestore';

export const adminWorkHoursService = {
  getWorkHours: async (statusFilter = null, advancedFilters = {}) => {
    try {
      let constraints = [];
      
      // Add status filter if not "all"
      if (statusFilter && statusFilter !== 'all') {
        constraints.push(where('status', '==', statusFilter));
      }
      
      // Add advanced filters
      if (advancedFilters.projectId) {
        constraints.push(where('projectID', '==', advancedFilters.projectId));
      }
      
      if (advancedFilters.workerId) {
        constraints.push(where('userID', '==', advancedFilters.workerId));
      }
      
      if (advancedFilters.dateFrom) {
        constraints.push(where('date', '>=', Timestamp.fromDate(new Date(advancedFilters.dateFrom))));
      }
      
      if (advancedFilters.dateTo) {
        constraints.push(where('date', '<=', Timestamp.fromDate(new Date(advancedFilters.dateTo))));
      }

      // Create query with constraints
      const q = query(
        collection(db, 'workHours'),
        ...constraints,
        orderBy('date', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const workHours = [];
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        
        // Get worker details
        const userDoc = await getDoc(doc(db, 'users', data.userID));
        
        // Get project details
        const projectDoc = await getDoc(doc(db, 'projects', data.projectID));
        
        if (userDoc.exists() && projectDoc.exists()) {
          const workHour = {
            id: docSnapshot.id,
            ...data,
            worker: userDoc.data(),
            project: projectDoc.data(),
            date: data.date
          };

          // Apply hours filters if they exist
          const totalHours = 
            (workHour.regularHours || 0) + 
            (workHour.overtime15x || 0) + 
            (workHour.overtime20x || 0);

          let includeRecord = true;

          if (advancedFilters.regularHoursMin !== undefined && 
              workHour.regularHours < advancedFilters.regularHoursMin) {
            includeRecord = false;
          }
          if (advancedFilters.regularHoursMax !== undefined && 
              workHour.regularHours > advancedFilters.regularHoursMax) {
            includeRecord = false;
          }
          if (advancedFilters.overtime15xMin !== undefined && 
              workHour.overtime15x < advancedFilters.overtime15xMin) {
            includeRecord = false;
          }
          if (advancedFilters.overtime15xMax !== undefined && 
              workHour.overtime15x > advancedFilters.overtime15xMax) {
            includeRecord = false;
          }
          if (advancedFilters.overtime20xMin !== undefined && 
              workHour.overtime20x < advancedFilters.overtime20xMin) {
            includeRecord = false;
          }
          if (advancedFilters.overtime20xMax !== undefined && 
              workHour.overtime20x > advancedFilters.overtime20xMax) {
            includeRecord = false;
          }
          if (advancedFilters.totalHoursMin !== undefined && 
              totalHours < advancedFilters.totalHoursMin) {
            includeRecord = false;
          }
          if (advancedFilters.totalHoursMax !== undefined && 
              totalHours > advancedFilters.totalHoursMax) {
            includeRecord = false;
          }

          if (includeRecord) {
            workHours.push(workHour);
          }
        }
      }
      
      return workHours;
    } catch (error) {
      console.error('Error fetching work hours:', error);
      throw error;
    }
  },

  approveWorkHours: async (workHourId, adminId) => {
    try {
      const workHourRef = doc(db, 'workHours', workHourId);
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

  rejectWorkHours: async (workHourId, adminId, rejectionReason) => {
    try {
      const workHourRef = doc(db, 'workHours', workHourId);
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

  bulkApproveWorkHours: async (workHourIds, adminId) => {
    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();

      for (const id of workHourIds) {
        const ref = doc(db, 'workHours', id);
        batch.update(ref, {
          status: 'approved',
          approvedBy: adminId,
          approvalDate: now,
          updatedAt: now
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error bulk approving work hours:', error);
      throw error;
    }
  },

  bulkRejectWorkHours: async (workHourIds, adminId, rejectionReason) => {
    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();

      for (const id of workHourIds) {
        const ref = doc(db, 'workHours', id);
        batch.update(ref, {
          status: 'rejected',
          approvedBy: adminId,
          approvalDate: now,
          rejectionReason,
          updatedAt: now
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error bulk rejecting work hours:', error);
      throw error;
    }
  }
};