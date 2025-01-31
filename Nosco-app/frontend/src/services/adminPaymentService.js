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

      const { newStatus, paymentMethod, referenceNumber, comment, adminId } = updateDetails;
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
      });

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
      const paymentsRef = collection(firestore, 'payments');

      const payment = {
        ...paymentData,
        date: Timestamp.fromDate(new Date(paymentData.date)),
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        status: 'pending',
        processingHistory: [
          {
            status: 'created',
            comment: paymentData.comments.text,
            adminId: paymentData.createdBy,
            timestamp: Timestamp.fromDate(new Date()),
          },
        ],
      };

      const docRef = await addDoc(paymentsRef, payment);
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
};
