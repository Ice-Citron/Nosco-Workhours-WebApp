/* eslint-disable max-len, @typescript-eslint/no-explicit-any */
/**
 * adminSettingsService.ts
 * 
 * Server-side logic for auto refreshing exchange rates,
 * reading/writing the Firestore doc "settings/exchangeRates",
 * etc.
 */

import * as admin from "firebase-admin";

const db = admin.firestore();

// The doc we store settings in
const SETTINGS_COLLECTION = "settings";
const EXCHANGE_RATES_DOC = "exchangeRates";
const API_KEY = "d8ec97094877d57688a1391b";

/**
 * fetchRatesFromAPI: does an HTTP fetch from exchangerate-api using the base currency
 */
async function fetchRatesFromAPI(base: string): Promise<any> {
  const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${base}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch from API. Status: ${response.status}`);
  }
  const data = await response.json();
  if (data.result !== "success") {
    throw new Error(`API Error: ${data["error-type"]}`);
  }
  return data; // includes data.conversion_rates
}

/**
 * autoRefreshIfNeeded:
 * 1) read "exchangeRates" doc
 * 2) if autoUpdateEnabled & (days >= refreshPeriodDays), fetch new rates for selectedCurrencies
 * 3) store them
 */
export async function autoRefreshIfNeeded(): Promise<void> {
  const ref = db.collection(SETTINGS_COLLECTION).doc(EXCHANGE_RATES_DOC);
  let snap = await ref.get();

  // If doc doesn't exist, create defaults
  if (!snap.exists) {
    const defaultData = {
      autoUpdateEnabled: false,
      refreshPeriodDays: 7,
      lastUpdated: admin.firestore.Timestamp.now(),
      selectedCurrencies: ["USD"],
      rates: { USD: 1.0 },
    };
    await ref.set(defaultData);
    snap = await ref.get(); // re-fetch
  }

  const data = snap.data() || {};
  const {
    autoUpdateEnabled,
    lastUpdated,
    refreshPeriodDays = 7,
    selectedCurrencies = [],
  } = data;

  if (!autoUpdateEnabled) {
    console.log("autoRefreshIfNeeded: autoUpdateEnabled = false, skipping refresh.");
    return;
  }

  const now = new Date();
  const lastUpd = lastUpdated?.toDate?.() || new Date(0);
  const diffDays = (now.getTime() - lastUpd.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays >= refreshPeriodDays) {
    console.log(
      `autoRefreshIfNeeded: Last updated was ${diffDays.toFixed(1)} days ago, >= ${refreshPeriodDays}. Fetching new rates...`
    );

    // fetch from API (base = "USD" for example)
    const apiData = await fetchRatesFromAPI("USD");
    const allApiRates = apiData.conversion_rates || {};

    // keep only selectedCurrencies
    const newRates: Record<string, number> = {};
    for (const code of selectedCurrencies) {
      if (allApiRates[code] !== undefined) {
        newRates[code] = allApiRates[code];
      } else {
        newRates[code] = 1.0; // fallback
      }
    }

    const updatedData = {
      ...data,
      rates: newRates,
      lastUpdated: admin.firestore.Timestamp.now(),
    };
    await ref.set(updatedData, { merge: true });
    console.log("autoRefreshIfNeeded: Rates updated in Firestore");
  } else {
    console.log(
      `autoRefreshIfNeeded: Only ${diffDays.toFixed(1)} days since last update. Need >= ${refreshPeriodDays}. No refresh.`
    );
  }
}

/**
 * Optionally, a manual function that always fetches from the API
 * (bypassing the date check). e.g. for an HTTP function.
 */
export async function forceRefreshFromServer(): Promise<void> {
  const ref = db.collection(SETTINGS_COLLECTION).doc(EXCHANGE_RATES_DOC);
  let snap = await ref.get();

  if (!snap.exists) {
    const defaultData = {
      autoUpdateEnabled: false,
      refreshPeriodDays: 7,
      lastUpdated: admin.firestore.Timestamp.now(),
      selectedCurrencies: ["USD"],
      rates: { USD: 1.0 },
    };
    await ref.set(defaultData);
    snap = await ref.get();
  }

  const data = snap.data() || {};
  const { selectedCurrencies = [] } = data;

  // fetch from API ignoring lastUpdated
  const apiData = await fetchRatesFromAPI("USD");
  const allApiRates = apiData.conversion_rates || {};

  const newRates: Record<string, number> = {};
  for (const code of selectedCurrencies) {
    if (allApiRates[code] !== undefined) {
      newRates[code] = allApiRates[code];
    } else {
      newRates[code] = 1.0;
    }
  }

  const updatedData = {
    ...data,
    rates: newRates,
    lastUpdated: admin.firestore.Timestamp.now(),
  };

  await ref.set(updatedData, { merge: true });
  console.log("forceRefreshFromServer: forcibly refreshed rates in Firestore");
}
