// src/services/adminWorkHoursService.js
import { firestore as db } from '../firebase/firebase_config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  writeBatch,
  updateDoc,
  Timestamp
} from 'firebase/firestore';

/**
 * Helper: compute cost using baseRate for regular hours,
 * and 1.5 * baseRate for “overtime15x”, 2.0 * baseRate for “overtime20x”
 */
function computeHourCost(hourDoc, baseRate = 0) {
  const reg = hourDoc.regularHours || 0;
  const ot15 = hourDoc.overtime15x || 0;
  const ot20 = hourDoc.overtime20x || 0;

  // No longer using separate ot1_5 or ot2_0 fields from the worker doc:
  return (
    reg * baseRate + 
    ot15 * (baseRate * 1.5) + 
    ot20 * (baseRate * 2.0)
  );
}

export const adminWorkHoursService = {
  /**
   * GET WORK HOURS (with optional filters)
   */
  getWorkHours: async (statusFilter = null, advancedFilters = {}) => {
    try {
      const constraints = [];
      // If not "all", filter by status
      if (statusFilter && statusFilter !== 'all') {
        constraints.push(where('status', '==', statusFilter));
      }
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

      const qWorkHours = query(
        collection(db, 'workHours'),
        ...constraints,
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(qWorkHours);
      const results = [];

      for (const docSnap of snapshot.docs) {
        const whData = docSnap.data();
        // Optionally fetch user + project
        const userRef = doc(db, 'users', whData.userID);
        const userDoc = await getDoc(userRef);

        const projectRef = doc(db, 'projects', whData.projectID);
        const projectDoc = await getDoc(projectRef);

        if (userDoc.exists() && projectDoc.exists()) {
          const workerObj = userDoc.data();
          const projectObj = projectDoc.data();

          const record = {
            id: docSnap.id,
            ...whData,
            worker: workerObj,
            project: projectObj,
            date: whData.date // Firestore Timestamp
          };

          // If you have advanced in-memory filters:
          // e.g. totalHours, etc...
          // Omitted for brevity

          results.push(record);
        }
      }
      return results;
    } catch (error) {
      console.error('Error fetching work hours:', error);
      throw error;
    }
  },

  /**
   * APPROVE single doc
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
   * REJECT single doc
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
   * BULK APPROVE
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
   * BULK REJECT
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
   * Summarize hours with status in ['approved','processing']
   * (Your existing getUnpaidApprovedHours)
   */
  getUnpaidApprovedHours: async () => {
    try {
      const qRef = query(
        collection(db, 'workHours'),
        where('status', 'in', ['approved', 'processing'])
      );
      const snapshot = await getDocs(qRef);

      const workerHoursMap = {};
      const workerIds = new Set();

      snapshot.docs.forEach((snap) => {
        const whData = snap.data();
        workerIds.add(whData.userID);
      });

      // fetch worker data in one go
      const workerDataMap = {};
      await Promise.all(
        Array.from(workerIds).map(async (uid) => {
          const ref = doc(db, 'users', uid);
          const userSnap = await getDoc(ref);
          if (userSnap.exists()) {
            workerDataMap[uid] = userSnap.data();
          }
        })
      );

      snapshot.forEach((docSnap) => {
        const whData = docSnap.data();
        const workerId = whData.userID;
        if (!workerHoursMap[workerId]) {
          workerHoursMap[workerId] = {
            unpaidHours: {},
            processingAmount: 0,
            projects: new Set(),
          };
        }
        const projectId = whData.projectID;
        if (!workerHoursMap[workerId].unpaidHours[projectId]) {
          workerHoursMap[workerId].unpaidHours[projectId] = {
            regularHours: 0,
            overtime15x: 0,
            overtime20x: 0,
            processing: { regularHours: 0, overtime15x: 0, overtime20x: 0 },
            entries: [],
          };
        }

        // If it's 'processing', do something
        if (whData.status === 'processing') {
          workerHoursMap[workerId].unpaidHours[projectId].processing.regularHours += whData.regularHours || 0;
          workerHoursMap[workerId].unpaidHours[projectId].processing.overtime15x += whData.overtime15x || 0;
          workerHoursMap[workerId].unpaidHours[projectId].processing.overtime20x += whData.overtime20x || 0;
          // Accumulate cost if needed...
          // ...
        } else {
          // status=approved
          workerHoursMap[workerId].unpaidHours[projectId].regularHours += whData.regularHours || 0;
          workerHoursMap[workerId].unpaidHours[projectId].overtime15x += whData.overtime15x || 0;
          workerHoursMap[workerId].unpaidHours[projectId].overtime20x += whData.overtime20x || 0;
        }

        workerHoursMap[workerId].unpaidHours[projectId].entries.push({
          id: docSnap.id,
          ...whData,
        });
        workerHoursMap[workerId].projects.add(projectId);
      });

      // Convert to array
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
          // old code used wData.rates, but we do not want that if we’re deprecating
          // ot1_5 or ot2_0 fields. So either we keep it or adapt. 
          rates: wData.rates || {},
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
   * Mark hours as paid
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
   * For a single worker: return their “approved && paid=false” hours grouped by project
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
      snapshot.forEach((snap) => {
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
   * Create a payment doc + mark each hour doc as paid
   */
  completePayment: async (hourIds, paymentDetails) => {
    try {
      const batch = writeBatch(db);

      // 1) create payment doc
      const paymentsRef = collection(db, 'payments');
      const payDocRef = doc(paymentsRef); // random docID
      batch.set(payDocRef, {
        ...paymentDetails,
        status: 'completed',
        createdAt: Timestamp.fromDate(new Date()),
        workHourIds: hourIds
      });

      // 2) update each hour doc
      hourIds.forEach((hid) => {
        const hrRef = doc(db, 'workHours', hid);
        batch.update(hrRef, {
          status: 'paid',
          paymentId: payDocRef.id,
          paymentDate: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      });

      await batch.commit();
      return payDocRef.id;
    } catch (error) {
      console.error('Error completing payment:', error);
      throw error;
    }
  },

  /**
   * Return all paid hours, grouped by paymentId
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
      snapshot.forEach((snap) => {
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

  getAllWorkersWithUnpaidData: async () => {
    try {
      // 1) fetch all 'worker' docs
      const usersRef = collection(db, 'users');
      const qWorkers = query(usersRef, where('role', '==', 'worker'));
      const workersSnap = await getDocs(qWorkers);

      const allWorkers = workersSnap.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || 'Unknown Worker',
          position: data.position || 'Unknown Position',
          profilePic: data.profilePic || null,
          // store baseRate in something like data.compensation?.baseRate if you prefer
          baseRate: data?.compensation?.baseRate || 0
        };
      });

      // 2) For each worker, find unpaid hours
      const results = [];
      for (const worker of allWorkers) {
        const whRef = collection(db, 'workHours');
        const qHours = query(
          whRef,
          where('userID', '==', worker.id),
          where('status', '==', 'approved'),
          where('paid', '==', false)
        );
        const hoursSnap = await getDocs(qHours);

        let totalHours = 0;
        let totalAmount = 0;
        const projects = new Set();

        hoursSnap.forEach((snap) => {
          const hData = snap.data();
          const cost = computeHourCost(hData, worker.baseRate);
          totalAmount += cost;

          // sum hours
          const reg = hData.regularHours || 0;
          const ot15 = hData.overtime15x || 0;
          const ot20 = hData.overtime20x || 0;
          totalHours += (reg + ot15 + ot20);

          if (hData.projectID) {
            projects.add(hData.projectID);
          }
        });

        // push to result
        results.push({
          ...worker,
          unpaidHoursCount: totalHours,
          unpaidAmount: totalAmount,
          projects: Array.from(projects),
        });
      }

      return results;
    } catch (err) {
      console.error('Error in getAllWorkersWithUnpaidData:', err);
      throw err;
    }
  },
};