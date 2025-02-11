// src/pages/worker/WorkerSettingsPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../firebase/firebase_config';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';

import {
  getWorkerBankAccounts,
  updateWorkerBankAccounts
} from '../../services/workerSettingsService';

// For the little up/down icons
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const WorkerSettingsPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Bank Accounts
  const [bankAccounts, setBankAccounts] = useState([]);
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(false);

  // Whether or not to show the “Add New Bank Account” form
  const [showAddForm, setShowAddForm] = useState(false);

  // New account form
  const [newAccount, setNewAccount] = useState({
    id: '',
    bankName: '',
    accountNumber: '',
    currency: 'USD',
    routingNumber: '',
    swiftBic: '',
    isDefault: false
  });

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      loadBankAccounts(user.uid);
    }
  }, [user, loading, navigate]);

  // -------------------------------
  // Bank Accounts Logic
  // -------------------------------
  const loadBankAccounts = async (uid) => {
    try {
      setFetching(true);
      const accounts = await getWorkerBankAccounts(uid);
      setBankAccounts(accounts);
    } catch (err) {
      console.error('Error loading bank accounts:', err);
      setError('Failed to load bank accounts.');
    } finally {
      setFetching(false);
    }
  };

  const handleAddBankAccount = async () => {
    if (!newAccount.bankName || !newAccount.accountNumber) {
      alert('Bank Name and Account Number are required!');
      return;
    }
    try {
      setFetching(true);
      const updated = [...bankAccounts];

      // Generate an ID if needed
      const randomId = `bank-${Date.now()}`;
      const finalId = newAccount.id || randomId;

      // If this new account is marked default, unset default on all others:
      if (newAccount.isDefault) {
        updated.forEach(acct => { acct.isDefault = false; });
      }

      updated.push({
        ...newAccount,
        id: finalId
      });

      await updateWorkerBankAccounts(user.uid, updated);
      setBankAccounts(updated);

      // Reset form & hide it again if you like
      setNewAccount({
        id: '',
        bankName: '',
        accountNumber: '',
        currency: 'USD',
        routingNumber: '',
        swiftBic: '',
        isDefault: false
      });
      setShowAddForm(false); // Optionally collapse the form on success
    } catch (err) {
      console.error('Error adding bank account:', err);
      setError('Failed to add bank account.');
    } finally {
      setFetching(false);
    }
  };

  // Deleting an account actually removes it from the array
  const handleDeleteBankAccount = async (acctId) => {
    try {
      setFetching(true);
      const updated = bankAccounts.filter((acct) => acct.id !== acctId);
      await updateWorkerBankAccounts(user.uid, updated);
      setBankAccounts(updated);
    } catch (err) {
      console.error('Error deleting bank account:', err);
      setError('Failed to delete bank account.');
    } finally {
      setFetching(false);
    }
  };

  // Setting default
  const handleSetDefault = async (acctId) => {
    try {
      setFetching(true);
      const updated = bankAccounts.map(acct =>
        acct.id === acctId ? { ...acct, isDefault: true } : { ...acct, isDefault: false }
      );
      await updateWorkerBankAccounts(user.uid, updated);
      setBankAccounts(updated);
    } catch (err) {
      console.error('Error setting default bank account:', err);
      setError('Failed to set default bank account.');
    } finally {
      setFetching(false);
    }
  };

  // -------------------------------
  // Password Change Logic
  // -------------------------------
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPwdError('All password fields are required.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwdError('New passwords do not match.');
      return;
    }
    try {
      // Re-auth user
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);

      // Now update password
      await updatePassword(auth.currentUser, newPassword);
      setPwdSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error('Error changing password:', err);
      setPwdError(err.message || 'Failed to change password.');
    }
  };

  if (fetching) {
    return <div className="p-4 text-nosco-red">Processing...</div>;
  }
  if (!user) {
    return <div className="p-4">Please log in to access Settings.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-4">
      {error && <div className="text-red-600 mb-4">{error}</div>}

      <h1 className="text-3xl font-bold text-nosco-red mb-8">
        Worker Settings
      </h1>

      {/* ----------------------------- */}
      {/* Bank Accounts Section */}
      {/* ----------------------------- */}
      <section className="bg-white shadow-md rounded p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Bank Accounts</h2>

        {/* List existing accounts */}
        <div className="mb-4 space-y-2">
          {bankAccounts.map((acct) => (
            <div
              key={acct.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 py-2"
            >
              <div>
                <span className="font-semibold">{acct.bankName}</span> -{' '}
                <span>{acct.accountNumber}</span>
                {acct.isDefault && (
                  <span className="ml-2 text-sm font-medium text-green-600">
                    (Default)
                  </span>
                )}
                <div className="text-sm text-gray-600">
                  Currency: {acct.currency} | Routing: {acct.routingNumber}
                  {acct.swiftBic ? ` | Swift BIC: ${acct.swiftBic}` : ''}
                </div>
              </div>
              <div className="mt-2 md:mt-0 flex gap-3">
                {!acct.isDefault && (
                  <button
                    onClick={() => handleSetDefault(acct.id)}
                    className="bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded transition duration-300"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleDeleteBankAccount(acct.id)}
                  className="bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded transition duration-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {bankAccounts.length === 0 && (
            <p className="text-gray-500">No bank accounts yet.</p>
          )}
        </div>

        {/* Toggle Add Form button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-nosco-red hover:bg-nosco-red-dark text-white py-2 px-4 rounded transition duration-300"
        >
          {showAddForm ? 'Hide New Account Form' : 'Add New Bank Account'}
          {showAddForm ? <FaChevronUp /> : <FaChevronDown />}
        </button>

        {/* Conditionally render the add-account form */}
        {showAddForm && (
          <div className="mt-6 bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="text-xl font-semibold mb-2">New Bank Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bank Name */}
              <div>
                <label className="block mb-1 font-medium">Bank Name</label>
                <input
                  type="text"
                  className="border p-2 w-full rounded"
                  value={newAccount.bankName}
                  onChange={(e) =>
                    setNewAccount((prev) => ({
                      ...prev,
                      bankName: e.target.value
                    }))
                  }
                />
              </div>
              {/* Account Number */}
              <div>
                <label className="block mb-1 font-medium">Account Number</label>
                <input
                  type="text"
                  className="border p-2 w-full rounded"
                  value={newAccount.accountNumber}
                  onChange={(e) =>
                    setNewAccount((prev) => ({
                      ...prev,
                      accountNumber: e.target.value
                    }))
                  }
                />
              </div>
              {/* Routing Number */}
              <div>
                <label className="block mb-1 font-medium mt-2">
                  Routing Number
                </label>
                <input
                  type="text"
                  className="border p-2 w-full rounded"
                  value={newAccount.routingNumber}
                  onChange={(e) =>
                    setNewAccount((prev) => ({
                      ...prev,
                      routingNumber: e.target.value
                    }))
                  }
                />
              </div>
              {/* Swift BIC (optional) */}
              <div>
                <label className="block mb-1 font-medium mt-2">
                  Swift BIC (Optional)
                </label>
                <input
                  type="text"
                  className="border p-2 w-full rounded"
                  value={newAccount.swiftBic}
                  onChange={(e) =>
                    setNewAccount((prev) => ({
                      ...prev,
                      swiftBic: e.target.value
                    }))
                  }
                />
              </div>
              {/* Currency */}
              <div>
                <label className="block mb-1 font-medium mt-2">Currency</label>
                <input
                  type="text"
                  className="border p-2 w-full rounded"
                  value={newAccount.currency}
                  onChange={(e) =>
                    setNewAccount((prev) => ({
                      ...prev,
                      currency: e.target.value
                    }))
                  }
                />
              </div>
              {/* isDefault */}
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="isDefault"
                  className="h-4 w-4 accent-nosco-red mr-2"
                  checked={newAccount.isDefault}
                  onChange={(e) =>
                    setNewAccount((prev) => ({
                      ...prev,
                      isDefault: e.target.checked
                    }))
                  }
                />
                <label htmlFor="isDefault" className="font-medium">
                  Set as Default?
                </label>
              </div>
            </div>
            <button
              onClick={handleAddBankAccount}
              className="mt-4 bg-nosco-red text-white py-2 px-4 rounded hover:bg-nosco-red-dark transition duration-300"
            >
              Add Bank Account
            </button>
          </div>
        )}
      </section>

      {/* ----------------------------- */}
      {/* Password Change Section */}
      {/* ----------------------------- */}
      <section className="bg-white shadow-md rounded p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Change Password</h2>
        {pwdError && <div className="text-red-500 mb-2">{pwdError}</div>}
        {pwdSuccess && <div className="text-green-500 mb-2">{pwdSuccess}</div>}
        <form onSubmit={handleChangePassword}>
          <div className="mb-4">
            <label className="block mb-2">Current Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">New Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Confirm New Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="bg-nosco-red text-white py-2 px-4 rounded hover:bg-nosco-red-dark transition duration-300"
          >
            Change Password
          </button>
        </form>
      </section>
    </div>
  );
};

export default WorkerSettingsPage;
