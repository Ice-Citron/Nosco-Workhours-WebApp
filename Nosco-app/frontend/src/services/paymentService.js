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
            // Safely handle data conversion, preserving the comments map structure
            return {
              id: doc.id,
              ...data,
              date: data.date?.toDate?.() || new Date(data.date),
              createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
              updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
              // Preserve the comments as a map if it exists
              comments: data.comments && typeof data.comments === 'object' && !Array.isArray(data.comments) 
                ? {
                    ...data.comments,
                    createdAt: data.comments.createdAt?.toDate?.() 
                      ? data.comments.createdAt.toDate() 
                      : new Date(data.comments.createdAt)
                  }
                : null
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
        // Preserve the comments as a map
        comments: data.comments && typeof data.comments === 'object' && !Array.isArray(data.comments)
          ? {
              ...data.comments,
              createdAt: data.comments.createdAt?.toDate?.() 
                ? data.comments.createdAt.toDate() 
                : new Date(data.comments.createdAt)
            }
          : null
      };
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw error;
    }
  },

  addPaymentComment: async (paymentID, comment) => {
    try {
      const paymentRef = doc(firestore, 'payments', paymentID);
      // Update the comments field directly as a map
      await updateDoc(paymentRef, {
        comments: {
          text: comment.text,
          userID: comment.userID,
          createdAt: Timestamp.fromDate(new Date())
        },
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
      // Format comments as a map
      comments: payment.comments ? {
        ...payment.comments,
        createdAt: payment.comments.createdAt instanceof Date
          ? Timestamp.fromDate(payment.comments.createdAt)
          : Timestamp.fromDate(new Date(payment.comments.createdAt))
      } : null
    };
  }
};