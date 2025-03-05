// src/services/adminUserService.js

import { firestore, auth } from '../firebase/firebase_config';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  Timestamp,
  setDoc,
  getDoc // <-- import getDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import adminNotificationService from './adminNotificationService';


export const adminUserService = {
  // Fetch all workers
  getWorkers: async () => {
    try {
      const q = query(
        collection(firestore, 'users'),
        where('role', '==', 'worker')
      );
      const querySnapshot = await getDocs(q);
      const workers = [];
      querySnapshot.forEach((docSnap) => {
        workers.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      return workers;
    } catch (error) {
      console.error('Error fetching workers:', error);
      throw error;
    }
  },

  // Fetch all admins
  getAdmins: async () => {
    try {
      const q = query(
        collection(firestore, 'users'),
        where('role', '==', 'admin')
      );
      const querySnapshot = await getDocs(q);
      const admins = [];
      querySnapshot.forEach((docSnap) => {
        admins.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      return admins;
    } catch (error) {
      console.error('Error fetching admins:', error);
      throw error;
    }
  },

  // Create new worker: also create them in Firebase Auth
  createWorker: async (workerData) => {
    try {
      // 1) Create the user in Firebase Auth using email + defaultPassword
      const { email, defaultPassword } = workerData;
      if (!email) throw new Error('Email is required');
      if (!defaultPassword) {
        throw new Error('A default password is required.');
      }
      const userCred = await createUserWithEmailAndPassword(auth, email, defaultPassword);
      const newUid = userCred.user.uid;

      // 2) Build the doc that goes into Firestore
      const baseRate = parseFloat(workerData.baseRate || 0);
      const otRate15 = parseFloat(workerData.otRate15 || 0);
      const otRate20 = parseFloat(workerData.otRate20 || 0);
      const currency = workerData.currency || 'USD';

      const newWorkerDoc = {
        name: workerData.name,
        email: workerData.email,
        department: workerData.department,
        position: workerData.position,
        role: 'worker',
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        profilePic: '',
        bankAccounts: [],
        currentActiveProject: '',
        compensation: {
          baseRate,
          otRate15,
          otRate20,
          currency
        }
      };

      // 3) Write that doc to `users/{newUid}`
      await setDoc(doc(firestore, 'users', newUid), newWorkerDoc);
      
      // 4) Notify all admins about the new worker
      await adminNotificationService.notifyAllAdminsWorkerCreated(
        newUid, 
        workerData.name
      );

      return { id: newUid, ...newWorkerDoc };
    } catch (error) {
      console.error('Error creating worker:', error);
      throw error;
    }
  },

  // Create new admin
  createAdmin: async (adminData) => {
    try {
      // 1) Create the user in Firebase Auth using email + defaultPassword
      const { email, defaultPassword } = adminData;
      if (!email) throw new Error('Email is required');
      if (!defaultPassword) throw new Error('A default password is required.');
      const userCred = await createUserWithEmailAndPassword(auth, email, defaultPassword);
      const newUid = userCred.user.uid;

      // 2) Build the admin doc for Firestore
      const newAdminDoc = {
        name: adminData.name,
        email: adminData.email,
        department: adminData.department,
        position: adminData.position,
        role: 'admin',
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        profilePic: '',
        phoneNumber: adminData.phoneNumber || ''
      };

      // 3) Write that doc to `users/{newUid}`
      await setDoc(doc(firestore, 'users', newUid), newAdminDoc);
      
      // 4) Notify all admins about the new admin
      await adminNotificationService.notifyAllAdminsAdminCreated(
        newUid, 
        adminData.name
      );

      return { id: newUid, ...newAdminDoc };
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  },

  // Update worker/admin status (modified to include notifications)
  updateWorkerStatus: async (userId, status) => {
    try {
      // Get the user data first to determine if it's a worker or admin
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userSnap.data();
      const userName = userData.name || 'Unknown User';
      const userRole = userData.role;
      const oldStatus = userData.status;
      
      // Update the status
      await updateDoc(userRef, {
        status: status,
        updatedAt: Timestamp.now()
      });
      
      // Notify all admins based on role and action
      if (userRole === 'worker') {
        if (status === 'archived' && oldStatus !== 'archived') {
          await adminNotificationService.notifyAllAdminsWorkerArchived(userId, userName);
        } else if (status === 'active' && oldStatus === 'archived') {
          await adminNotificationService.notifyAllAdminsWorkerUnarchived(userId, userName);
        }
      } else if (userRole === 'admin') {
        if (status === 'archived' && oldStatus !== 'archived') {
          await adminNotificationService.notifyAllAdminsAdminArchived(userId, userName);
        } else if (status === 'active' && oldStatus === 'archived') {
          await adminNotificationService.notifyAllAdminsAdminUnarchived(userId, userName);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  // Get only active workers
  getActiveWorkers: async () => {
    try {
      const usersRef = collection(firestore, 'users');
      const q = query(
        usersRef,
        where('role', '==', 'worker'),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
    } catch (error) {
      console.error('Error fetching active workers:', error);
      throw error;
    }
  },

  // Get worker details by ID (this was the old "firestore.collection" part)
  getWorkerDetails: async (workerId) => {
    try {
      // Use modular doc() + getDoc()
      const userRef = doc(firestore, 'users', workerId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error('Worker not found');
      }

      return {
        id: userSnap.id,
        ...userSnap.data()
      };
    } catch (error) {
      console.error('Error fetching worker details:', error);
      throw error;
    }
  },

  // Update worker details
  updateWorkerDetails: async (workerId, workerData) => {
    try {
      const userRef = doc(firestore, 'users', workerId);
      
      // Get the current worker document
      const workerDoc = await getDoc(userRef);
      if (!workerDoc.exists()) {
        throw new Error('Worker not found');
      }
      
      // Prepare the data to update
      const updateData = {
        name: workerData.name,
        email: workerData.email,
        department: workerData.department,
        position: workerData.position,
        updatedAt: Timestamp.now()
      };
      
      // Handle compensation data if it's part of the form
      if (workerData.baseRate !== undefined || 
          workerData.otRate15 !== undefined ||
          workerData.otRate20 !== undefined ||
          workerData.currency !== undefined) {
        
        // Get the existing compensation object or create a new one
        const currentCompensation = workerDoc.data().compensation || {};
        
        updateData.compensation = {
          ...currentCompensation,
          baseRate: workerData.baseRate !== undefined 
            ? parseFloat(workerData.baseRate) 
            : currentCompensation.baseRate || 0,
          otRate15: workerData.otRate15 !== undefined 
            ? parseFloat(workerData.otRate15) 
            : currentCompensation.otRate15 || 0,
          otRate20: workerData.otRate20 !== undefined 
            ? parseFloat(workerData.otRate20) 
            : currentCompensation.otRate20 || 0,
          currency: workerData.currency || currentCompensation.currency || 'USD'
        };
      }
      
      // Handle bank account data if it's part of the form
      if (workerData.bankAccounts) {
        updateData.bankAccounts = workerData.bankAccounts;
      }
      
      // Update the document
      await updateDoc(userRef, updateData);
      
      return {
        id: workerId,
        ...workerDoc.data(),
        ...updateData
      };
    } catch (error) {
      console.error('Error updating worker details:', error);
      throw error;
    }
  },
};
