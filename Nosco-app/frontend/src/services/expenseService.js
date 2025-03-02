import { firestore, storage } from '../firebase/firebase_config';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  serverTimestamp,
  getDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const expenseService = {
  submitExpenseClaim: async ({ employeeId, amount, type, receipts, date }) => {
    try {
      const docRef = await addDoc(collection(firestore, 'expense'), {
        employeeId,
        amount,
        type,
        receipts,
        date,
        status: 'Pending',
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  uploadReceipts: async (files) => {
    try {
      const uploadPromises = files.map(async (file) => {
        const storageRef = ref(storage, `receipts/${file.name}_${Date.now()}`);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      });
      return await Promise.all(uploadPromises);
    } catch (error) {
      throw new Error(error.message);
    }
  },

  approveExpenseClaim: async (expenseId) => {
    try {
      const expenseRef = doc(firestore, 'expense', expenseId);
      await updateDoc(expenseRef, {
        status: 'Approved',
        approvedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error(error.message);
    }
  },

  rejectExpenseClaim: async (expenseId, reason) => {
    try {
      const expenseRef = doc(firestore, 'expense', expenseId);
      await updateDoc(expenseRef, {
        status: 'Rejected',
        rejectionReason: reason,
        rejectedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error(error.message);
    }
  },

  fetchExpenses: async (employeeId) => {
    try {
        const q = query(
            collection(firestore, 'expense'), // Change to match your collection name
            where('userID', '==', employeeId), // Make sure this matches your field name
            orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate() || new Date(),
            createdAt: doc.data().createdAt?.toDate() || null,
            approvalDate: doc.data().approvalDate?.toDate() || null
        }));
    } catch (error) {
        throw new Error(error.message);
    }
  },

  fetchPendingExpenses: async () => {
    try {
      const q = query(
        collection(firestore, 'expense'),
        where('status', '==', 'Pending'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(error.message);
    }
  },

  getExpenseById: async (expenseId) => {
    try {
      const expenseRef = doc(firestore, 'expense', expenseId); // Changed from 'expenses' to 'expense'
      const expenseDoc = await getDoc(expenseRef);
      if (!expenseDoc.exists()) {
        throw new Error('Expense not found');
      }
      return { id: expenseDoc.id, ...expenseDoc.data() };
    } catch (error) {
      throw new Error(error.message);
    }
  },

  getExpensesForWorker: async (workerId) => {
    try {
      const q = query(
        collection(firestore, 'expense'),
        where('userID', '==', workerId),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(doc.data().date)
      }));
    } catch (error) {
      throw new Error(error.message);
    }
  },
};