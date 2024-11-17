import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { storage, firestore } from '../../firebase/firebase_config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import DatePicker from '../common/DatePicker';
import InputField from '../common/InputField';
import SelectDropdown from '../common/SelectDropdown';
import Button from '../common/Button';

const SubmitExpenseForm = ({ currentProject, onSubmitSuccess }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [uploading, setUploading] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');

  const { user } = useAuth();

  const expenseTypes = [
    { value: 'transportation', label: 'Transportation' },
    { value: 'meals', label: 'Meals & Entertainment' },
    { value: 'accommodation', label: 'Accommodation' },
    { value: 'supplies', label: 'Office Supplies' },
    { value: 'other', label: 'Other' }
  ];

  const currencies = [
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'JPY', label: 'JPY' }
  ];

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    setReceipts(prev => [...prev, ...files]);
  };

  const uploadReceipts = async () => {
    const uploadPromises = receipts.map(async (file) => {
      const storageRef = ref(storage, `receipts/${user.uid}/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      return getDownloadURL(snapshot.ref);
    });
    return Promise.all(uploadPromises);
  };

  const onSubmit = async (data) => {
    try {
      setUploading(true);
      const receiptUrls = await uploadReceipts();

      const expenseData = {
        userID: user.uid,
        projectID: currentProject?.id || null,
        expenseType: data.expenseType,
        date: Timestamp.fromDate(new Date(data.date)),
        amount: parseFloat(data.amount),
        currency: data.currency,
        description: data.description,
        receipts: receiptUrls,
        status: 'pending',
        createdAt: Timestamp.now(),
        pointsAwarded: null
      };

      const expensesRef = collection(firestore, 'expenses');
      await addDoc(expensesRef, expenseData);

      reset();
      setReceipts([]);
      setPreviewUrls([]);
      onSubmitSuccess?.();
    } catch (error) {
      console.error('Error submitting expense:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <SelectDropdown
        label="Expense Type"
        options={expenseTypes}
        {...register('expenseType', { required: 'Expense type is required' })}
        error={errors.expenseType}
      />

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
            // If using react-hook-form
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

        <SelectDropdown
          label="Currency"
          options={currencies}
          {...register('currency', { required: 'Currency is required' })}
          error={errors.currency}
        />
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
                    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
                    setReceipts(prev => prev.filter((_, i) => i !== index));
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
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
        disabled={uploading}
        className="w-full"
      >
        {uploading ? 'Submitting...' : 'Submit Expense Claim'}
      </Button>
    </form>
  );
};

export default SubmitExpenseForm;