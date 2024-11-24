// adminExpenseService.js
import { firestore as db } from '../firebase/firebase_config';
import { 
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  Timestamp,
  orderBy,
  writeBatch
} from 'firebase/firestore';

export const adminExpenseService = {
  // Get all expense types
  getExpenseTypes: async () => {
    try {
      const q = query(
        collection(db, 'expenseTypes'),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching expense types:', error);
      throw error;
    }
  },

  // Create new expense type
  createExpenseType: async (expenseTypeData) => {
    try {
      const docRef = await addDoc(collection(db, 'expenseTypes'), {
        ...expenseTypeData,
        isArchived: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating expense type:', error);
      throw error;
    }
  },

  // Update expense type
  updateExpenseType: async (typeId, expenseTypeData) => {
    try {
      const typeRef = doc(db, 'expenseTypes', typeId);
      await updateDoc(typeRef, {
        ...expenseTypeData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating expense type:', error);
      throw error;
    }
  },

  // Update expense type archive status
  updateExpenseTypeStatus: async (typeId, isArchived) => {
    try {
      const typeRef = doc(db, 'expenseTypes', typeId);
      await updateDoc(typeRef, {
        isArchived,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating expense type status:', error);
      throw error;
    }
  },

  // Get expenses with filters
  getExpenses: async (filters = {}) => {
    try {
      let constraints = [];

      if (filters.status && filters.status !== 'all') {
        constraints.push(where('status', '==', filters.status));
      }

      if (filters.expenseType) {
        constraints.push(where('expenseType', '==', filters.expenseType));
      }
 
      if (filters.worker) {
        constraints.push(where('userID', '==', filters.worker));
      }
 
      if (filters.dateRange?.start) {
        constraints.push(
          where('date', '>=', Timestamp.fromDate(new Date(filters.dateRange.start)))
        );
      }
 
      if (filters.dateRange?.end) {
        constraints.push(
          where('date', '<=', Timestamp.fromDate(new Date(filters.dateRange.end)))
        );
      }
 
      // Filter out general expenses from regular expense list
      constraints.push(where('isGeneralExpense', '==', false));
 
      const q = query(
        collection(db, 'expense'),
        ...constraints,
        orderBy('date', 'desc')
      );
 
      const snapshot = await getDocs(q);
      const expenses = [];
 
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        
        // Get worker details
        const userDoc = await getDoc(doc(db, 'users', data.userID));
        
        // Get project details if projectID exists
        let projectData = null;
        if (data.projectID) {
          const projectDoc = await getDoc(doc(db, 'projects', data.projectID));
          if (projectDoc.exists()) {
            projectData = projectDoc.data();
          }
        }
 
        expenses.push({
          id: docSnapshot.id,
          ...data,
          worker: userDoc.exists() ? userDoc.data() : null,
          project: projectData
        });
      }
 
      return expenses;
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  },
 
  // Get general expenses
  getGeneralExpenses: async () => {
    try {
      const q = query(
        collection(db, 'expense'),
        where('isGeneralExpense', '==', true),
        orderBy('date', 'desc')
      );
 
      const snapshot = await getDocs(q);
      const expenses = [];
 
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        
        // Get project details if projectID exists
        let projectData = null;
        if (data.projectID) {
          const projectDoc = await getDoc(doc(db, 'projects', data.projectID));
          if (projectDoc.exists()) {
            projectData = projectDoc.data();
          }
        }
 
        expenses.push({
          id: docSnapshot.id,
          ...data,
          project: projectData
        });
      }
 
      return expenses;
    } catch (error) {
      console.error('Error fetching general expenses:', error);
      throw error;
    }
  },
 
  // Create general expense
  createGeneralExpense: async (expenseData) => {
    try {
      const docRef = await addDoc(collection(db, 'expense'), {
        ...expenseData,
        isGeneralExpense: true,
        status: 'approved',
        approvedBy: expenseData.userID,
        approvalDate: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        date: Timestamp.fromDate(new Date(expenseData.date))
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating general expense:', error);
      throw error;
    }
  },
 
  // Approve expense
  approveExpense: async (expenseId, adminId) => {
    try {
      const expenseRef = doc(db, 'expense', expenseId);
      const expenseDoc = await getDoc(expenseRef);
      const expenseData = expenseDoc.data();
 
      // Calculate points if needed (not for general expenses)
      let pointsAwarded = null;
      if (!expenseData.isGeneralExpense) {
        // Example points calculation: 1 point per $50 spent
        pointsAwarded = Math.floor((expenseData.amount / 50) * 2) / 2; // Round to nearest 0.5
      }
 
      await updateDoc(expenseRef, {
        status: 'approved',
        approvedBy: adminId,
        approvalDate: Timestamp.now(),
        updatedAt: Timestamp.now(),
        pointsAwarded
      });
    } catch (error) {
      console.error('Error approving expense:', error);
      throw error;
    }
  },
 
  // Reject expense
  rejectExpense: async (expenseId, adminId, rejectionReason) => {
    try {
      const expenseRef = doc(db, 'expense', expenseId);
      await updateDoc(expenseRef, {
        status: 'rejected',
        approvedBy: adminId,
        approvalDate: Timestamp.now(),
        rejectionReason,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error rejecting expense:', error);
      throw error;
    }
  },
 
  // Bulk approve expenses
  bulkApproveExpenses: async (expenseIds, adminId) => {
    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();

      for (const id of expenseIds) {
        const expenseRef = doc(db, 'expense', id);
        const expenseDoc = await getDoc(expenseRef);
        
        if (expenseDoc.exists()) {
          const expenseData = expenseDoc.data();
          let pointsAwarded = null;
          
          if (!expenseData.isGeneralExpense) {
            pointsAwarded = Math.floor((expenseData.amount / 50) * 2) / 2;
          }

          batch.update(expenseRef, {
            status: 'approved',
            approvedBy: adminId,
            approvalDate: now,
            updatedAt: now,
            pointsAwarded
          });
        }
      }

      await batch.commit();
    } catch (error) {
      console.error('Error bulk approving expenses:', error);
      throw error;
    }
  },

  // Add bulkRejectExpenses method
  bulkRejectExpenses: async (expenseIds, adminId, rejectionReason) => {
    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();

      for (const id of expenseIds) {
        const expenseRef = doc(db, 'expense', id);
        batch.update(expenseRef, {
          status: 'rejected',
          approvedBy: adminId,
          approvalDate: now,
          updatedAt: now,
          rejectionReason
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error bulk rejecting expenses:', error);
      throw error;
    }
  },

 
  // Get workers
  getWorkers: async () => {
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching workers:', error);
      throw error;
    }
  },
 
  // Get projects
  getProjects: async () => {
    try {
      const q = query(collection(db, 'projects'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }
 };
 
 export default adminExpenseService;