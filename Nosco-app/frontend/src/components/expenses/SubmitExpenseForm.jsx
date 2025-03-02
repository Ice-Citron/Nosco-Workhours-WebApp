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
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import DatePicker from '../common/DatePicker';
import InputField from '../common/InputField';
import SelectDropdown from '../common/SelectDropdown';
import Button from '../common/Button';
import CurrencyInput from '../common/CurrencyInput';
import currencyService from '../../services/currencyService';

const SubmitExpenseForm = ({ currentProject, onSubmitSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm();
  
  const watchExpenseType = watch('expenseType');

  const [uploading, setUploading] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [fullExpenseTypeData, setFullExpenseTypeData] = useState([]);
  const [currencyData, setCurrencyData] = useState({
    amount: '',
    currency: 'USD',
    convertedAmount: 0
  });
  const [validationError, setValidationError] = useState('');

  const { user } = useAuth();

  // Get the selected expense type data
  const selectedExpenseType = watchExpenseType ? 
    fullExpenseTypeData.find(type => type.name === watchExpenseType) : null;

  useEffect(() => {
    const fetchExpenseTypes = async () => {
      try {
        // Get all expense types including their full data
        const expenseTypesRef = collection(firestore, 'expenseTypes');
        const qExp = query(expenseTypesRef, where('isArchived', '==', false));
        const snap = await getDocs(qExp);

        const fullData = snap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        
        setFullExpenseTypeData(fullData);
        
        // Create dropdown options
        const typesList = fullData.map(type => ({ 
          value: type.name, 
          label: type.name 
        }));
        
        setExpenseTypes(typesList);
        console.log('[fetchExpenseTypes] Loaded expenseTypes:', typesList);
      } catch (err) {
        console.error('[fetchExpenseTypes] ERROR:', err);
      }
    };

    const initializeCurrencyService = async () => {
      try {
        await currencyService.initialize();
      } catch (err) {
        console.error('[initializeCurrencyService] ERROR:', err);
      }
    };

    fetchExpenseTypes();
    initializeCurrencyService();
  }, []);

  // Validate the expense amount against policy limit
  useEffect(() => {
    const validateAmount = async () => {
      if (selectedExpenseType && currencyData.amount) {
        // Convert amount to USD
        const amountInUSD = currencyService.convertCurrency(
          parseFloat(currencyData.amount) || 0,
          currencyData.currency,
          'USD'
        );
        
        // Compare with policy limit
        if (amountInUSD > selectedExpenseType.policyLimit) {
          const formattedLimit = currencyService.formatCurrency(selectedExpenseType.policyLimit, 'USD');
          const formattedAmount = currencyService.formatCurrency(amountInUSD, 'USD');
          
          setValidationError(
            `The amount (${formattedAmount}) exceeds the policy limit of ${formattedLimit} for ${selectedExpenseType.name}. Please submit an additional expense note if absolutely necessary and contact the admin to explain why it exceeds normal costs.`
          );
        } else {
          setValidationError('');
        }
      } else {
        setValidationError('');
      }
    };
    
    validateAmount();
  }, [selectedExpenseType, currencyData.amount, currencyData.currency]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    setReceipts((prev) => [...prev, ...files]);
    console.log('[handleFileUpload] Selected files:', files.map(f => f.name));
  };

  const uploadReceipts = async () => {
    if (receipts.length === 0) return [];
    
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
    // Don't submit if there's a validation error
    if (validationError) {
      return;
    }
    
    try {
      setUploading(true);
      console.log('[onSubmit] formData received from react-hook-form:', formData);
      console.log('[onSubmit] currencyData:', currencyData);

      // 1) Upload files to Storage
      const receiptUrls = await uploadReceipts();

      // 2) Build the final expense data
      const expenseDate = formData.date ? new Date(formData.date) : new Date();
      const expenseData = {
        userID: user.uid,
        projectID: currentProject?.id || null,
        expenseType: formData.expenseType,
        date: Timestamp.fromDate(expenseDate),
        amount: currencyData.convertedAmount, // Use converted amount in USD
        currency: 'USD', // Always store as USD
        paid: false,
        originalAmount: parseFloat(currencyData.amount),
        originalCurrency: currencyData.currency,
        description: formData.description || '',
        receipts: receiptUrls,
        status: 'pending',
        createdAt: Timestamp.now(),
        pointsAwarded: null,
        isGeneralExpense: false, // Explicitly set false for non-admin
      };

      console.log('[onSubmit] final expenseData to be added:', expenseData);

      // 3) Save to Firestore
      await addDoc(collection(firestore, 'expense'), expenseData);

      // 4) Reset form & visuals
      reset();
      setReceipts([]);
      setPreviewUrls([]);
      setSelectedDate(''); // Reset the selected date
      setCurrencyData({
        amount: '',
        currency: 'USD',
        convertedAmount: 0
      });
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
        <>
          <SelectDropdown
            label="Expense Type"
            options={expenseTypes}
            {...register('expenseType', { required: 'Expense type is required' })}
            error={errors.expenseType}
          />
          
          {/* Show policy limit if expense type is selected */}
          {selectedExpenseType && (
            <div className="text-sm text-gray-600">
              Policy limit: {currencyService.formatCurrency(selectedExpenseType.policyLimit, 'USD')}
            </div>
          )}
        </>
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

      {/* Currency Input with validation */}
      <div>
        <CurrencyInput
          label="Amount"
          value={currencyData}
          onChange={(data) => setCurrencyData(data)}
          error={errors.currencyData}
          required={true}
        />
        
        {/* Display validation error */}
        {validationError && (
          <div className="mt-2 text-sm text-red-600">
            {validationError}
          </div>
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

      <Button 
        type="submit" 
        disabled={uploading || !!validationError} 
        className={`w-full ${validationError ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {uploading ? 'Submitting...' : 'Submit Expense Claim'}
      </Button>
    </form>
  );
};

export default SubmitExpenseForm;
