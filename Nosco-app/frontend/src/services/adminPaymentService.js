// adminPaymentService.js
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
  Timestamp 
} from 'firebase/firestore';

export const adminPaymentService = {
  subscribeToAllPayments: (filters = {}, callback) => {
    try {
      const paymentsRef = collection(firestore, 'payments');
      
      let constraints = [orderBy('date', 'desc')];

      if (filters.status && filters.status !== 'all') {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters.paymentType && filters.paymentType !== 'all') {
        constraints.push(where('paymentType', '==', filters.paymentType));
      }

      const q = query(paymentsRef, ...constraints);

      return onSnapshot(q, 
        (snapshot) => {
          const payments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate?.() || new Date(doc.data().date),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt),
            comments: doc.data().comments ? {
              ...doc.data().comments,
              createdAt: doc.data().comments.createdAt?.toDate?.() || new Date(doc.data().comments.createdAt)
            } : null
          }));
          callback(payments);
        },
        (error) => {
          console.error('Error fetching payments:', error);
          callback([]);
        }
      );
    } catch (error) {
      console.error('Error in subscribeToAllPayments:', error);
      callback([]);
      return () => {};
    }
  },

  processPayment: async (paymentId, processingDetails) => {
    try {
      const paymentRef = doc(firestore, 'payments', paymentId);
      
      await updateDoc(paymentRef, {
        status: 'processing',
        paymentMethod: processingDetails.paymentMethod,
        updatedAt: Timestamp.fromDate(new Date()),
        comments: {
          text: `Payment processed via ${processingDetails.paymentMethod}`,
          userID: processingDetails.adminId,
          createdAt: Timestamp.fromDate(new Date())
        }
      });

      return true;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  },

  completePayment: async (paymentId, completionDetails) => {
    try {
      const paymentRef = doc(firestore, 'payments', paymentId);
      
      await updateDoc(paymentRef, {
        status: 'completed',
        referenceNumber: completionDetails.referenceNumber,
        updatedAt: Timestamp.fromDate(new Date()),
        comments: {
          text: `Payment completed. Reference: ${completionDetails.referenceNumber}`,
          userID: completionDetails.adminId,
          createdAt: Timestamp.fromDate(new Date())
        }
      });

      return true;
    } catch (error) {
      console.error('Error completing payment:', error);
      throw error;
    }
  },

  addAdminComment: async (paymentId, comment) => {
    try {
      const paymentRef = doc(firestore, 'payments', paymentId);
      await updateDoc(paymentRef, {
        comments: {
          text: comment.text,
          userID: comment.adminId,
          createdAt: Timestamp.fromDate(new Date())
        },
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error adding admin comment:', error);
      throw error;
    }
  },

  getPaymentsByUser: async (userId) => {
    try {
      const paymentsRef = collection(firestore, 'payments');
      const q = query(
        paymentsRef,
        where('userID', '==', userId),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.() || new Date(doc.data().date),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
      }));
    } catch (error) {
      console.error('Error fetching user payments:', error);
      throw error;
    }
  }
};
