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
        // Set default admin permissions if none are provided
        permissions: adminData.permissions || ['approve_expenses', 'manage_payments', 'manage_users'],
        phoneNumber: adminData.phoneNumber || ''
      };

      // 3) Write that doc to `users/{newUid}`
      await setDoc(doc(firestore, 'users', newUid), newAdminDoc);

      return { id: newUid, ...newAdminDoc };
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  },


  // Update worker status (active or archived)
  updateWorkerStatus: async (workerId, status) => {
    try {
      const workerRef = doc(firestore, 'users', workerId);
      await updateDoc(workerRef, {
        status: status,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating worker status:', error);
      throw error;
    }
  },

  // Update worker details
  updateWorkerDetails: async (workerId, data) => {
    try {
      const workerRef = doc(firestore, 'users', workerId);
      await updateDoc(workerRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating worker details:', error);
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
};
