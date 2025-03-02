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
import currencyService from './currencyService';
import { workerNotificationService } from '../services/workerNotificationService';


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
 
  // Approve expense - add notifications
  approveExpense: async (expenseId, adminId) => {
    try {
      const expenseRef = doc(db, 'expense', expenseId);
      const expenseDoc = await getDoc(expenseRef);
      
      if (!expenseDoc.exists()) {
        throw new Error('Expense not found');
      }
      
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
      
      // Add notification for worker (if not a general expense)
      if (!expenseData.isGeneralExpense && expenseData.userID) {
        await workerNotificationService.notifyExpenseApproval(
          expenseId, 
          expenseData.amount,
          expenseData.currency || 'USD',
          expenseData.userID
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error approving expense:', error);
      throw error;
    }
  },

  // Bulk approve expenses - add notifications
  bulkApproveExpenses: async (expenseIds, adminId) => {
    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();
      
      // Store notification promises to be executed after batch update
      const notificationPromises = [];

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
          
          // Queue notification to be sent after batch commit
          if (!expenseData.isGeneralExpense && expenseData.userID) {
            notificationPromises.push(
              workerNotificationService.notifyExpenseApproval(
                id,
                expenseData.amount,
                expenseData.currency || 'USD',
                expenseData.userID
              )
            );
          }
        }
      }

      await batch.commit();
      
      // Execute all notifications after the batch has been committed
      await Promise.all(notificationPromises);
      
      return true;
    } catch (error) {
      console.error('Error bulk approving expenses:', error);
      throw error;
    }
  },

  // Reject expense - add notifications
  rejectExpense: async (expenseId, adminId, rejectionReason) => {
    try {
      const expenseRef = doc(db, 'expense', expenseId);
      const expenseDoc = await getDoc(expenseRef);
      
      if (!expenseDoc.exists()) {
        throw new Error('Expense not found');
      }
      
      const expenseData = expenseDoc.data();
      
      await updateDoc(expenseRef, {
        status: 'rejected',
        rejectionReason,
        rejectedBy: adminId,
        rejectedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        updatedBy: adminId,
        // Clear approval data
        approvedBy: null,
        approvalDate: null
      });
      
      // Add notification for worker (if not a general expense)
      if (!expenseData.isGeneralExpense && expenseData.userID) {
        await workerNotificationService.notifyExpenseRejection(
          expenseId,
          rejectionReason,
          expenseData.userID
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error rejecting expense:', error);
      throw error;
    }
  },

  // Bulk reject expenses - add notifications
  bulkRejectExpenses: async (expenseIds, adminId, rejectionReason) => {
    try {
      const batch = writeBatch(db);
      const now = Timestamp.now();
      
      // Store notification promises to be executed after batch update
      const notificationPromises = [];

      for (const id of expenseIds) {
        const expenseRef = doc(db, 'expense', id);
        const expenseDoc = await getDoc(expenseRef);
        
        if (expenseDoc.exists()) {
          const expenseData = expenseDoc.data();
          
          batch.update(expenseRef, {
            status: 'rejected',
            rejectionReason,
            rejectedBy: adminId,
            rejectedAt: now,
            updatedAt: now,
            updatedBy: adminId,
            // Clear approval data
            approvedBy: null,
            approvalDate: null
          });
          
          // Queue notification to be sent after batch commit
          if (!expenseData.isGeneralExpense && expenseData.userID) {
            notificationPromises.push(
              workerNotificationService.notifyExpenseRejection(
                id,
                rejectionReason,
                expenseData.userID
              )
            );
          }
        }
      }

      await batch.commit();
      
      // Execute all notifications after the batch has been committed
      await Promise.all(notificationPromises);
      
      return true;
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
  },

  getAllExpenses: async (filters = {}) => {
    try {
      let constraints = [];
  
      // Add status filter
      if (filters.status && filters.status !== 'all') {
        constraints.push(where('status', '==', filters.status));
      }
  
      // Add other filters
      if (filters.expenseType) {
        constraints.push(where('expenseType', '==', filters.expenseType));
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
  
      // Query expenses
      const q = query(
        collection(db, 'expense'),
        ...constraints,
        orderBy('date', 'desc')
      );
  
      const snapshot = await getDocs(q);
      const expenses = [];
  
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        
        // Get worker details for worker expenses
        let workerData = null;
        if (data.userID && !data.isGeneralExpense) {
          const userDoc = await getDoc(doc(db, 'users', data.userID));
          if (userDoc.exists()) {
            workerData = userDoc.data();
          }
        }
        
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
          worker: workerData,
          project: projectData
        });
      }
  
      return expenses;
    } catch (error) {
      console.error('Error fetching all expenses:', error);
      throw error;
    }
  },

  // Update to handle both general and worker expense creation
  createExpense: async (expenseData, adminId) => {
    try {
      const docRef = await addDoc(collection(db, 'expense'), {
        ...expenseData,
        isGeneralExpense: expenseData.isGeneralExpense || false,
        status: 'approved',
        approvedBy: adminId,
        approvalDate: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        date: Timestamp.fromDate(new Date(expenseData.date)),
        userID: expenseData.isGeneralExpense ? adminId : expenseData.userID,
        amount: parseFloat(expenseData.amount),
        pointsAwarded: !expenseData.isGeneralExpense ? Math.floor((parseFloat(expenseData.amount) / 50) * 2) / 2 : null,
        currency: expenseData.currency || 'USD',
        receipts: expenseData.receipts || [], // Add this line
        paid: false,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  },

  // Update your existing updateExpense method
  updateExpense: async (expenseId, expenseData, adminId) => {
    try {
      const expenseRef = doc(db, 'expense', expenseId);
      const currentExpense = await getDoc(expenseRef);

      if (!currentExpense.exists()) {
        throw new Error('Expense not found');
      }

      const updateData = {
        ...expenseData,
        updatedAt: Timestamp.now(),
        updatedBy: adminId
      };

      if (expenseData.date) {
        updateData.date = Timestamp.fromDate(new Date(expenseData.date));
      }

      if (expenseData.amount) {
        updateData.amount = parseFloat(expenseData.amount);
      }

      if (!expenseData.isGeneralExpense && expenseData.amount) {
        updateData.pointsAwarded = Math.floor((parseFloat(expenseData.amount) / 50) * 2) / 2;
      }

      // Handle receipts update if provided
      if (expenseData.receipts) {
        updateData.receipts = expenseData.receipts;
      }

      await updateDoc(expenseRef, updateData);
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  },

  // Restore a rejected expense to approved
  restoreExpense: async (expenseId, adminId) => {
    try {
      const expenseRef = doc(db, 'expense', expenseId);
      await updateDoc(expenseRef, {
        status: 'approved',
        rejectionReason: null,
        rejectedBy: null,
        rejectedAt: null,
        approvedBy: adminId,
        approvalDate: Timestamp.now(),
        updatedAt: Timestamp.now(),
        updatedBy: adminId
      });
    } catch (error) {
      console.error('Error restoring expense:', error);
      throw error;
    }
  },

  // Get a single expense by ID with all related data
  getExpenseById: async (expenseId) => {
    try {
      const expenseRef = doc(db, 'expense', expenseId);
      const expenseDoc = await getDoc(expenseRef);

      if (!expenseDoc.exists()) {
        throw new Error('Expense not found');
      }

      const expenseData = expenseDoc.data();

      // Get worker details if it's a worker expense
      let workerData = null;
      if (expenseData.userID && !expenseData.isGeneralExpense) {
        const userDoc = await getDoc(doc(db, 'users', expenseData.userID));
        if (userDoc.exists()) {
          workerData = userDoc.data();
        }
      }

      // Get project details if exists
      let projectData = null;
      if (expenseData.projectID) {
        const projectDoc = await getDoc(doc(db, 'projects', expenseData.projectID));
        if (projectDoc.exists()) {
          projectData = projectDoc.data();
        }
      }

      return {
        id: expenseDoc.id,
        ...expenseData,
        worker: workerData,
        project: projectData
      };
    } catch (error) {
      console.error('Error fetching expense:', error);
      throw error;
    }
  },

  updateExpenseReceipts: async (expenseId, receiptUrls) => {
    try {
      const expenseRef = doc(db, 'expense', expenseId);
      await updateDoc(expenseRef, {
        receipts: receiptUrls,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating expense receipts:', error);
      throw error;
    }
  },
  
  // Delete receipt from expense
  deleteExpenseReceipt: async (expenseId, receiptUrl) => {
    try {
      const expenseRef = doc(db, 'expense', expenseId);
      const expenseDoc = await getDoc(expenseRef);
      
      if (!expenseDoc.exists()) {
        throw new Error('Expense not found');
      }
  
      const currentReceipts = expenseDoc.data().receipts || [];
      const updatedReceipts = currentReceipts.filter(url => url !== receiptUrl);
  
      await updateDoc(expenseRef, {
        receipts: updatedReceipts,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error deleting expense receipt:', error);
      throw error;
    }
  },

  getWorkerUnpaidExpenses: async (workerId) => {
    try {
      const expenseRef = collection(db, 'expense');
      const q = query(
        expenseRef,
        where('userID', '==', workerId),
        where('status', '==', 'approved'),
        where('paid', '==', false)
      );
      const snapshot = await getDocs(q);

      const results = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        results.push({
          id: docSnap.id,
          ...data,
          // parse date if needed
          date: data.date?.toDate?.() || new Date(data.date),
        });
      });

      return results;
    } catch (error) {
      console.error('Error fetching unpaid expenses:', error);
      throw error;
    }
  },

  markExpensesAsPaid: async (expenseIds, paymentDetails) => {
    try {
      const batch = writeBatch(db);
      expenseIds.forEach((id) => {
        const expRef = doc(db, 'expense', id);
        batch.update(expRef, {
          paid: true,
          paymentDate: Timestamp.now(),
          paymentReference: paymentDetails.reference,
          paymentAmount: paymentDetails.amount,
          updatedAt: Timestamp.now(),
        });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking expenses as paid:', error);
      throw error;
    }
  },

  // Validate expense amount against policy limit
  validateExpenseAmount: async (amount, currency, expenseType) => {
    try {
      // Skip validation if any required parameter is missing
      if (!amount || !currency || !expenseType) {
        return { isValid: true, message: '' };
      }

      // Get the expense type details if string name was provided
      let expenseTypeDetails = expenseType;
      if (typeof expenseType === 'string') {
        const expenseTypes = await adminExpenseService.getExpenseTypes();
        expenseTypeDetails = expenseTypes.find(type => type.name === expenseType);
        
        if (!expenseTypeDetails) {
          return { isValid: true, message: '' }; // Type not found, skip validation
        }
      }
      
      // Skip validation if policy limit isn't set
      if (!expenseTypeDetails.policyLimit) {
        return { isValid: true, message: '' };
      }

      // Get the amount in USD for comparison with policy limit
      let amountInUSD = parseFloat(amount);
      if (currency !== 'USD') {
        // Use the currencyService for conversion
        try {
          // Ensure currencyService is initialized
          await currencyService.initialize();
          amountInUSD = currencyService.convertCurrency(
            amountInUSD,
            currency,
            'USD'
          );
        } catch (error) {
          console.error('Error converting currency:', error);
          return { isValid: true, message: '' }; // Skip validation on currency conversion error
        }
      }

      // Compare with policy limit
      if (amountInUSD > expenseTypeDetails.policyLimit) {
        const formattedLimit = currencyService.formatCurrency(expenseTypeDetails.policyLimit, 'USD');
        const formattedAmount = currencyService.formatCurrency(amountInUSD, 'USD');
        
        return {
          isValid: false,
          message: `The amount (${formattedAmount}) exceeds the policy limit of ${formattedLimit} for ${expenseTypeDetails.name}. Please submit an additional expense note if absolutely necessary and contact the admin to explain why it exceeds normal costs.`
        };
      }

      return { isValid: true, message: '' };
    } catch (error) {
      console.error('Error validating expense amount:', error);
      return { isValid: true, message: '' }; // Skip validation on error
    }
  },

  // Convert any currency to USD
  convertToUSD: async (amount, currency) => {
    if (!amount || isNaN(amount) || currency === 'USD') {
      return parseFloat(amount) || 0;
    }
    
    try {
      await currencyService.initialize();
      return currencyService.convertCurrency(
        parseFloat(amount),
        currency,
        'USD'
      );
    } catch (error) {
      console.error('Error converting to USD:', error);
      return parseFloat(amount) || 0; // Return original amount on error
    }
  },
 };
 
 export default adminExpenseService;