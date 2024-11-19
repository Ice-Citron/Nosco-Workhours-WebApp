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
  arrayUnion, 
  Timestamp 
} from 'firebase/firestore';

export const paymentService = {
  subscribeToUserPayments: (userID, filters = {}, callback) => {
    try {
      const paymentsRef = collection(firestore, 'payments');
      
      let constraints = [
        where('userID', '==', userID),
        orderBy('date', 'desc')
      ];

      if (filters.status && filters.status !== 'all') {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters.paymentType && filters.paymentType !== 'all') {
        constraints.push(where('paymentType', '==', filters.paymentType));
      }

      const q = query(paymentsRef, ...constraints);

      console.log("Query constraints:", constraints); // Debug log

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const payments = snapshot.docs.map(doc => {
            const data = doc.data();
            // Safely handle data conversion
            return {
              id: doc.id,
              ...data,
              date: data.date?.toDate?.() || new Date(data.date),
              createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
              updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
              comments: Array.isArray(data.comments) ? data.comments.map(comment => ({
                ...comment,
                createdAt: comment.createdAt?.toDate?.() || new Date(comment.createdAt)
              })) : []
            };
          });
          console.log("Fetched payments:", payments); // Debug log
          callback(payments);
        },
        (error) => {
          console.error('Detailed error fetching payments:', error);
          callback([]);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error in subscribeToUserPayments:', error);
      callback([]);
      return () => {};
    }
  },

  getPaymentDetails: async (paymentID) => {
    try {
      const paymentRef = doc(firestore, 'payments', paymentID);
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
        comments: Array.isArray(data.comments) ? data.comments.map(comment => ({
          ...comment,
          createdAt: comment.createdAt?.toDate?.() || new Date(comment.createdAt)
        })) : []
      };
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw error;
    }
  },

  addPaymentComment: async (paymentID, comment) => {
    try {
      const paymentRef = doc(firestore, 'payments', paymentID);
      await updateDoc(paymentRef, {
        comments: arrayUnion({
          ...comment,
          createdAt: Timestamp.fromDate(new Date())
        }),
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  formatPaymentForFirebase: (payment) => {
    return {
      ...payment,
      date: payment.date instanceof Date ? 
        Timestamp.fromDate(payment.date) : 
        Timestamp.fromDate(new Date(payment.date)),
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      comments: Array.isArray(payment.comments) ? payment.comments.map(comment => ({
        ...comment,
        createdAt: comment.createdAt instanceof Date ?
          Timestamp.fromDate(comment.createdAt) :
          Timestamp.fromDate(new Date(comment.createdAt))
      })) : []
    };
  }
};