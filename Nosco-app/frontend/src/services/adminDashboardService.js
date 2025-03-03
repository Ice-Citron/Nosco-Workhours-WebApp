// src/services/adminDashboardService.js

import { firestore } from '../firebase/firebase_config';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  getCountFromServer
} from 'firebase/firestore';
import { adminPaymentService } from './adminPaymentService';

export const adminDashboardService = {
  /**
   * Fetches all metrics needed for the admin dashboard
   * @returns {Promise<Object>} Object containing all dashboard metrics
   */
  getDashboardMetrics: async () => {
    // Initialize with default values
    const metrics = {
      pendingWorkHours: 0,
      pendingExpenses: 0,
      amountDue: 0,
      paymentProcessingAmount: 0,
      paymentsProcessing: 0,
      pendingInvitations: 0,
      activeWorkers: 0,
      totalExpensesThisMonth: 0,
      totalPaymentsThisMonth: 0,
      totalPaymentsProcessed: 0
    };

    try {
      // Get pending work hours count
      try {
        const workHoursRef = collection(firestore, 'workHours');
        const workHoursQuery = query(
          workHoursRef,
          where('status', '==', 'pending')
        );
        const workHoursSnapshot = await getCountFromServer(workHoursQuery);
        metrics.pendingWorkHours = workHoursSnapshot.data().count;
      } catch (e) {
        console.error('Error fetching pending work hours:', e);
        // Keep default value
      }
      
      // Get pending expenses count
      try {
        const expensesRef = collection(firestore, 'expense');
        const expensesQuery = query(
          expensesRef,
          where('status', '==', 'pending')
        );
        const expensesSnapshot = await getCountFromServer(expensesQuery);
        metrics.pendingExpenses = expensesSnapshot.data().count;
      } catch (e) {
        console.error('Error fetching pending expenses:', e);
        // Keep default value
      }
      
      // Get amount due (approved but unpaid)
      try {
        const unpaidWorkersData = await adminPaymentService.getAllWorkersUnpaidData();
        unpaidWorkersData.forEach(worker => {
          metrics.amountDue += worker.unpaidAmount || 0;
        });
      } catch (e) {
        console.error('Error fetching unpaid worker data:', e);
        // Keep default value
      }
      
      // Get pending payments processing
      try {
        const paymentsRef = collection(firestore, 'payments');
        const paymentsQuery = query(
          paymentsRef,
          where('status', '==', 'processing')
        );
        const paymentsSnapshot = await getDocs(paymentsQuery);
        metrics.paymentsProcessing = paymentsSnapshot.size;
        
        // Calculate total payment processing amount
        paymentsSnapshot.forEach(doc => {
          const paymentData = doc.data();
          metrics.paymentProcessingAmount += parseFloat(paymentData.amount) || 0;
        });
      } catch (e) {
        console.error('Error fetching payments processing:', e);
        // Keep default values
      }
      
      // Get pending project invitations
      try {
        const invitationsRef = collection(firestore, 'projectInvitations');
        const invitationsQuery = query(
          invitationsRef,
          where('status', '==', 'pending')
        );
        const invitationsSnapshot = await getCountFromServer(invitationsQuery);
        metrics.pendingInvitations = invitationsSnapshot.data().count;
      } catch (e) {
        console.error('Error fetching pending invitations:', e);
        // Keep default value
      }
      
      // Get active workers count
      try {
        const workersRef = collection(firestore, 'users');
        const workersQuery = query(
          workersRef,
          where('role', '==', 'worker'),
          where('status', '==', 'active')
        );
        const workersSnapshot = await getCountFromServer(workersQuery);
        metrics.activeWorkers = workersSnapshot.data().count;
      } catch (e) {
        console.error('Error fetching active workers:', e);
        // Keep default value
      }
      
      // Calculate expenses this month
      try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const expensesThisMonthRef = collection(firestore, 'expense');
        const expensesThisMonthQuery = query(
          expensesThisMonthRef,
          where('status', '==', 'approved'),
          where('date', '>=', Timestamp.fromDate(startOfMonth))
        );
        const expensesThisMonthSnapshot = await getDocs(expensesThisMonthQuery);
        
        expensesThisMonthSnapshot.forEach(doc => {
          const expenseData = doc.data();
          metrics.totalExpensesThisMonth += parseFloat(expenseData.amount) || 0;
        });
      } catch (e) {
        console.error('Error fetching expenses this month:', e);
        // Keep default value
      }
      
      // Calculate payments this month
      try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const paymentsThisMonthRef = collection(firestore, 'payments');
        const paymentsThisMonthQuery = query(
          paymentsThisMonthRef,
          where('status', '==', 'completed'),
          where('date', '>=', Timestamp.fromDate(startOfMonth))
        );
        const paymentsThisMonthSnapshot = await getDocs(paymentsThisMonthQuery);
        
        metrics.totalPaymentsProcessed = paymentsThisMonthSnapshot.size;
        
        paymentsThisMonthSnapshot.forEach(doc => {
          const paymentData = doc.data();
          metrics.totalPaymentsThisMonth += parseFloat(paymentData.amount) || 0;
        });
      } catch (e) {
        console.error('Error fetching payments this month:', e);
        // Keep default values
      }
    } catch (error) {
      console.error('Error in getDashboardMetrics:', error);
      // Just return the default metrics
    }
    
    return metrics;
  }
};
