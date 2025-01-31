// src/services/adminWorkHoursService.js
import { firestore as db } from '../firebase/firebase_config'; // or { firestore as db }, whichever your file exports
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

// Helper function to calculate the payment amount
const calculateAmount = (hours, rates = {}) => {
  const { regular = 0, ot1_5 = 0, ot2_0 = 0 } = rates;
  return (
    (hours.regularHours || 0) * regular +
    (hours.overtime15x || 0) * ot1_5 +
    (hours.overtime20x || 0) * ot2_0
  );
};

export const adminWorkHoursService = {
  /**
   * Fetch work hours from `workHours` collection with optional filters (status, project, worker, date range).
   */
  getWorkHours: async (statusFilter = null, advancedFilters = {}) => {
    try {
      const constraints = [];

      // Status filter if not "all"
      if (statusFilter && statusFilter !== 'all') {
        constraints.push(where('status', '==', statusFilter));
      }

      // Additional advanced filters
      if (advancedFilters.projectId) {
        constraints.push(where('projectID', '==', advancedFilters.projectId));
      }
      if (advancedFilters.workerId) {
        constraints.push(where('userID', '==', advancedFilters.workerId));
      }
      if (advancedFilters.dateFrom) {
        constraints.push(
          where('date', '>=', Timestamp.fromDate(new Date(advancedFilters.dateFrom)))
        );
      }
      if (advancedFilters.dateTo) {
        constraints.push(
          where('date', '<=', Timestamp.fromDate(new Date(advancedFilters.dateTo)))
        );
      }

      // Build the query
      const qWorkHours = query(
        collection(db, 'workHours'),
        ...constraints,
        orderBy('date', 'desc')
      );

      // Run the query
      const snapshot = await getDocs(qWorkHours);
      const workHours = [];

      // For each doc, optionally fetch worker doc, project doc, apply filters
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();

        // Get worker details
        const userRef = doc(db, 'users', data.userID);
        const userDocSnap = await getDoc(userRef);

        // Get project details
        const projectRef = doc(db, 'projects', data.projectID);
        const projectDocSnap = await getDoc(projectRef);

        if (userDocSnap.exists() && projectDocSnap.exists()) {
          const workerObj = userDocSnap.data();
          const projectObj = projectDocSnap.data();

          const record = {
            id: docSnapshot.id,
            ...data,
            worker: workerObj,
            project: projectObj,
            date: data.date, // Timestamps, etc.
          };

          // Optionally, apply any in-memory filters for hours
          const totalHours =
            (record.regularHours || 0) +
            (record.overtime15x || 0) +
            (record.overtime20x || 0);

          let includeRecord = true;

          // Checking advancedFilters.* for min/max
          if (
            advancedFilters.regularHoursMin !== undefined &&
            record.regularHours < advancedFilters.regularHoursMin
          ) {
            includeRecord = false;
          }
          if (
            advancedFilters.regularHoursMax !== undefined &&
            record.regularHours > advancedFilters.regularHoursMax
          ) {
            includeRecord = false;
          }
          if (
            advancedFilters.overtime15xMin !== undefined &&
            record.overtime15x < advancedFilters.overtime15xMin
          ) {
            includeRecord = false;
          }
          if (
            advancedFilters.overtime15xMax !== undefined &&
            record.overtime15x > advancedFilters.overtime15xMax
          ) {
            includeRecord = false;
          }
          if (
            advancedFilters.overtime20xMin !== undefined &&
            record.overtime20x < advancedFilters.overtime20xMin
          ) {
            includeRecord = false;
          }
          if (
            advancedFilters.overtime20xMax !== undefined &&
            record.overtime20x > advancedFilters.overtime20xMax
          ) {
            includeRecord = false;
          }
          if (
            advancedFilters.totalHoursMin !== undefined &&
            totalHours < advancedFilters.totalHoursMin
          ) {
            includeRecord = false;
          }
          if (
            advancedFilters.totalHoursMax !== undefined &&
            totalHours > advancedFilters.totalHoursMax
          ) {
            includeRecord = false;
          }

          if (includeRecord) {
            workHours.push(record);
          }
        }
      }

      return workHours;
    } catch (error) {
      console.error('Error fetching work hours:', error);
      throw error;
    }
  },

  /**
   * Approve a single work hour doc
   */
  approveWorkHours: async (workHourId, adminId) => {
    try {
      const ref = doc(db, 'workHours', workHourId);
      await updateDoc(ref, {
        status: 'approved',
        approvedBy: adminId,
        approvalDate: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error approving work hours:', error);
      throw error;
    }
  },

  /**
   * Reject a single work hour doc
   */
  rejectWorkHours: async (workHourId, adminId, rejectionReason) => {
    try {
      const ref = doc(db, 'workHours', workHourId);
      await updateDoc(ref, {
        status: 'rejected',
        approvedBy: adminId,
        approvalDate: Timestamp.now(),
        rejectionReason,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error rejecting work hours:', error);
      throw error;
    }
  },

  /**
   * Bulk approve multiple work hour docs
   */
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
          updatedAt: now,
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error bulk approving work hours:', error);
      throw error;
    }
  },

  /**
   * Bulk reject multiple work hour docs
   */
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
          updatedAt: now,
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error bulk rejecting work hours:', error);
      throw error;
    }
  },

  /**
   * Summarize unpaid hours with status=approved or processing
   */
  getUnpaidApprovedHours: async () => {
    try {
      // get all 'approved' or 'processing' from "workHours"
      const qRef = query(
        collection(db, 'workHours'),
        where('status', 'in', ['approved', 'processing'])
      );

      const snapshot = await getDocs(qRef);

      // Group by worker
      const workerHoursMap = {};
      const workerIds = new Set();

      // build a list of worker IDs
      snapshot.docs.forEach((snap) => {
        const whData = snap.data();
        workerIds.add(whData.userID);
      });

      // fetch all workers in one go
      const workerDataMap = {};
      await Promise.all(
        Array.from(workerIds).map(async (workerId) => {
          const ref = doc(db, 'users', workerId);
          const userSnap = await getDoc(ref);
          if (userSnap.exists()) {
            workerDataMap[workerId] = userSnap.data();
          }
        })
      );

      // build map
      snapshot.forEach((docSnap) => {
        const hours = docSnap.data();
        const workerId = hours.userID;
        const wData = workerDataMap[workerId] || {};

        // init worker entry if not exist
        if (!workerHoursMap[workerId]) {
          workerHoursMap[workerId] = {
            unpaidHours: {},
            processingAmount: 0,
            projects: new Set(),
          };
        }

        const projectId = hours.projectID;
        if (!workerHoursMap[workerId].unpaidHours[projectId]) {
          workerHoursMap[workerId].unpaidHours[projectId] = {
            regularHours: 0,
            overtime15x: 0,
            overtime20x: 0,
            processing: {
              regularHours: 0,
              overtime15x: 0,
              overtime20x: 0,
            },
            entries: [],
          };
        }

        // separate processing vs approved
        if (hours.status === 'processing') {
          workerHoursMap[workerId].unpaidHours[projectId].processing.regularHours += hours.regularHours || 0;
          workerHoursMap[workerId].unpaidHours[projectId].processing.overtime15x += hours.overtime15x || 0;
          workerHoursMap[workerId].unpaidHours[projectId].processing.overtime20x += hours.overtime20x || 0;

          workerHoursMap[workerId].processingAmount += calculateAmount(hours, wData.rates);
        } else {
          // approved
          workerHoursMap[workerId].unpaidHours[projectId].regularHours += hours.regularHours || 0;
          workerHoursMap[workerId].unpaidHours[projectId].overtime15x += hours.overtime15x || 0;
          workerHoursMap[workerId].unpaidHours[projectId].overtime20x += hours.overtime20x || 0;
        }

        // push the entry
        workerHoursMap[workerId].unpaidHours[projectId].entries.push({
          id: docSnap.id,
          ...hours,
        });

        // track which projects this worker belongs to
        workerHoursMap[workerId].projects.add(projectId);
      });

      // convert object -> array
      const results = Object.entries(workerHoursMap).map(([workerId, data]) => {
        const wData = workerDataMap[workerId] || {};
        return {
          id: workerId,
          name: wData.name || 'Unknown Worker',
          position: wData.position || 'Unknown Position',
          profilePic: wData.profilePic || null,
          unpaidHours: data.unpaidHours,
          processingAmount: data.processingAmount,
          projects: Array.from(data.projects),
          rates: wData.rates || { regular: 0, ot1_5: 0, ot2_0: 0 },
        };
      });

      return results;
    } catch (error) {
      console.error('Error in getUnpaidApprovedHours:', error);
      throw error;
    }
  },

  /**
   * Mark hours as "processing"
   */
  markHoursAsProcessing: async (hourIds) => {
    try {
      const batch = writeBatch(db);

      hourIds.forEach((id) => {
        const ref = doc(db, 'workHours', id);
        batch.update(ref, {
          status: 'processing',
          processingDate: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
        });
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error marking hours as processing:', error);
      throw error;
    }
  },

  /**
   * Mark hours as "paid"
   */
  markHoursAsPaid: async (hourIds, paymentDetails) => {
    try {
      const batch = writeBatch(db);

      hourIds.forEach((id) => {
        const ref = doc(db, 'workHours', id);
        batch.update(ref, {
          paid: true,
          paymentDate: Timestamp.fromDate(new Date()),
          paymentReference: paymentDetails.reference,
          paymentAmount: paymentDetails.amount,
          updatedAt: Timestamp.fromDate(new Date()),
        });
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error marking hours as paid:', error);
      throw error;
    }
  },

  /**
   * Return all unpaid hours for a specific worker
   */
  getWorkerUnpaidHours: async (workerId) => {
    try {
      const refWorkHours = collection(db, 'workHours');
      const qRef = query(
        refWorkHours,
        where('userID', '==', workerId),
        where('status', '==', 'approved'),
        where('paid', '==', false)
      );

      const snapshot = await getDocs(qRef);
      const hoursMap = {};

      snapshot.docs.forEach((snap) => {
        const data = snap.data();
        const projectId = data.projectID;

        if (!hoursMap[projectId]) {
          hoursMap[projectId] = {
            regularHours: 0,
            overtime15x: 0,
            overtime20x: 0,
            entries: [],
          };
        }

        hoursMap[projectId].regularHours += data.regularHours || 0;
        hoursMap[projectId].overtime15x += data.overtime15x || 0;
        hoursMap[projectId].overtime20x += data.overtime20x || 0;

        // Convert timestamps to JS Date if needed
        hoursMap[projectId].entries.push({
          id: snap.id,
          ...data,
          date: data.date?.toDate?.() || new Date(data.date),
        });
      });

      return hoursMap;
    } catch (error) {
      console.error('Error fetching worker unpaid hours:', error);
      throw error;
    }
  },

  /**
   * Complete payment for an array of hours, create a payment doc
   */
  completePayment: async (hourIds, paymentDetails) => {
    try {
      const batch = writeBatch(db);

      // create payment doc
      const paymentsCollRef = collection(db, 'payments');
      const paymentRef = doc(paymentsCollRef); // random doc ID
      batch.set(paymentRef, {
        ...paymentDetails,
        status: 'completed',
        createdAt: Timestamp.fromDate(new Date()),
        workHourIds: hourIds,
      });

      // update each hour doc
      hourIds.forEach((id) => {
        const hourRef = doc(db, 'workHours', id);
        batch.update(hourRef, {
          status: 'paid',
          paymentId: paymentRef.id,
          paymentDate: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
        });
      });

      await batch.commit();
      return paymentRef.id;
    } catch (error) {
      console.error('Error completing payment:', error);
      throw error;
    }
  },

  /**
   * Get all "paid" work hours, grouped by `paymentId`.
   */
  getPaidWorkHours: async () => {
    try {
      const refWorkHours = collection(db, 'workHours');
      const qRef = query(
        refWorkHours,
        where('status', '==', 'paid'),
        orderBy('paymentDate', 'desc')
      );

      const snapshot = await getDocs(qRef);
      const paymentsMap = {};

      snapshot.docs.forEach((snap) => {
        const data = snap.data();
        const pId = data.paymentId;

        if (!paymentsMap[pId]) {
          paymentsMap[pId] = {
            id: pId,
            workHours: [],
            paymentDate: data.paymentDate,
            status: 'completed',
            comments: data.comments || [],
            attachments: data.attachments || [],
          };
        }

        paymentsMap[pId].workHours.push({
          id: snap.id,
          ...data,
        });
      });

      return Object.values(paymentsMap);
    } catch (error) {
      console.error('Error fetching paid work hours:', error);
      throw error;
    }
  },
};
