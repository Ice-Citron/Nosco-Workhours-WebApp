// src/services/adminSettingsService.js
import { firestore } from '../firebase/firebase_config';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

export const getAdminPreferences = async () => {
  try {
    const ref = doc(firestore, 'settings', 'adminPreferences');
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      const defaultData = { defaultCurrency: 'USD' };
      await setDoc(ref, defaultData);
      return defaultData;
    }
    return snapshot.data();
  } catch (error) {
    console.error('Error getting admin preferences:', error);
    throw error;
  }
};

export const updateAdminPreferences = async (data) => {
  try {
    const ref = doc(firestore, 'settings', 'adminPreferences');
    await setDoc(ref, { 
      ...data,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.error('Error updating admin preferences:', error);
    throw error;
  }
};

// ============================================
// Exchange Rates
// ============================================
const EXCHANGE_RATES_DOC = 'exchangeRates';
const SETTINGS_COLLECTION = 'settings';
const API_KEY = 'd8ec97094877d57688a1391b';

/**
 * Fetch fresh rates from the external API for a given base currency
 */
async function fetchRatesFromAPI(base = 'USD') {
  const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${base}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch from API: ${response.status}`);
  }
  const data = await response.json();
  if (data.result !== 'success') {
    throw new Error(`API Error: ${data['error-type']}`);
  }
  return data; // includes data.conversion_rates, etc.
}

/**
 * getExchangeRatesSettings:
- *  1) get or create the doc
- *  2) if autoUpdateEnabled & lastUpdated > refreshPeriodDays, fetch from API
- *  3) only store codes in selectedCurrencies => rates
- *  4) return final doc data
+ *  1) get or create the doc
+ *  2) return doc as-is (no more auto-refresh from client)
 */
export const getExchangeRatesSettings = async () => {
  const ref = doc(firestore, SETTINGS_COLLECTION, EXCHANGE_RATES_DOC);
  let snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    const defaultData = {
      autoUpdateEnabled: false,
      refreshPeriodDays: 7,
      lastUpdated: Timestamp.now(),
      selectedCurrencies: ['USD'],
      rates: { USD: 1.0 },
    };
    await setDoc(ref, defaultData);
    return defaultData;
  }

  const data = snapshot.data();
  // simply return doc data as-is
  return data;
};

/**
 * updateExchangeRatesSettings:
 * Merge new fields (autoUpdateEnabled, refreshPeriodDays, selectedCurrencies, etc.)
 */
export const updateExchangeRatesSettings = async (newData) => {
  const ref = doc(firestore, SETTINGS_COLLECTION, EXCHANGE_RATES_DOC);
  await setDoc(ref, {
    ...newData,
    updatedAt: Timestamp.now(),
  }, { merge: true });
};

/**
 * forceRefreshRates:
 *   1) fetch doc
 *   2) fetch from API ignoring lastUpdated
 *   3) only store selected codes
 */
export const forceRefreshRates = async () => {
  const ref = doc(firestore, SETTINGS_COLLECTION, EXCHANGE_RATES_DOC);
  let snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    const defaultDoc = {
      autoUpdateEnabled: false,
      refreshPeriodDays: 7,
      lastUpdated: Timestamp.now(),
      selectedCurrencies: ['USD'],
      rates: { USD: 1.0 },
    };
    await setDoc(ref, defaultDoc);
    snapshot = await getDoc(ref);
  }

  const data = snapshot.data();
  const { selectedCurrencies = [] } = data;

  const baseCurrency = 'USD';
  const apiData = await fetchRatesFromAPI(baseCurrency);
  const allApiRates = apiData.conversion_rates || {};

  const newRates = {};
  selectedCurrencies.forEach((code) => {
    if (allApiRates[code] !== undefined) {
      newRates[code] = allApiRates[code];
    } else {
      newRates[code] = 1.0;
    }
  });

  const updatedData = {
    ...data,
    rates: newRates,
    lastUpdated: Timestamp.now(),
  };

  await setDoc(ref, updatedData, { merge: true });
  return updatedData;
};


/**
 * Convert a numeric value from one currency to another, using your Firestore rates doc.
 * This will pull the latest doc from Firestore each time you call it. 
 * In a real app, you might cache the doc in state or context to avoid extra fetches.
 */
export const convertBetweenCurrencies = async (value, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) {
    return value; // No conversion needed
  }

  // 1) Fetch the "exchangeRates" doc (which includes `rates: { USD: 1, MYR:4.393, ... }`)
  const settings = await getExchangeRatesSettings();
  const { rates = {} } = settings;

  // 2) Grab the from/to rates (default to 1 if missing)
  const fromRate = rates[fromCurrency] ?? 1;
  const toRate = rates[toCurrency] ?? 1;

  // 3) Convert
  // Because these rates are “1 USD = rates[currency]”, 
  // the formula to go from `fromCurrency` -> `toCurrency` is:
  //   newValue = oldValue / fromRate * toRate
  return (value / fromRate) * toRate;
};

/**
 * Trigger a manual backup of Firestore database
 * @returns {Promise<{success: boolean, message: string, backupPath?: string}>} Result of the backup operation
 */
export const triggerManualBackup = async () => {
  try {
    // You'll need to update this with your actual function URL after deployment
    // Format: https://[region]-nosco-app-b5be4.cloudfunctions.net/manualFirestoreBackup
    const functionUrl = 'https://us-central1-nosco-app-b5be4.cloudfunctions.net/manualFirestoreBackup';
    
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to trigger manual backup:', error);
    return {
      success: false,
      message: `Failed to trigger backup: ${error.message || 'Unknown error'}`
    };
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