// src/services/workerDashboardService.js
import { firestore as db } from '../firebase/firebase_config';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  limit,
  getCountFromServer,
  or
} from 'firebase/firestore';

export const workerDashboardService = {
  /**
   * Get all dashboard metrics for a worker
   * @param {string} userId - The worker's user ID
   * @returns {Promise<Object>} - Object containing all dashboard metrics
   */
  getWorkerDashboardMetrics: async (userId) => {
    if (!userId) return null;
    
    // Initialize metrics with default values
    const metrics = {
      totalHoursWorkedThisMonth: 0,
      workHoursPendingApproval: 0,
      expensesPendingApproval: 0,
      pendingProjectInvitations: 0,
      amountToBePaid: 0,
      paymentsProcessing: 0,
      processedPaymentsThisMonth: 0
    };

    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const startOfMonthTimestamp = Timestamp.fromDate(startOfMonth);
      
      // Get total approved work hours this month - safely wrapped in try/catch
      try {
        const workHoursRef = collection(db, 'workHours');
        const approvedWorkHoursQuery = query(
          workHoursRef,
          where('userID', '==', userId),
          where('status', '==', 'approved'),
          where('date', '>=', startOfMonthTimestamp)
        );
        
        const approvedWorkHoursSnapshot = await getDocs(approvedWorkHoursQuery);
        approvedWorkHoursSnapshot.forEach(doc => {
          const data = doc.data();
          const regularHours = parseFloat(data.regularHours) || 0;
          const overtime15x = parseFloat(data.overtime15x) || 0;
          const overtime20x = parseFloat(data.overtime20x) || 0;
          metrics.totalHoursWorkedThisMonth += regularHours + overtime15x + overtime20x;
        });
      } catch (e) {
        console.error("Error fetching hours worked this month:", e);
        // Metric keeps its default value
      }

      // Get pending work hours count - safely wrapped
      try {
        const workHoursRef = collection(db, 'workHours');
        const pendingWorkHoursQuery = query(
          workHoursRef,
          where('userID', '==', userId),
          where('status', '==', 'pending')
        );
        
        const pendingWorkHoursSnapshot = await getCountFromServer(pendingWorkHoursQuery);
        metrics.workHoursPendingApproval = pendingWorkHoursSnapshot.data().count;
      } catch (e) {
        console.error("Error fetching pending work hours:", e);
        // Metric keeps its default value
      }

      // Get pending expenses - safely wrapped
      try {
        const expensesRef = collection(db, 'expense');
        const pendingExpensesQuery = query(
          expensesRef,
          where('userID', '==', userId),
          where('status', '==', 'pending')
        );
        
        const pendingExpensesSnapshot = await getCountFromServer(pendingExpensesQuery);
        metrics.expensesPendingApproval = pendingExpensesSnapshot.data().count;
      } catch (e) {
        console.error("Error fetching pending expenses:", e);
        // Metric keeps its default value
      }

      // Get pending project invitations - safely wrapped, handling userID/workerID inconsistency
      try {
        const invitationsRef = collection(db, 'projectInvitations');
        const pendingInvitationsQuery = query(
          invitationsRef,
          or(
            where('userID', '==', userId),
            where('workerID', '==', userId)
          ),
          where('status', '==', 'pending')
        );
        
        const pendingInvitationsSnapshot = await getCountFromServer(pendingInvitationsQuery);
        metrics.pendingProjectInvitations = pendingInvitationsSnapshot.data().count;
      } catch (e) {
        console.error("Error fetching pending invitations:", e);
        // Try fallback method if "or" query fails due to compound query limitations
        try {
          // Try with userID
          const invitationsRef = collection(db, 'projectInvitations');
          const userIdQuery = query(
            invitationsRef,
            where('userID', '==', userId),
            where('status', '==', 'pending')
          );
          
          const userIdSnapshot = await getCountFromServer(userIdQuery);
          metrics.pendingProjectInvitations = userIdSnapshot.data().count;
        } catch (e2) {
          console.error("Error in fallback invitation query:", e2);
        }
      }

      // Calculate amounts yet to be paid (combining work hours and expenses)
      // -- APPROVED WORK HOURS, NOT PAID --
      try {
        const workHoursRef = collection(db, 'workHours');
        const approvedUnpaidQuery = query(
          workHoursRef,
          where('userID', '==', userId),
          where('status', '==', 'approved'),
          where('paid', '==', false)
        );
        
        const approvedUnpaidSnapshot = await getDocs(approvedUnpaidQuery);
        
        approvedUnpaidSnapshot.forEach(doc => {
          const data = doc.data();
          // If there's a payment amount, use it directly
          if (data.paymentAmount) {
            metrics.amountToBePaid += parseFloat(data.paymentAmount) || 0;
          } else {
            // Otherwise calculate based on hours (simplified calculation)
            const regularHours = parseFloat(data.regularHours) || 0;
            const overtime15x = parseFloat(data.overtime15x) || 0; 
            const overtime20x = parseFloat(data.overtime20x) || 0;
            const hourlyRate = parseFloat(data.hourlyRate) || 0;
            
            metrics.amountToBePaid += regularHours * hourlyRate;
            metrics.amountToBePaid += overtime15x * hourlyRate * 1.5;
            metrics.amountToBePaid += overtime20x * hourlyRate * 2.0;
          }
        });
      } catch (e) {
        console.error("Error fetching unpaid work hours:", e);
      }

      // -- APPROVED EXPENSES, NOT PAID --
      try {
        const expensesRef = collection(db, 'expense');
        const approvedUnpaidExpQuery = query(
          expensesRef,
          where('userID', '==', userId),
          where('status', '==', 'approved'),
          where('paid', '==', false)
        );
        
        const approvedUnpaidExpSnapshot = await getDocs(approvedUnpaidExpQuery);
        
        approvedUnpaidExpSnapshot.forEach(doc => {
          const data = doc.data();
          metrics.amountToBePaid += parseFloat(data.amount) || 0;
        });
      } catch (e) {
        console.error("Error fetching unpaid expenses:", e);
      }

      // Get payments processing - safely wrapped
      try {
        const paymentsRef = collection(db, 'payments');
        const processingPaymentsQuery = query(
          paymentsRef,
          where('userID', '==', userId),
          where('status', '==', 'processing')
        );
        
        const processingPaymentsSnapshot = await getDocs(processingPaymentsQuery);
        let processingAmount = 0;
        
        processingPaymentsSnapshot.forEach(doc => {
          const data = doc.data();
          processingAmount += parseFloat(data.amount) || 0;
        });
        
        metrics.paymentsProcessing = processingAmount;
      } catch (e) {
        console.error("Error fetching processing payments:", e);
        // Metric keeps its default value
      }

      // Get processed payments this month - safely wrapped
      try {
        const paymentsRef = collection(db, 'payments');
        const processedPaymentsQuery = query(
          paymentsRef,
          where('userID', '==', userId),
          where('status', '==', 'completed'),
          where('date', '>=', startOfMonthTimestamp)
        );
        
        const processedPaymentsSnapshot = await getDocs(processedPaymentsQuery);
        let processedAmount = 0;
        
        processedPaymentsSnapshot.forEach(doc => {
          const data = doc.data();
          processedAmount += parseFloat(data.amount) || 0;
        });
        
        metrics.processedPaymentsThisMonth = processedAmount;
      } catch (e) {
        console.error("Error fetching processed payments:", e);
        // Metric keeps its default value
      }

    } catch (error) {
      console.error('Error getting worker dashboard metrics:', error);
      // Return the metrics object with default values instead of throwing
    }
    
    // Always return the metrics object, even if partially filled
    return metrics;
  },

  /**
   * Get recent notifications for a worker
   * @param {string} userId - The worker's user ID
   * @param {number} count - Number of notifications to fetch (default 4)
   * @returns {Promise<Array>} - Array of notification objects
   */
  getRecentNotifications: async (userId, count = 4) => {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userID', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(count)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        message: doc.data().message || doc.data().title, // Ensure there's a message property
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }));
    } catch (error) {
      console.error('Error fetching recent notifications:', error);
      return [];
    }
  }
};

export default workerDashboardService;
