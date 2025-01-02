// src/services/adminSettingsService.js

import { firestore } from '../firebase/firebase_config';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

/**
 * =========================
 *  Admin Preferences
 *    - e.g. defaultCurrency
 * =========================
 */
export const getAdminPreferences = async () => {
  try {
    const ref = doc(firestore, 'settings', 'adminPreferences');
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      // Provide defaults if the doc doesn't exist
      return { defaultCurrency: 'USD' };
    }
    return snapshot.data();
  } catch (error) {
    console.error('Error getting admin preferences:', error);
    throw error;
  }
};

export const updateAdminPreferences = async (prefs) => {
  try {
    const ref = doc(firestore, 'settings', 'adminPreferences');
    await setDoc(
      ref,
      {
        ...prefs,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating admin preferences:', error);
    throw error;
  }
};

/**
 * =========================
 *  Exchange Rates Settings
 *    - autoUpdateEnabled
 *    - lastUpdated
 *    - rates {USD, EUR, ...}
 * =========================
 */
export const getExchangeRatesSettings = async () => {
  try {
    const ref = doc(firestore, 'settings', 'exchangeRates');
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      // If doc doesn't exist, provide a fallback structure
      return {
        autoUpdateEnabled: false,
        lastUpdated: null,
        rates: {
          USD: 1.0
        },
      };
    }

    return snapshot.data();
  } catch (error) {
    console.error('Error getting exchange rates settings:', error);
    throw error;
  }
};

export const updateExchangeRatesSettings = async (data) => {
  try {
    const ref = doc(firestore, 'settings', 'exchangeRates');
    await setDoc(
      ref,
      {
        ...data,
        updatedAt: Timestamp.now(), // So you can track the last manual update
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating exchange rates settings:', error);
    throw error;
  }
};


/*
export const getRewardPoints = async (actionType) => {
    // This could be expanded later to fetch from a settings collection
    const DEFAULT_POINTS = {
      EXPENSE_APPROVED: 50,
      WORK_HOURS_APPROVED: 100,
      // etc
    };
    
    return DEFAULT_POINTS[actionType] || 0;
  };
*/