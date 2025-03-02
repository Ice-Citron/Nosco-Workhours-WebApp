// src/pages/admin/AdminSettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../firebase/firebase_config';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import {
  getExchangeRatesSettings,
  updateExchangeRatesSettings,
  forceRefreshRates,
  triggerManualBackup,
} from '../../services/adminSettingsService';

const API_KEY = 'd8ec97094877d57688a1391b'; // reference if needed

const AdminSettingsPage = () => {
  const { user } = useAuth();
  // For password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  // For exchange rates
  const [loading, setLoading] = useState(true);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);
  const [refreshPeriodDays, setRefreshPeriodDays] = useState(7);
  const [rates, setRates] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  // For database backup
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupResult, setBackupResult] = useState(null);

  // Whether user is editing rates manually
  const [error, setError] = useState('');
  
  useEffect(() => {
    let isMounted = true;

    const fetchRates = async () => {
      try {
        const exData = await getExchangeRatesSettings();
        if (isMounted && exData) {
          setAutoUpdateEnabled(exData.autoUpdateEnabled || false);
          setRefreshPeriodDays(exData.refreshPeriodDays || 7);
          setRates(exData.rates || {});
          setLastUpdated(exData.lastUpdated);
        }
      } catch (err) {
        console.error('Error fetching exchange rates:', err);
        setError('Failed to load exchange rates data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchRates();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdError('Please fill out all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    try {
      // Re-auth
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      // update
      await updatePassword(auth.currentUser, newPassword);
      setPwdSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error changing admin password:', err);
      setPwdError(err.message || 'Failed to change password.');
    }
  };

  // Exchange Rates Handlers
  const handleToggleAutoUpdate = (e) => {
    setAutoUpdateEnabled(e.target.checked);
  };

  const handleRefreshPeriodChange = (e) => {
    setRefreshPeriodDays(parseInt(e.target.value, 10) || 1);
  };

  const handleRateChange = (currency, val) => {
    setRates((prev) => ({ ...prev, [currency]: parseFloat(val) || 0 }));
  };

  const handleSaveExchangeRates = async () => {
    try {
      await updateExchangeRatesSettings({
        autoUpdateEnabled,
        refreshPeriodDays,
        rates,
        lastUpdated: lastUpdated || new Date()
      });
      alert('Exchange rates updated!');
    } catch (err) {
      console.error('Failed to update exchange rates:', err);
      alert('Error saving exchange rates.');
    }
  };

  const handleForceRefresh = async () => {
    try {
      const updated = await forceRefreshRates();
      setRates(updated.rates || {});
      setLastUpdated(updated.lastUpdated);
      alert('Rates refreshed from the API!');
    } catch (err) {
      console.error('Failed to refresh rates:', err);
      alert('Error refreshing rates.');
    }
  };

  // Database Backup Handler
  const handleTriggerBackup = async () => {
    setBackupLoading(true);
    setBackupResult(null);
    
    try {
      const result = await triggerManualBackup();
      setBackupResult(result);
    } catch (err) {
      console.error('Error triggering backup:', err);
      setBackupResult({
        success: false,
        message: 'Failed to trigger backup. Please try again later.'
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'N/A';
    if (typeof lastUpdated.toDate === 'function') {
      return lastUpdated.toDate().toLocaleString();
    } else if (lastUpdated instanceof Date) {
      return lastUpdated.toLocaleString();
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="p-6 text-nosco-red">
        Loading Admin Settings...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {error && <div className="text-red-600 mb-4">{error}</div>}

      <h1 className="text-3xl font-bold text-nosco-red mb-6">Admin Settings</h1>

      {/* Password Change */}
      <section className="bg-white shadow-md rounded p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Change Password</h2>
        {pwdError && <div className="text-red-500 mb-2">{pwdError}</div>}
        {pwdSuccess && <div className="text-green-500 mb-2">{pwdSuccess}</div>}
        <form onSubmit={handleChangePassword}>
          <div className="mb-4">
            <label className="block mb-1">Current Password</label>
            <input
              type="password"
              className="border p-2 w-full rounded"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">New Password</label>
            <input
              type="password"
              className="border p-2 w-full rounded"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">Confirm New Password</label>
            <input
              type="password"
              className="border p-2 w-full rounded"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="bg-nosco-red text-white py-2 px-4 rounded hover:bg-nosco-red-dark transition"
          >
            Change Password
          </button>
        </form>
      </section>

      {/* Exchange Rates */}
      <section className="bg-white shadow-md rounded p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Exchange Rates</h2>
        <div className="mb-4 flex items-center gap-3">
          <input
            type="checkbox"
            id="autoUpdateEnabled"
            className="h-5 w-5 accent-nosco-red"
            checked={autoUpdateEnabled}
            onChange={handleToggleAutoUpdate}
          />
          <label htmlFor="autoUpdateEnabled" className="font-medium">
            Auto-update enabled?
          </label>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <label htmlFor="refreshPeriodDays" className="font-medium">
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
            Auto update checks if {refreshPeriodDays} days have passed since last update
          </span>
        </div>

        {/* Rates Table */}
        <div className="mb-4">
          <p className="text-sm mb-2">
            {autoUpdateEnabled
              ? 'Auto-update is enabled. Rates are updated automatically and read-only below.'
              : 'Auto-update is disabled. You can edit these rates manually.'
            }
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border-b border-gray-200">Currency</th>
                  <th className="px-4 py-2 border-b border-gray-200">Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(rates).map(([currency, rate]) => (
                  <tr key={currency}>
                    <td className="px-4 py-2 border-b border-gray-200">{currency}</td>
                    <td className="px-4 py-2 border-b border-gray-200">
                      <input
                        type="number"
                        step="0.0001"
                        disabled={autoUpdateEnabled}
                        className={`w-24 p-1 border rounded ${
                          autoUpdateEnabled
                            ? 'bg-gray-100 text-gray-500'
                            : 'focus:outline-none focus:ring-1 focus:ring-nosco-red'
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

        {/* Save / Force Refresh */}
        <div className="flex items-center gap-4">
          {!autoUpdateEnabled && (
            <button
              onClick={handleSaveExchangeRates}
              className="bg-nosco-red text-white py-2 px-4 rounded hover:bg-nosco-red-dark transition"
            >
              Save Exchange Rates
            </button>
          )}
          <button
            onClick={handleForceRefresh}
            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
          >
            Refresh Now (API)
          </button>
        </div>

        {lastUpdated && (
          <p className="text-sm text-gray-500 mt-2">
            Last Updated: {formatLastUpdated()}
          </p>
        )}
      </section>

      {/* Database Backup Section - NEW */}
      <section className="bg-white shadow-md rounded p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Database Backup</h2>
        <p className="mb-4 text-gray-700">
          Database backups are automatically created weekly on Sundays. You can also trigger a manual backup below.
          <br />
          <span className="text-sm text-gray-500">
            Note: A maximum of 2 backups (1 automatic + 1 manual) can exist within a 7-day period.
            If there's already a manual backup, it will be overwritten.
          </span>
        </p>
        
        {backupResult && (
          <div className={`mb-4 p-4 rounded ${backupResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <div className="font-medium">{backupResult.success ? 'Success!' : 'Error:'} {backupResult.message}</div>
            {backupResult.backupPath && (
              <div className="mt-1 text-sm">
                Backup path: {backupResult.backupPath}
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleTriggerBackup}
            disabled={backupLoading}
            className={`bg-nosco-red text-white py-2 px-4 rounded hover:bg-nosco-red-dark transition ${
              backupLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {backupLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Backup...
              </span>
            ) : (
              'Create Manual Backup'
            )}
          </button>
        </div>
        
        <p className="mt-4 text-sm text-gray-500">
          Backups are stored for 90 days according to the retention policy, after which they are automatically deleted.
        </p>
      </section>
    </div>
  );
};

export default AdminSettingsPage;
