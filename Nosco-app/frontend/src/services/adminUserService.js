// src/services/adminUserService.js
import { firestore } from '../firebase/firebase_config';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';

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

  // Create new worker
  createWorker: async (workerData) => {
    try {
      const newWorker = {
        ...workerData,
        role: 'worker',
        status: 'active',
        createdAt: Timestamp.now(),
        profilePic: '',
        bankAccounts: []
      };

      const docRef = await addDoc(collection(firestore, 'users'), newWorker);
      return {
        id: docRef.id,
        ...newWorker
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