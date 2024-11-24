import { firestore as db } from '../firebase/firebase_config';
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
  orderBy,
  writeBatch 
} from 'firebase/firestore';


// Helper function to calculate amount based on hours and rates
const calculateAmount = (hours, rates = {}) => {
  const { regular = 0, ot1_5 = 0, ot2_0 = 0 } = rates;
  return (
    (hours.regularHours || 0) * regular +
    (hours.overtime15x || 0) * ot1_5 +
    (hours.overtime20x || 0) * ot2_0
  );
};

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
  },

  // Fetch unpaid approved hours grouped by worker
  getUnpaidApprovedHours: async () => {
    try {
      const workHoursRef = collection(firestore, 'workHours');
      const q = query(
        workHoursRef,
        where('status', 'in', ['approved', 'processing'])
      );

      const snapshot = await getDocs(q);
      
      // Group by worker
      const workerHours = {};
      
      // First, get all worker IDs and fetch their data
      const workerIds = new Set(snapshot.docs.map(doc => doc.data().userID));
      const workerDataMap = {};
      
      await Promise.all(Array.from(workerIds).map(async (workerId) => {
        const workerRef = doc(firestore, 'users', workerId);
        const workerSnap = await getDoc(workerRef);
        if (workerSnap.exists()) {
          workerDataMap[workerId] = workerSnap.data();
        }
      }));

      snapshot.docs.forEach(doc => {
        const hours = doc.data();
        const workerId = hours.userID;
        const workerData = workerDataMap[workerId] || {};
        
        if (!workerHours[workerId]) {
          workerHours[workerId] = {
            unpaidHours: {},
            processingAmount: 0,
            projects: new Set()
          };
        }

        const projectId = hours.projectID;
        if (!workerHours[workerId].unpaidHours[projectId]) {
          workerHours[workerId].unpaidHours[projectId] = {
            regularHours: 0,
            overtime15x: 0,
            overtime20x: 0,
            processing: {
              regularHours: 0,
              overtime15x: 0,
              overtime20x: 0,
            },
            entries: []
          };
        }

        // Separate processing and approved hours
        if (hours.status === 'processing') {
          workerHours[workerId].unpaidHours[projectId].processing.regularHours += hours.regularHours || 0;
          workerHours[workerId].unpaidHours[projectId].processing.overtime15x += hours.overtime15x || 0;
          workerHours[workerId].unpaidHours[projectId].processing.overtime20x += hours.overtime20x || 0;
          workerHours[workerId].processingAmount += calculateAmount(hours, workerData.rates);
        } else {
          workerHours[workerId].unpaidHours[projectId].regularHours += hours.regularHours || 0;
          workerHours[workerId].unpaidHours[projectId].overtime15x += hours.overtime15x || 0;
          workerHours[workerId].unpaidHours[projectId].overtime20x += hours.overtime20x || 0;
        }
        
        workerHours[workerId].unpaidHours[projectId].entries.push({
          id: doc.id,
          ...hours
        });
        
        workerHours[workerId].projects.add(projectId);
      });

      // Convert to array with worker details
      const workersWithHours = Object.entries(workerHours).map(([workerId, data]) => {
        const workerData = workerDataMap[workerId] || {};
        
        return {
          id: workerId,
          name: workerData.name || 'Unknown Worker',
          position: workerData.position || 'Unknown Position',
          profilePic: workerData.profilePic || null,
          unpaidHours: data.unpaidHours,
          processingAmount: data.processingAmount,
          projects: Array.from(data.projects),
          rates: workerData.rates || {
            regular: 0,
            ot1_5: 0,
            ot2_0: 0
          }
        };
      });

      return workersWithHours;
    } catch (error) {
      console.error('Error in getUnpaidApprovedHours:', error);
      throw error;
    }
  },

  markHoursAsProcessing: async (hourIds) => {
    try {
      const batch = writeBatch(firestore);
      
      hourIds.forEach(id => {
        const hourRef = doc(firestore, 'workHours', id);
        batch.update(hourRef, {
          status: 'processing',
          processingDate: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date())
        });
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error marking hours as processing:', error);
      throw error;
    }
  },

  markHoursAsPaid: async (hourIds, paymentDetails) => {
    try {
      // Create a batch
      const batch = writeBatch(firestore);
      
      // Update each work hour document
      hourIds.forEach(id => {
        const hourRef = doc(firestore, 'workHours', id);
        batch.update(hourRef, {
          paid: true,
          paymentDate: Timestamp.fromDate(new Date()),
          paymentReference: paymentDetails.reference,
          paymentAmount: paymentDetails.amount,
          updatedAt: Timestamp.fromDate(new Date())
        });
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error marking hours as paid:', error);
      throw error;
    }
  },

  getWorkerUnpaidHours: async (workerId) => {
    try {
      const workHoursRef = collection(firestore, 'workHours');
      const q = query(
        workHoursRef,
        where('userID', '==', workerId),
        where('status', '==', 'approved'),
        where('paid', '==', false)
      );

      const snapshot = await getDocs(q);
      const hours = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const projectId = data.projectID;

        if (!hours[projectId]) {
          hours[projectId] = {
            regularHours: 0,
            overtime15x: 0,
            overtime20x: 0,
            entries: []
          };
        }

        hours[projectId].regularHours += data.regularHours || 0;
        hours[projectId].overtime15x += data.overtime15x || 0;
        hours[projectId].overtime20x += data.overtime20x || 0;
        hours[projectId].entries.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate?.() || new Date(data.date)
        });
      });

      return hours;
    } catch (error) {
      console.error('Error fetching worker unpaid hours:', error);
      throw error;
    }
  },

  completePayment: async (hourIds, paymentDetails) => {
    try {
      const batch = writeBatch(firestore);
      
      // Create payment record
      const paymentRef = doc(collection(firestore, 'payments'));
      batch.set(paymentRef, {
        ...paymentDetails,
        status: 'completed',
        createdAt: Timestamp.fromDate(new Date()),
        workHourIds: hourIds
      });

      // Update work hours
      hourIds.forEach(id => {
        const hourRef = doc(firestore, 'workHours', id);
        batch.update(hourRef, {
          status: 'paid',
          paymentId: paymentRef.id,
          paymentDate: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date())
        });
      });

      await batch.commit();
      return paymentRef.id;
    } catch (error) {
      console.error('Error completing payment:', error);
      throw error;
    }
  },

  getPaidWorkHours: async () => {
    try {
      const workHoursRef = collection(firestore, 'workHours');
      const q = query(
        workHoursRef,
        where('status', '==', 'paid'),
        orderBy('paymentDate', 'desc')
      );

      const snapshot = await getDocs(q);
      const payments = {};

      // Group by paymentId
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!payments[data.paymentId]) {
          payments[data.paymentId] = {
            id: data.paymentId,
            workHours: [],
            paymentDate: data.paymentDate,
            status: 'completed',
            comments: data.comments || [],
            attachments: data.attachments || []
          };
        }
        payments[data.paymentId].workHours.push({
          id: doc.id,
          ...data
        });
      });

      return Object.values(payments);
    } catch (error) {
      console.error('Error fetching paid work hours:', error);
      throw error;
    }
  },
};