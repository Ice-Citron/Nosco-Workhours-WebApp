// src/services/workerProfileService.js
import { firestore } from '../firebase/firebase_config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Fetch a worker's Firestore doc by uid
 * Returns the user document data (e.g. name, email, compensation, etc.)
 */
export const getWorkerProfile = async (uid) => {
  const ref = doc(firestore, 'users', uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    throw new Error("Worker not found or doc doesn't exist.");
  }
  return snapshot.data();
};

/**
 * Update a worker's Firestore doc with the given partial fields
 */
export const updateWorkerProfile = async (uid, updates) => {
  const ref = doc(firestore, 'users', uid);
  await updateDoc(ref, updates);
};
