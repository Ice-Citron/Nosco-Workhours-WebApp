// src/pages/admin/settings/AdminSettingsPage.jsx
import React, { useState, useEffect } from 'react';
import {
  getAdminPreferences,
  updateAdminPreferences,
  getExchangeRatesSettings,
  updateExchangeRatesSettings
} from '../../../services/adminSettingsService';

const AdminSettingsPage = () => {
  // Loading / error states
  const [loading, setLoading] = useState(true);

  // --- Admin default currency ---
  const [defaultCurrency, setDefaultCurrency] = useState('USD');

  // --- Exchange rates fields ---
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);
  const [rates, setRates] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  // -------------------------------
  // 1. LOAD DATA ON MOUNT
  // -------------------------------
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Load admin preferences from Firestore
        const prefs = await getAdminPreferences();
        if (isMounted && prefs?.defaultCurrency) {
          setDefaultCurrency(prefs.defaultCurrency);
        }

        // Load exchange rates doc
        const exData = await getExchangeRatesSettings();
        if (isMounted && exData) {
          setAutoUpdateEnabled(exData.autoUpdateEnabled || false);
          setRates(exData.rates || {});
          setLastUpdated(exData.lastUpdated);
        }
      } catch (error) {
        console.error("Error loading admin settings:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // ----------------------------------
  // 2. SAVE ADMIN DEFAULT CURRENCY
  // ----------------------------------
  const handleSaveAdminPrefs = async () => {
    try {
      await updateAdminPreferences({
        defaultCurrency
      });
      alert("Admin default currency updated!");
    } catch (err) {
      console.error("Failed to update admin preferences:", err);
      alert("Error saving admin preferences.");
    }
  };

  // ----------------------------------
  // 3. EXCHANGE RATES: EVENT HANDLERS
  // ----------------------------------
  // Toggle autoUpdateEnabled
  const handleToggleAutoUpdate = (e) => {
    setAutoUpdateEnabled(e.target.checked);
  };

  // Update a single currency’s rate
  const handleRateChange = (currency, newValue) => {
    setRates(prev => ({
      ...prev,
      [currency]: parseFloat(newValue) || 0
    }));
  };

  // OPTIONAL: Add a new currency row
  const handleAddCurrency = () => {
    setRates(prev => ({
      ...prev,
      NEW: 1.0 // Example key
    }));
  };

  // ----------------------------------
  // 4. SAVE EXCHANGE RATES
  // ----------------------------------
  const handleSaveExchangeRates = async () => {
    try {
      const newData = {
        autoUpdateEnabled,
        rates,
        lastUpdated: new Date() // or Firestore.Timestamp.now() on the server side
      };
      await updateExchangeRatesSettings(newData);
      alert("Exchange rates updated successfully!");
    } catch (error) {
      console.error("Failed to update exchange rates:", error);
      alert("Error saving exchange rates.");
    }
  };

  // ----------------------------------
  // 5. RENDER THE PAGE
  // ----------------------------------
  if (loading) {
    return <div>Loading Admin Settings...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Admin Settings</h1>

      {/* ADMIN PREFERENCES SECTION */}
      <section className="mb-8">
        <h2 className="text-xl font-bold">Default Currency (Admin Only)</h2>
        <div className="mt-2">
          <label htmlFor="defaultCurrency" className="mr-2">
            Default Currency:
          </label>
          <select
            id="defaultCurrency"
            className="p-1 border rounded"
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="MYR">MYR</option>
            {/* Add more as needed */}
          </select>
        </div>
        <button
          className="mt-2 px-3 py-1 bg-blue-600 text-white rounded"
          onClick={handleSaveAdminPrefs}
        >
          Save Default Currency
        </button>
      </section>

      {/* EXCHANGE RATES SECTION */}
      <section>
        <h2 className="text-xl font-bold">Exchange Rates</h2>

        {/* AUTO-UPDATE TOGGLE */}
        <div className="mt-2 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoUpdateEnabled}
              onChange={handleToggleAutoUpdate}
            />
            Auto-update enabled?
          </label>
        </div>

        {/* If auto-update is OFF, allow manual editing */}
        {autoUpdateEnabled ? (
          <div className="mb-4">
            <p className="text-gray-600">
              Auto-update is enabled, so a scheduled job or Cloud Function
              would update these rates daily (or you can force a refresh).
            </p>
            {/* (Optional) button for forced fetch from external API:
            <button onClick={handleFetchFromAPI}>Force Fetch</button> */}
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-gray-600 mb-2">
              Auto-update is disabled. You can manually edit the rates:
            </p>
            <table className="border-collapse w-full">
              <thead>
                <tr>
                  <th className="border p-2">Currency</th>
                  <th className="border p-2">Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(rates).map(([currency, rate]) => (
                  <tr key={currency}>
                    <td className="border p-2">{currency}</td>
                    <td className="border p-2">
                      <input
                        type="number"
                        step="0.0001"
                        className="w-24 p-1 border"
                        value={rate}
                        onChange={(e) => handleRateChange(currency, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="mt-2 px-3 py-1 bg-green-600 text-white rounded"
              onClick={handleAddCurrency}
            >
              Add New Currency
            </button>
          </div>
        )}

        {/* SAVE Exchange Rates button */}
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={handleSaveExchangeRates}
        >
          Save Exchange Rates
        </button>

        {/* Show last-updated info */}
        {lastUpdated && (
          <p className="text-sm text-gray-500 mt-2">
            Last Updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </section>
    </div>
  );
};

export default AdminSettingsPage;
