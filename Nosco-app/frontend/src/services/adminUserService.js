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

  // Get single worker details
  getWorkerDetails: async (workerId) => {
    try {
      const workerDoc = await firestore.collection('users').doc(workerId).get();
      if (!workerDoc.exists) {
        throw new Error('Worker not found');
      }
      return {
        id: workerDoc.id,
        ...workerDoc.data()
      };
    } catch (error) {
      console.error('Error fetching worker details:', error);
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
  }
};