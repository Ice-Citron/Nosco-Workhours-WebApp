import { firestore } from '../firebase/firebase_config';

export const paymentService = {
  fetchUserPayments: async (userID, filters = {}) => {
    try {
      let query = firestore.collection('payments')
        .where('userID', '==', userID)
        .orderBy('date', 'desc');

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.where('status', '==', filters.status);
      }
      if (filters.paymentType && filters.paymentType !== 'all') {
        query = query.where('paymentType', '==', filters.paymentType);
      }
      if (filters.startDate) {
        query = query.where('date', '>=', filters.startDate);
      }
      if (filters.endDate) {
        query = query.where('date', '<=', filters.endDate);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(error.message);
    }
  },

  addPaymentComment: async (paymentID, comment) => {
    try {
      const paymentRef = firestore.collection('payments').doc(paymentID);
      await paymentRef.update({
        comments: firestore.FieldValue.arrayUnion(comment)
      });
    } catch (error) {
      throw new Error(error.message);
    }
  },

  getPaymentDetails: async (paymentID) => {
    try {
      const doc = await firestore.collection('payments').doc(paymentID).get();
      if (!doc.exists) {
        throw new Error('Payment not found');
      }
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
};