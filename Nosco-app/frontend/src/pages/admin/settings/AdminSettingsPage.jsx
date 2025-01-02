// src/pages/admin/settings/AdminSettingsPage.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import {
  getAdminPreferences,
  updateAdminPreferences,
  getExchangeRatesSettings,
  updateExchangeRatesSettings,
  forceRefreshRates
} from '../../../services/adminSettingsService';

const API_KEY = 'd8ec97094877d57688a1391b'; // Just as reference, you might not need it here

const AdminSettingsPage = () => {
  // Loading / error states
  const [loading, setLoading] = useState(true);

  // Admin default currency
  const [defaultCurrency, setDefaultCurrency] = useState('USD');

  // Exchange Rates doc fields
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);
  const [refreshPeriodDays, setRefreshPeriodDays] = useState(7);
  const [rates, setRates] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  // Modal states for Add/Remove Currency
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [allCurrencies, setAllCurrencies] = useState([]);
  const [selectedCurrencies, setSelectedCurrencies] = useState({});

  const currencyOptions = Object.keys(rates || {});

  // Safely convert Firestore Timestamp -> JS Date
  const formatLastUpdated = () => {
    if (!lastUpdated) return "N/A";
    
    // If it's a Firestore Timestamp (has .toDate)
    if (lastUpdated.toDate) {
      return lastUpdated.toDate().toLocaleString();
    }
    
    // If it's already a JS Date
    if (lastUpdated instanceof Date) {
      return lastUpdated.toLocaleString();
    }
  
    // Otherwise, fallback
    return "N/A";
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // 1. Load admin preferences
        const prefs = await getAdminPreferences();
        if (isMounted && prefs?.defaultCurrency) {
          setDefaultCurrency(prefs.defaultCurrency);
        }

        // 2. Load exchange rates doc (auto-refresh if needed)
        const exData = await getExchangeRatesSettings();
        if (isMounted && exData) {
          setAutoUpdateEnabled(exData.autoUpdateEnabled || false);
          setRefreshPeriodDays(exData.refreshPeriodDays || 7);
          setRates(exData.rates || {});
          setLastUpdated(exData.lastUpdated);
        }
      } catch (error) {
        console.error("Error loading admin settings:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // -------------------------------
  // Admin default currency
  // -------------------------------
  const handleSaveAdminPrefs = async () => {
    try {
      await updateAdminPreferences({ defaultCurrency });
      alert("Admin default currency updated!");
    } catch (err) {
      console.error("Failed to update admin preferences:", err);
      alert("Error saving admin preferences.");
    }
  };

  // -------------------------------
  // Exchange Rates: Handlers
  // -------------------------------
  const handleToggleAutoUpdate = (e) => {
    setAutoUpdateEnabled(e.target.checked);
  };

  const handleRateChange = (currency, newValue) => {
    setRates((prev) => ({
      ...prev,
      [currency]: parseFloat(newValue) || 0,
    }));
  };

  // NEW: Update refreshPeriodDays as user types
  const handleRefreshPeriodChange = (e) => {
    setRefreshPeriodDays(parseInt(e.target.value, 10) || 1);
  };

  // Save doc changes (autoUpdateEnabled, refreshPeriodDays, rates, etc.)
  const handleSaveExchangeRates = async () => {
    try {
      const newData = {
        autoUpdateEnabled,
        refreshPeriodDays,
        rates,
        lastUpdated: lastUpdated || new Date(), // if we haven't had one yet
      };
      await updateExchangeRatesSettings(newData);
      alert("Exchange rates updated!");
    } catch (error) {
      console.error("Failed to update exchange rates:", error);
      alert("Error saving exchange rates.");
    }
  };

  // Manual "Refresh Now" - calls forceRefreshRates
  const handleForceRefresh = async () => {
    try {
      const updatedData = await forceRefreshRates();
      setRates(updatedData.rates || {});
      setLastUpdated(updatedData.lastUpdated);
      alert("Rates successfully refreshed from ExchangeRate-API!");
    } catch (err) {
      console.error("Failed to force refresh rates:", err);
      alert("Error refreshing rates.");
    }
  };

  // -------------------------------
  // Modal: Add/Remove Currency
  // -------------------------------
  const handleOpenCurrencyModal = async () => {
    setShowCurrencyModal(true);
    setLoadingCurrencies(true);

    try {
      // fetch all supported currency codes
      const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/codes`;
      const response = await fetch(url);
      const data = await response.json();

      if (data?.supported_codes) {
        setAllCurrencies(data.supported_codes);
        const newSelected = {};
        data.supported_codes.forEach(([code]) => {
          newSelected[code] = Boolean(rates[code]);
        });
        setSelectedCurrencies(newSelected);
      } else {
        console.error("Unexpected response:", data);
      }
    } catch (err) {
      console.error("Error fetching currency codes:", err);
    } finally {
      setLoadingCurrencies(false);
    }
  };

  const handleCloseCurrencyModal = () => {
    setShowCurrencyModal(false);
  };

  const handleCurrencyCheckbox = (code) => {
    setSelectedCurrencies((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const handleConfirmCurrencies = async () => {
    // Build an array of codes that are checked
    const finalSelected = Object.entries(selectedCurrencies)
      .filter(([, checked]) => checked)
      .map(([code]) => code);
  
    // Save that array to Firestore
    await updateExchangeRatesSettings({
      selectedCurrencies: finalSelected
    });
  
    // Optionally force refresh immediately to see new rates
    // const updatedData = await forceRefreshRates();
    // setRates(updatedData.rates);
    
    setShowCurrencyModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-nosco-red">Loading Admin Settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-nosco-red mb-6">
          Admin Settings
        </h1>

        {/* CARD 1: Admin Default Currency */}
        <div className="bg-white rounded shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-nosco-text mb-4 border-b border-gray-200 pb-2">
            Admin Default Currency
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
            <label htmlFor="defaultCurrency" className="font-medium text-nosco-text">
              Default Currency:
            </label>
            <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                >
                {currencyOptions.length === 0 ? (
                    <option disabled>No currencies selected</option>
                ) : (
                    currencyOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                    ))
                )}
            </select>
          </div>
          <button
            className="bg-nosco-red hover:bg-nosco-red-dark text-white font-semibold py-2 px-4 rounded shadow"
            onClick={handleSaveAdminPrefs}
          >
            Save Default Currency
          </button>
        </div>

        {/* CARD 2: Exchange Rates */}
        <div className="bg-white rounded shadow-md p-6">
          <h2 className="text-xl font-semibold text-nosco-text mb-4 border-b border-gray-200 pb-2">
            Exchange Rates
          </h2>

          {/* Auto Update Toggle */}
          <div className="mb-4 flex items-center gap-3">
            <input
              type="checkbox"
              id="autoUpdateEnabled"
              className="h-5 w-5 accent-nosco-red"
              checked={autoUpdateEnabled}
              onChange={handleToggleAutoUpdate}
            />
            <label htmlFor="autoUpdateEnabled" className="font-medium text-nosco-text">
              Auto-update enabled?
            </label>
          </div>

          {/* Refresh Period Days */}
          <div className="mb-4 flex items-center gap-3">
            <label htmlFor="refreshPeriodDays" className="font-medium text-nosco-text">
              Refresh Interval (days):
            </label>
            <input
              type="number"
              id="refreshPeriodDays"
              className="w-20 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-nosco-red"
              value={refreshPeriodDays}
              onChange={handleRefreshPeriodChange}
              min={1}
            />
            <span className="text-sm text-gray-600">
              (Auto update will check if {refreshPeriodDays} days have passed since last update)
            </span>
          </div>

          {/* RATES TABLE (always visible, read-only if autoUpdateEnabled) */}
          <div className="mb-4">
            <p className="text-nosco-text mb-2 text-sm sm:text-base">
              {autoUpdateEnabled
                ? "Auto-update is enabled. Rates shown below are read-only, updated automatically."
                : "Auto-update is disabled. You can manually edit the rates below."
              }
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 border-b border-gray-200">Currency</th>
                    <th className="px-4 py-2 border-b border-gray-200">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(rates).map(([currency, rate]) => (
                    <tr key={currency}>
                      <td className="px-4 py-2 border-b border-gray-200 text-nosco-text">
                        {currency}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-200">
                        <input
                          type="number"
                          step="0.0001"
                          disabled={autoUpdateEnabled}
                          className={`w-24 p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 ${
                            autoUpdateEnabled
                              ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                              : "focus:ring-nosco-red"
                          }`}
                          value={rate}
                          onChange={(e) => handleRateChange(currency, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Always show Add/Remove Currency */}
          <div className="flex items-center gap-4 mb-4">
            <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded shadow"
                onClick={handleOpenCurrencyModal}
            >
                Add/Remove Currency
            </button>

            {/* Only hide "Save Exchange Rates" if you'd prefer to keep that 
                manual editing strictly for auto-update=off. 
                But if you want to keep that too, so be it. */}
            {!autoUpdateEnabled && (
                <button
                className="bg-nosco-red hover:bg-nosco-red-dark text-white font-semibold py-2 px-4 rounded shadow"
                onClick={handleSaveExchangeRates}
                >
                Save Exchange Rates
                </button>
            )}
          </div>

          {/* Force Refresh Button (always shown) */}
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow"
            onClick={handleForceRefresh}
          >
            Refresh Now (API)
          </button>

          {/* Last Updated Info */}
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-3">
                Last Updated: {formatLastUpdated()}
            </p>
          )}
        </div>
      </div>

      {/* MODAL for Add/Remove Currency */}
      <Modal
        isOpen={showCurrencyModal}
        onClose={handleCloseCurrencyModal}
        title="Add or Remove Currencies"
      >
        <div className="p-4">
          {loadingCurrencies ? (
            <p>Loading currency list...</p>
          ) : (
            <>
              <p className="text-sm mb-4">
                Select the currencies you want to track (checked = included):
              </p>
              <div className="max-h-72 overflow-y-auto border rounded p-2 mb-4">
                {allCurrencies.map(([code, name]) => (
                  <label
                    key={code}
                    className="flex items-center gap-2 mb-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-nosco-red"
                      checked={selectedCurrencies[code] || false}
                      onChange={() => handleCurrencyCheckbox(code)}
                    />
                    <span className="text-gray-700 text-sm">
                      {code} - {name}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  onClick={handleCloseCurrencyModal}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-nosco-red hover:bg-nosco-red-dark text-white rounded"
                  onClick={handleConfirmCurrencies}
                >
                  Confirm
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminSettingsPage;
