// src/services/expenseService.js
import { firestore, storage } from '../firebase/firebase_config';

export const expenseService = {
  submitExpenseClaim: async ({ employeeId, amount, type, receipts, date }) => {
    try {
      // Add expense claim to Firestore
      const expenseRef = await firestore.collection('expenses').add({
        employeeId,
        amount,
        type,
        receipts, // Array of URLs
        date,
        status: 'Pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      return expenseRef.id;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  uploadReceipts: async (files) => {
    try {
      const uploadPromises = files.map((file) => {
        const storageRef = storage.ref(`receipts/${file.name}_${Date.now()}`);
        return storageRef.put(file).then(() => storageRef.getDownloadURL());
      });
      const receiptUrls = await Promise.all(uploadPromises);
      return receiptUrls;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  approveExpenseClaim: async (expenseId) => {
    try {
      await firestore.collection('expenses').doc(expenseId).update({
        status: 'Approved',
        approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      throw new Error(error.message);
    }
  },

  rejectExpenseClaim: async (expenseId, reason) => {
    try {
      await firestore.collection('expenses').doc(expenseId).update({
        status: 'Rejected',
        rejectionReason: reason,
        rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      throw new Error(error.message);
    }
  },

  fetchExpenses: async (employeeId) => {
    try {
      const snapshot = await firestore
        .collection('expenses')
        .where('employeeId', '==', employeeId)
        .orderBy('date', 'desc')
        .get();
      const expenses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return expenses;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  fetchPendingExpenses: async () => {
    try {
      const snapshot = await firestore
        .collection('expenses')
        .where('status', '==', 'Pending')
        .orderBy('createdAt', 'desc')
        .get();
      const expenses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return expenses;
    } catch (error) {
      throw new Error(error.message);
    }
  },
};
