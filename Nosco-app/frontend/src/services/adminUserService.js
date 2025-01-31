// src/services/adminUserService.js
import { firestore, auth } from '../firebase/firebase_config';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, Timestamp, setDoc } from 'firebase/firestore';
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
      querySnapshot.forEach((doc) => {
        workers.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return workers;
    } catch (error) {
      console.error('Error fetching workers:', error);
      throw error;
    }
  },

  // Create new worker: also create them in Firebase Auth
  createWorker: async (workerData) => {
    try {
      // 1) Create the user in Firebase Auth using email + defaultPassword
      //    NOTE: This only works if the currently logged-in admin is privileged
      //    to run createUserWithEmailAndPassword in your client app.
      //    Otherwise, you'd do this with the Admin SDK on a server or cloud function.
      const { email, defaultPassword } = workerData;
      if (!email) throw new Error('Email is required');
      if (!defaultPassword) {
        // Optionally require a password or generate a random one
        throw new Error('A default password is required (for demonstration).');
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
        compensation: {
          baseRate,
          otRate15,
          otRate20,
          currency
        },
        // We no longer store the actual password in Firestore 
        // because Firebase Auth is handling it.
        // If you REALLY want, you could store "tempPassword" but 
        // it's strongly discouraged. We'll omit it here.
      };

      // 3) Write that doc to `users/{newUid}`
      await setDoc(doc(firestore, 'users', newUid), newWorkerDoc);

      return {
        id: newUid,
        ...newWorkerDoc
      };
    } catch (error) {
      console.error('Error creating worker:', error);
      throw error;
    }
  },

  // Update worker status (active/archived)
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

  getActiveWorkers: async () => {
    try {
      const usersRef = collection(firestore, 'users');
      const q = query(
        usersRef,
        where('role', '==', 'worker'),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching active workers:', error);
      throw error;
    }
  },

  // Get worker details by ID
  getWorkerDetails: async (workerId) => {
    try {
      const userDoc = await firestore
        .collection('users')
        .doc(workerId)
        .get();

      if (!userDoc.exists()) {
        throw new Error('Worker not found');
      }

      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    } catch (error) {
      console.error('Error fetching worker details:', error);
      throw error;
    }
  },
};