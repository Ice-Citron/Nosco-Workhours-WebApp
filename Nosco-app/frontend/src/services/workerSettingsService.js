// src/services/workerSettingsService.js
import { firestore } from '../firebase/firebase_config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export const getWorkerBankAccounts = async (uid) => {
  const ref = doc(firestore, 'users', uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    throw new Error('User doc not found');
  }
  const data = snapshot.data();
  // Return the existing array, or an empty array if none
  return data.bankAccounts || [];
};

export const updateWorkerBankAccounts = async (uid, newAccountsArray) => {
  const ref = doc(firestore, 'users', uid);
  await updateDoc(ref, {
    bankAccounts: newAccountsArray
  });
};
