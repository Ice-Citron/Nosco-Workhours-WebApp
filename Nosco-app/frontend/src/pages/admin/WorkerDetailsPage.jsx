// src/pages/admin/WorkerDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { adminUserService } from '../../services/adminUserService';
// If you're using currency logic:
import {
  getExchangeRatesSettings,
  convertBetweenCurrencies,
} from '../../services/adminSettingsService';

const WorkerDetailsPage = () => {
  const { workerId } = useParams();

  // Firestore data
  const [worker, setWorker] = useState(null);
  const [error, setError] = useState(null);

  // UI states
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // formData holds all worker fields for editing
  const [formData, setFormData] = useState({});

  // Currency-related states for compensation
  const [availableCurrencies, setAvailableCurrencies] = useState(['USD']);
  const [compCurrency, setCompCurrency] = useState('USD');
  const [baseRateDisplay, setBaseRateDisplay] = useState(0);
  const [perDiemDisplay, setPerDiemDisplay] = useState(0);

  // -----------------------
  // 1) Fetch Worker + Rates
  // -----------------------
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        // 1) Grab worker data
        const data = await adminUserService.getWorkerDetails(workerId);
        setWorker(data);
        setFormData(data);

        // 2) Grab exchange rates doc
        const exSettings = await getExchangeRatesSettings();
        if (exSettings?.selectedCurrencies?.length > 0) {
          setAvailableCurrencies(exSettings.selectedCurrencies);
        }

        // 3) If doc stores compensation as numeric in USD,
        //    we can display in the doc's .currency or fallback 'USD'.
        const docCurrency = data?.compensation?.currency || 'USD';
        setCompCurrency(docCurrency);

        const br = Number(data?.compensation?.baseRate) || 0;
        const pd = Number(data?.compensation?.perDiem) || 0;

        if (docCurrency !== 'USD') {
          // Convert from stored USD → docCurrency for UI
          const convertedBR = await convertBetweenCurrencies(br, 'USD', docCurrency);
          const convertedPD = await convertBetweenCurrencies(pd, 'USD', docCurrency);
          setBaseRateDisplay(convertedBR);
          setPerDiemDisplay(convertedPD);
        } else {
          // doc is truly in USD, just show raw numbers
          setBaseRateDisplay(br);
          setPerDiemDisplay(pd);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load worker or exchange rates.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [workerId]);

  // -----------------------
  // Archive / Re-activate
  // -----------------------
  const handleArchiveToggle = async () => {
    try {
      setLoading(true);
      // If the worker is active, set archived; if archived, set active
      const newStatus = worker.status === 'active' ? 'archived' : 'active';
      await adminUserService.updateWorkerStatus(worker.id, newStatus);

      // Re-fetch
      const updated = await adminUserService.getWorkerDetails(workerId);
      setWorker(updated);
      setFormData(updated);

      // If we just re-activated, you might want to reset the UI accordingly
    } catch (err) {
      console.error('Error updating worker status:', err);
      setError('Failed to update worker status.');
    } finally {
      setLoading(false);
    }
  };

  // -----------------------
  // Edit / Save
  // -----------------------
  const handleEditToggle = () => {
    setEditMode((prev) => !prev);
  };

  const handleChange = (e, path) => {
    const value = e.target.value;
    if (!path.includes('.')) {
      setFormData((prev) => ({ ...prev, [path]: value }));
      return;
    }
    const [parentKey, childKey] = path.split('.');
    setFormData((prev) => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value,
      },
    }));
  };

  // For numeric fields in the local displayed currency
  const handleBaseRateInput = (e) => {
    setBaseRateDisplay(parseFloat(e.target.value) || 0);
  };
  const handlePerDiemInput = (e) => {
    setPerDiemDisplay(parseFloat(e.target.value) || 0);
  };

  const handleCurrencyChange = async (newCurrency) => {
    try {
      const convertedBR = await convertBetweenCurrencies(baseRateDisplay, compCurrency, newCurrency);
      const convertedPD = await convertBetweenCurrencies(perDiemDisplay, compCurrency, newCurrency);
      setBaseRateDisplay(convertedBR);
      setPerDiemDisplay(convertedPD);
      setCompCurrency(newCurrency);
    } catch (err) {
      console.error('Error converting currency:', err);
      setError('Failed to convert currency.');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Convert local displays (in compCurrency) to USD for Firestore
      const brUSD = await convertBetweenCurrencies(baseRateDisplay, compCurrency, 'USD');
      const pdUSD = await convertBetweenCurrencies(perDiemDisplay, compCurrency, 'USD');

      const updatedComp = {
        ...formData.compensation,
        baseRate: brUSD,
        perDiem: pdUSD,
        currency: compCurrency,
      };
      const updatedData = { ...formData, compensation: updatedComp };

      await adminUserService.updateWorkerDetails(workerId, updatedData);

      // Update local states
      setWorker(updatedData);
      setFormData(updatedData);
      setEditMode(false);
    } catch (err) {
      console.error('Error saving worker details:', err);
      setError('Failed to save changes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    // Reset to original worker data
    setFormData(worker);
  
    // Reset displayed rates (if you’re doing the currency conversions)
    const origBR = Number(worker?.compensation?.baseRate) || 0;
    const origPD = Number(worker?.compensation?.perDiem) || 0;
    const origCur = worker?.compensation?.currency || 'USD';
  
    if (origCur !== 'USD') {
      const brConverted = await convertBetweenCurrencies(origBR, 'USD', origCur);
      const pdConverted = await convertBetweenCurrencies(origPD, 'USD', origCur);
      setBaseRateDisplay(brConverted);
      setPerDiemDisplay(pdConverted);
      setCompCurrency(origCur);
    } else {
      setBaseRateDisplay(origBR);
      setPerDiemDisplay(origPD);
      setCompCurrency('USD');
    }
  
    // Exit edit mode
    setEditMode(false);
  };

  // -----------------------
  // Guards
  // -----------------------
  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!worker) return <div className="p-6">No worker data found.</div>;

  // Quick extracts
  const {
    name = '',
    email = '',
    department = '',
    position = '',
    status = '',
    bankAccounts = [],
    emergencyContact = {},
    joinedDate,
  } = formData;

  // Format joinedDate if Firestore Timestamp
  const joinedDateStr = joinedDate
    ? new Date(joinedDate.seconds * 1000).toLocaleDateString()
    : '';

  // -----------------------
  // Render
  // -----------------------
  return (
    <div className="p-6">
    <h1 className="text-2xl font-semibold mb-4">
      Worker Details: {worker.name}
    </h1>

    {/* Buttons row (Archive, Modify, Save, Cancel) */}
    <div className="flex gap-3 mb-4">
      {status === 'active' && (
        <button
          className="px-4 py-2 bg-red-600 text-white rounded opacity-75"
          onClick={handleArchiveToggle}
        >
          Archive
        </button>
      )}
      {status === 'archived' && (
        <button
          className="px-4 py-2 bg-yellow-500 text-white rounded opacity-75"
          onClick={handleArchiveToggle}
        >
          Re-Activate
        </button>
      )}

      {!editMode && (
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded opacity-75"
          onClick={handleEditToggle}
        >
          Modify
        </button>
      )}
      {editMode && (
        <>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded opacity-75"
            onClick={handleSave}
          >
            Save
          </button>
          <button
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded opacity-75"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </>
      )}
    </div>
  
      {/* Main Grid: 2 columns on md+ screens, 1 column on smaller */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ---- BASIC INFO ---- */}
        <div className="bg-white p-4 rounded shadow space-y-4">
          <h2 className="text-xl font-semibold">Basic Info</h2>
  
          <div>
            <strong>Name:</strong>
            {editMode ? (
              <input
                className="ml-2 border rounded p-1"
                value={name}
                onChange={(e) => handleChange(e, 'name')}
              />
            ) : (
              <span className="ml-2">{name}</span>
            )}
          </div>
  
          <div>
            <strong>Email:</strong>
            {editMode ? (
              <input
                className="ml-2 border rounded p-1"
                value={email}
                onChange={(e) => handleChange(e, 'email')}
              />
            ) : (
              <span className="ml-2">{email}</span>
            )}
          </div>
  
          <div>
            <strong>Department:</strong>
            {editMode ? (
              <input
                className="ml-2 border rounded p-1"
                value={department}
                onChange={(e) => handleChange(e, 'department')}
              />
            ) : (
              <span className="ml-2">{department}</span>
            )}
          </div>
  
          <div>
            <strong>Position:</strong>
            {editMode ? (
              <input
                className="ml-2 border rounded p-1"
                value={position}
                onChange={(e) => handleChange(e, 'position')}
              />
            ) : (
              <span className="ml-2">{position}</span>
            )}
          </div>
  
          <div>
            <strong>Joined Date:</strong>{' '}
            <span className="ml-2">{joinedDateStr || 'N/A'}</span>
          </div>
  
          <div>
            <strong>Status:</strong>{' '}
            <span
              className={`px-2 py-1 rounded ${
                status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {status}
            </span>
          </div>
        </div>
  
        {/* ---- COMPENSATION ---- */}
        <div className="bg-white p-4 rounded shadow space-y-4">
          <h2 className="text-xl font-semibold">Compensation</h2>
  
          <div>
            <strong>Base Rate:</strong>
            {editMode ? (
              <input
                className="ml-2 border rounded p-1"
                type="number"
                step="0.01"
                value={baseRateDisplay}
                onChange={handleBaseRateInput}
              />
            ) : (
              <span className="ml-2">
                {Number(worker.compensation?.baseRate || 0).toFixed(2)} USD
              </span>
            )}
          </div>
  
          <div>
            <strong>Per Diem:</strong>
            {editMode ? (
              <input
                className="ml-2 border rounded p-1"
                type="number"
                step="0.01"
                value={perDiemDisplay}
                onChange={handlePerDiemInput}
              />
            ) : (
              <span className="ml-2">
                {Number(worker.compensation?.perDiem || 0).toFixed(2)} USD
              </span>
            )}
          </div>
  
          <div>
            <strong>Compensation Currency:</strong>
            {editMode ? (
              <select
                className="ml-2 border rounded p-1"
                value={compCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
              >
                {availableCurrencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <span className="ml-2">{worker.compensation?.currency || 'USD'}</span>
            )}
          </div>
        </div>
  
        {/* ---- BANK ACCOUNTS ---- */}
        <div className="bg-white p-4 rounded shadow space-y-4">
          <h2 className="text-xl font-semibold">Bank Accounts</h2>
          {Array.isArray(bankAccounts) && bankAccounts.length > 0 ? (
            bankAccounts.map((acct, idx) => (
              <div
                key={acct.id || idx}
                className="p-3 border border-gray-200 rounded mb-2"
              >
                <div>
                  <strong>Account ID:</strong> {acct.id}
                </div>
                <div>
                  <strong>Bank Name:</strong>{' '}
                  {editMode ? (
                    <input
                      className="ml-1 border rounded p-1"
                      value={acct.bankName || ''}
                      onChange={(e) => {
                        const newArr = [...bankAccounts];
                        newArr[idx] = {
                          ...newArr[idx],
                          bankName: e.target.value,
                        };
                        setFormData((prev) => ({ ...prev, bankAccounts: newArr }));
                      }}
                    />
                  ) : (
                    <span>{acct.bankName}</span>
                  )}
                </div>
                <div>
                  <strong>Account Number:</strong>{' '}
                  {editMode ? (
                    <input
                      className="ml-1 border rounded p-1"
                      value={acct.accountNumber || ''}
                      onChange={(e) => {
                        const newArr = [...bankAccounts];
                        newArr[idx] = {
                          ...newArr[idx],
                          accountNumber: e.target.value,
                        };
                        setFormData((prev) => ({ ...prev, bankAccounts: newArr }));
                      }}
                    />
                  ) : (
                    <span>{acct.accountNumber}</span>
                  )}
                </div>
                <div>
                  <strong>Currency:</strong>{' '}
                  {editMode ? (
                    <input
                      className="ml-1 border rounded p-1"
                      value={acct.currency || ''}
                      onChange={(e) => {
                        const newArr = [...bankAccounts];
                        newArr[idx] = { ...newArr[idx], currency: e.target.value };
                        setFormData((prev) => ({ ...prev, bankAccounts: newArr }));
                      }}
                    />
                  ) : (
                    <span>{acct.currency}</span>
                  )}
                </div>
                <div>
                  <strong>Is Default?</strong>{' '}
                  {editMode ? (
                    <input
                      type="checkbox"
                      checked={!!acct.isDefault}
                      onChange={(e) => {
                        const newArr = [...bankAccounts];
                        newArr[idx] = { ...newArr[idx], isDefault: e.target.checked };
                        setFormData((prev) => ({ ...prev, bankAccounts: newArr }));
                      }}
                    />
                  ) : (
                    <span>{acct.isDefault ? 'Yes' : 'No'}</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div>No bank accounts found.</div>
          )}
        </div>
  
        {/* ---- EMERGENCY CONTACT ---- */}
        <div className="bg-white p-4 rounded shadow space-y-4">
          <h2 className="text-xl font-semibold">Emergency Contact</h2>
          <div>
            <strong>Name:</strong>
            {editMode ? (
              <input
                className="ml-2 border rounded p-1"
                value={emergencyContact.name || ''}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    emergencyContact: {
                      ...prev.emergencyContact,
                      name: e.target.value,
                    },
                  }));
                }}
              />
            ) : (
              <span className="ml-2">{emergencyContact.name || ''}</span>
            )}
          </div>
          <div>
            <strong>Relationship:</strong>
            {editMode ? (
              <input
                className="ml-2 border rounded p-1"
                value={emergencyContact.relationship || ''}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    emergencyContact: {
                      ...prev.emergencyContact,
                      relationship: e.target.value,
                    },
                  }));
                }}
              />
            ) : (
              <span className="ml-2">{emergencyContact.relationship || ''}</span>
            )}
          </div>
          <div>
            <strong>Phone:</strong>
            {editMode ? (
              <input
                className="ml-2 border rounded p-1"
                value={emergencyContact.phone || ''}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    emergencyContact: {
                      ...prev.emergencyContact,
                      phone: e.target.value,
                    },
                  }));
                }}
              />
            ) : (
              <span className="ml-2">{emergencyContact.phone || ''}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};  

export default WorkerDetailsPage;
