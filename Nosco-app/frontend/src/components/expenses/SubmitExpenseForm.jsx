// src/components/expenses/SubmitExpenseForm.jsx

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { firestore, storage } from '../../firebase/firebase_config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import DatePicker from '../common/DatePicker';
import InputField from '../common/InputField';
import SelectDropdown from '../common/SelectDropdown';
import Button from '../common/Button';

const SubmitExpenseForm = ({ currentProject, onSubmitSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const [uploading, setUploading] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');

  const { user } = useAuth();

  // Store the fetched expense types from Firestore
  const [expenseTypes, setExpenseTypes] = useState([]);
  // Store the possible currencies and exchange rates from settings/exchangeRates
  const [currencies, setCurrencies] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({});

  useEffect(() => {
    const fetchExpenseTypes = async () => {
      try {
        const expenseTypesRef = collection(firestore, 'expenseTypes');
        const qExp = query(expenseTypesRef, where('isArchived', '==', false));
        const snap = await getDocs(qExp);

        const typesList = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return { value: data.name, label: data.name };
        });
        setExpenseTypes(typesList);
        console.log('[fetchExpenseTypes] Loaded expenseTypes:', typesList);
      } catch (err) {
        console.error('[fetchExpenseTypes] ERROR:', err);
      }
    };

    const fetchExchangeRates = async () => {
      try {
        const docRef = doc(firestore, 'settings', 'exchangeRates');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCurrencies(
            (data.selectedCurrencies || []).map((c) => ({ value: c, label: c }))
          );
          setExchangeRates(data.rates || {});
          console.log('[fetchExchangeRates] Loaded exchangeRates:', data.rates);
        } else {
          console.log('[fetchExchangeRates] No document found for exchangeRates.');
        }
      } catch (err) {
        console.error('[fetchExchangeRates] ERROR:', err);
      }
    };

    fetchExpenseTypes();
    fetchExchangeRates();
  }, []);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    setReceipts((prev) => [...prev, ...files]);
    console.log('[handleFileUpload] Selected files:', files.map(f => f.name));
  };

  const uploadReceipts = async () => {
    console.log('[uploadReceipts] user.uid:', user?.uid);
    try {
      const uploadPromises = receipts.map(async (file) => {
        const path = `receipts/${user.uid}/${Date.now()}-${file.name}`;
        console.log(`[uploadReceipts] Uploading file "${file.name}" to path: "${path}"`);

        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        console.log(`[uploadReceipts] Successfully uploaded "${file.name}". URL: ${downloadURL}`);
        return downloadURL;
      });
      return Promise.all(uploadPromises);
    } catch (err) {
      console.error('[uploadReceipts] ERROR uploading receipts:', err);
      throw err;
    }
  };

  const onSubmit = async (formData) => {
    try {
      setUploading(true);
      console.log('[onSubmit] formData received from react-hook-form:', formData);

      // 1) Upload files to Storage
      const receiptUrls = await uploadReceipts();

      // 2) Convert user‐entered amount to USD
      const userAmount = parseFloat(formData.amount || '0');
      const userCurrency = formData.currency;
      let convertedUSD = userAmount;

      if (exchangeRates[userCurrency] && exchangeRates[userCurrency] !== 0) {
        convertedUSD = userAmount / exchangeRates[userCurrency];
      }

      // 3) Build the final expense data
      const expenseData = {
        userID: user.uid,
        projectID: currentProject?.id || null,
        expenseType: formData.expenseType,
        date: Timestamp.fromDate(new Date(formData.date)),
        amount: convertedUSD,
        currency: 'USD',   // always store as USD
        paid: false,
        originalAmount: userAmount,
        originalCurrency: userCurrency,
        description: formData.description || '',
        receipts: receiptUrls,
        status: 'pending',
        createdAt: Timestamp.now(),
        pointsAwarded: null,
        isGeneralExpense: false,   // <-- explicitly set false for non-admin
      };

      console.log('[onSubmit] final expenseData to be added:', expenseData);

      // 4) Save to Firestore
      await addDoc(collection(firestore, 'expense'), expenseData);

      // 5) Reset form & visuals
      reset();
      setReceipts([]);
      setPreviewUrls([]);
      onSubmitSuccess?.();

      console.log('[onSubmit] Successfully submitted expense claim.');
    } catch (error) {
      console.error('[onSubmit] ERROR submitting expense:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Expense Type */}
      {expenseTypes.length > 0 ? (
        <SelectDropdown
          label="Expense Type"
          options={expenseTypes}
          {...register('expenseType', { required: 'Expense type is required' })}
          error={errors.expenseType}
        />
      ) : (
        <p className="text-gray-600">Loading expense types...</p>
      )}

      {currentProject && (
        <div className="bg-gray-50 p-4 rounded">
          <p className="font-medium">{currentProject.name}</p>
          <p className="text-sm text-gray-600">{currentProject.description}</p>
        </div>
      )}

      <DatePicker
        label="Date"
        selected={selectedDate}
        onChange={(value) => {
          setSelectedDate(value);
          // manually inform react-hook-form
          register('date').onChange({ target: { value, name: 'date' } });
        }}
        error={errors.date}
      />

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Amount"
          type="number"
          step="0.01"
          min="0"
          {...register('amount', {
            required: 'Amount is required',
            min: { value: 0, message: 'Amount must be positive' }
          })}
          error={errors.amount}
        />

        {currencies.length > 0 ? (
          <SelectDropdown
            label="Currency"
            options={currencies}
            {...register('currency', { required: 'Currency is required' })}
            error={errors.currency}
          />
        ) : (
          <p className="text-gray-600">Loading currencies...</p>
        )}
      </div>

      <InputField
        label="Description"
        as="textarea"
        {...register('description', { required: 'Description is required' })}
        error={errors.description}
      />

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Receipts
        </label>

        {/* Preview images */}
        {previewUrls.length > 0 && (
          <div className="flex gap-4 flex-wrap">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative w-24 h-24">
                <img
                  src={url}
                  alt={`Receipt ${index + 1}`}
                  className="object-cover w-full h-full rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
                    setReceipts((prev) => prev.filter((_, i) => i !== index));
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* File upload input */}
        <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172
                a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172
                a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8
                m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                <span>Upload receipts</span>
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={uploading} className="w-full">
        {uploading ? 'Submitting...' : 'Submit Expense Claim'}
      </Button>
    </form>
  );
};

export default SubmitExpenseForm;
