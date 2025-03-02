// src/services/adminPaymentService.js

import { firestore } from '../firebase/firebase_config';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  getDocs,
  arrayUnion,
  addDoc
} from 'firebase/firestore';
import { workerNotificationService } from '../services/workerNotificationService';


/**
 * Helper: Compute the cost for a work-hour entry using the worker’s base rate.
 * - regularHours are billed at baseRate
 * - overtime15x is billed at 1.5 * baseRate
 * - overtime20x is billed at 2.0 * baseRate
 */
function computeHourCost(hourData, baseRate = 0) {
  const reg = hourData.regularHours || 0;
  const ot15 = hourData.overtime15x || 0;
  const ot20 = hourData.overtime20x || 0;
  return reg * baseRate + ot15 * (baseRate * 1.5) + ot20 * (baseRate * 2.0);
}

export const adminPaymentService = {
  /**
   * subscribeToAllPayments:
   * A real-time listener for all payments, filtered by optional status/paymentType,
   * then ordered by `date desc`.
   */
  subscribeToAllPayments: (filters = {}, callback) => {
    try {
      const paymentsRef = collection(firestore, 'payments');
      let queryConstraints = [];

      if (filters.status && filters.status !== 'all') {
        queryConstraints.push(where('status', '==', filters.status));
      }

      if (filters.paymentType && filters.paymentType !== 'all') {
        queryConstraints.push(where('paymentType', '==', filters.paymentType));
      }

      queryConstraints.push(orderBy('date', 'desc'));

      const q = query(paymentsRef, ...queryConstraints);

      return onSnapshot(
        q,
        (snapshot) => {
          const payments = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate?.() || new Date(doc.data().date),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt),
            comments: doc.data().comments
              ? {
                  ...doc.data().comments,
                  createdAt:
                    doc.data().comments.createdAt?.toDate?.() ||
                    new Date(doc.data().comments.createdAt),
                }
              : null,
            processingHistory: (doc.data().processingHistory || []).map((entry) => ({
              ...entry,
              timestamp: entry.timestamp?.toDate?.() || new Date(entry.timestamp),
            })),
          }));
          callback(payments);
        },
        (error) => {
          console.error('Detailed error fetching payments:', error);
          callback([]);
        }
      );
    } catch (error) {
      console.error('Error in subscribeToAllPayments:', error);
      callback([]);
      return () => {};
    }
  },

  /**
   * getPaymentDetails: fetch a single payment doc by ID
   */
  getPaymentDetails: async (paymentId) => {
    try {
      const paymentRef = doc(firestore, 'payments', paymentId);
      const paymentDoc = await getDoc(paymentRef);

      if (!paymentDoc.exists()) {
        throw new Error('Payment not found');
      }

      const data = paymentDoc.data();
      return {
        id: paymentDoc.id,
        ...data,
        date: data.date?.toDate?.() || new Date(data.date),
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        comments: data.comments
          ? {
              ...data.comments,
              createdAt: data.comments.createdAt?.toDate?.() || new Date(data.comments.createdAt),
            }
          : null,
        processingHistory: (data.processingHistory || []).map((entry) => ({
          ...entry,
          timestamp: entry.timestamp?.toDate?.() || new Date(entry.timestamp),
        })),
      };
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw error;
    }
  },

  /**
   * updatePaymentStatus: set a payment's status, referenceNumber, etc.
   */
  updatePaymentStatus: async (paymentId, updateDetails) => {
    try {
      const paymentRef = doc(firestore, 'payments', paymentId);
      const paymentDoc = await getDoc(paymentRef);
  
      if (!paymentDoc.exists()) {
        throw new Error('Payment not found');
      }
  
      const paymentData = paymentDoc.data();
      const { newStatus, paymentMethod, referenceNumber, comment, adminId, selectedBankAccount } = updateDetails;
      const historyEntry = {
        status: newStatus,
        paymentMethod,
        referenceNumber,
        comment,
        adminId,
        timestamp: Timestamp.fromDate(new Date()),
      };
  
      await updateDoc(paymentRef, {
        status: newStatus,
        paymentMethod,
        referenceNumber,
        updatedAt: Timestamp.fromDate(new Date()),
        comments: {
          text: comment,
          userID: adminId,
          createdAt: Timestamp.fromDate(new Date()),
        },
        processingHistory: arrayUnion(historyEntry),
        selectedBankAccount: selectedBankAccount || paymentData.selectedBankAccount
      });
  
      // Send notifications to worker based on payment status change
      if (paymentData.userID) {
        const userId = paymentData.userID;
        const amount = paymentData.amount || 0;
        const currency = paymentData.currency || 'USD';
        const formattedAmount = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency
        }).format(amount);
  
        // Different notifications based on new status
        if (newStatus === 'processing' && paymentData.status !== 'processing') {
          // Payment has started processing
          await workerNotificationService.createNotification({
            type: 'payment_processing',
            title: 'Payment Processing',
            message: `Your payment of ${formattedAmount} is now being processed. Reference: ${referenceNumber}.`,
            entityID: paymentId,
            entityType: 'payment',
            userID: userId,
            link: '/worker/payments'
          });
        } 
        else if (newStatus === 'completed') {
          // Payment has been completed
          await workerNotificationService.createNotification({
            type: 'payment_completed',
            title: 'Payment Completed',
            message: `Your payment of ${formattedAmount} has been completed. Reference: ${referenceNumber}.`,
            entityID: paymentId,
            entityType: 'payment',
            userID: userId,
            link: '/worker/payments'
          });
        }
        else if (newStatus === 'failed') {
          // Payment failed
          await workerNotificationService.createNotification({
            type: 'payment_failed',
            title: 'Payment Failed',
            message: `Your payment of ${formattedAmount} could not be processed. Our admin team has been notified.`,
            entityID: paymentId,
            entityType: 'payment',
            userID: userId,
            link: '/worker/payments'
          });
        }
      }
  
      return true;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  /**
   * addAdminComment: create a comment inside processingHistory
   */
  addAdminComment: async (paymentId, comment) => {
    try {
      const paymentRef = doc(firestore, 'payments', paymentId);

      const historyEntry = {
        status: 'comment',
        comment: comment.text,
        adminId: comment.adminId,
        timestamp: Timestamp.fromDate(new Date()),
      };

      await updateDoc(paymentRef, {
        comments: {
          text: comment.text,
          userID: comment.adminId,
          createdAt: Timestamp.fromDate(new Date()),
        },
        updatedAt: Timestamp.fromDate(new Date()),
        processingHistory: arrayUnion(historyEntry),
      });
    } catch (error) {
      console.error('Error adding admin comment:', error);
      throw error;
    }
  },

  /**
   * createPayment: add a new doc to the `payments` collection
   */
  createPayment: async (paymentData) => {
    try {
      const now = new Date();
      const paymentsRef = collection(firestore, 'payments');
  
      // If paymentData.status is provided, use it; otherwise default to "processing".
      const statusToUse = paymentData.status || 'processing';
  
      const payment = {
        ...paymentData,
        date: Timestamp.fromDate(new Date(paymentData.date)),
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        status: statusToUse,
        processingHistory: [
          {
            status: 'created',
            comment: paymentData.comments?.text || '',
            adminId: paymentData.createdBy,
            timestamp: Timestamp.fromDate(now),
          },
        ],
      };
  
      const docRef = await addDoc(paymentsRef, payment);
      
      // Notify worker if the payment is immediately set to processing
      if (statusToUse === 'processing' && paymentData.userID) {
        await workerNotificationService.createNotification({
          type: 'payment_processing',
          title: 'Payment Processing',
          message: `Your payment of ${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: paymentData.currency || 'USD'
          }).format(paymentData.amount || 0)} is now being processed.`,
          entityID: docRef.id,
          entityType: 'payment',
          userID: paymentData.userID,
          link: '/worker/payments'
        });
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  addStandaloneComment: async (paymentId, comment) => {
    try {
      const paymentRef = doc(firestore, 'payments', paymentId);

      const historyEntry = {
        status: 'comment',
        comment: comment.text,
        adminId: comment.adminId,
        timestamp: Timestamp.fromDate(new Date()),
      };

      await updateDoc(paymentRef, {
        comments: {
          text: comment.text,
          userID: comment.adminId,
          createdAt: Timestamp.fromDate(new Date()),
        },
        updatedAt: Timestamp.fromDate(new Date()),
        processingHistory: arrayUnion(historyEntry),
      });
    } catch (error) {
      console.error('Error adding standalone comment:', error);
      throw error;
    }
  },

  /**
   * getPaymentsForWorker: fetch docs where `userID` == workerId, orderBy date desc
   */
  getPaymentsForWorker: async (workerId) => {
    try {
      const paymentsRef = collection(firestore, 'payments');
      // We assume your doc uses `userID` to store the worker's ID:
      const q = query(
        paymentsRef,
        where('userID', '==', workerId),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      const results = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        results.push({
          id: docSnap.id,
          ...data,
          // parse timestamps
          date: data.date?.toDate?.() || new Date(data.date),
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
          processingHistory: (data.processingHistory || []).map((entry) => ({
            ...entry,
            timestamp: entry.timestamp?.toDate?.() || new Date(entry.timestamp),
          })),
        });
      });

      return results;
    } catch (error) {
      console.error('Error fetching payments for worker:', error);
      throw error;
    }
  },

  /**
   * Fetch all payments with status in ["completed", "failed"] ordered by updatedAt desc.
   */
  getPaymentsHistory: async () => {
    try {
      const paymentsRef = collection(firestore, 'payments');
      const q = query(
        paymentsRef,
        where('status', 'in', ['completed', 'failed']),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const payments = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps if needed:
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
          comments: data.comments ? {
            ...data.comments,
            createdAt: data.comments.createdAt?.toDate ? data.comments.createdAt.toDate() : new Date(data.comments.createdAt)
          } : null,
          processingHistory: (data.processingHistory || []).map(entry => ({
            ...entry,
            timestamp: entry.timestamp?.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp),
          }))
        };
      });
      return payments;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  },

  /**
   * getAllWorkersUnpaidData:
   * For each worker (from the "users" collection where role === "worker"),
   * this method aggregates:
   *   a) Unpaid, approved work hours (and computes their cost using the worker's baseRate),
   *   b) Unpaid, approved expense reimbursements (using the expense "amount" field).
   * The result for each worker includes:
   *   - unpaidHoursCount: total number of hours (sum of regular + overtime),
   *   - unpaidAmount: total cost from work hours plus expense amounts,
   *   - projects: an array of project IDs associated with these unpaid items.
   */
  getAllWorkersUnpaidData: async () => {
    try {
      // 1. Query all workers (users with role "worker")
      const usersRef = collection(firestore, 'users');
      const qWorkers = query(usersRef, where('role', '==', 'worker'));
      const workersSnap = await getDocs(qWorkers);

      const workers = workersSnap.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || 'Unknown Worker',
          baseRate: data?.compensation?.baseRate || 0
          // Add other fields if needed
        };
      });

      const results = [];

      // 2. For each worker, aggregate unpaid work hours and expense reimbursements
      for (const worker of workers) {
        let totalHoursCount = 0;
        let totalWorkCost = 0;
        let totalExpenseAmount = 0;
        const projects = new Set();

        // Query workHours for unpaid, approved entries for this worker
        const whRef = collection(firestore, 'workHours');
        const qHours = query(
          whRef,
          where('userID', '==', worker.id),
          where('status', '==', 'approved'),
          where('paid', '==', false)
        );
        const hoursSnap = await getDocs(qHours);
        hoursSnap.forEach(docSnap => {
          const hData = docSnap.data();
          totalWorkCost += computeHourCost(hData, worker.baseRate);
          const reg = hData.regularHours || 0;
          const ot15 = hData.overtime15x || 0;
          const ot20 = hData.overtime20x || 0;
          totalHoursCount += reg + ot15 + ot20;
          if (hData.projectID) {
            projects.add(hData.projectID);
          }
        });

        // Query expense collection for unpaid, approved expense reimbursements
        const expenseRef = collection(firestore, 'expense'); // Adjust if your collection name differs
        const qExpenses = query(
          expenseRef,
          where('userID', '==', worker.id),
          where('status', '==', 'approved'),
          where('paid', '==', false)
        );
        const expenseSnap = await getDocs(qExpenses);
        expenseSnap.forEach(docSnap => {
          const expData = docSnap.data();
          totalExpenseAmount += Number(expData.amount || 0);
          if (expData.projectID) {
            projects.add(expData.projectID);
          }
        });

        // The worker's total unpaid amount is the sum from work hours and expenses
        const unpaidAmount = totalWorkCost + totalExpenseAmount;

        results.push({
          ...worker,
          unpaidHoursCount: totalHoursCount,
          unpaidAmount,
          projects: Array.from(projects)
          // Optionally, include separate totals for work and expense amounts if needed.
        });
      }

      return results;
    } catch (err) {
      console.error('Error in getAllWorkersUnpaidData:', err);
      throw err;
    }
  },
};
