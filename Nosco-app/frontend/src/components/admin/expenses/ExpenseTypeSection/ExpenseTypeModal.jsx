import React, { useState, useEffect } from 'react';
import Modal from '../../../common/Modal';
import { adminExpenseService } from '../../../../services/adminExpenseService';
import currencyService from '../../../../services/currencyService';

const ExpenseTypeModal = ({ expenseType, onClose, isOpen }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    policyLimit: '',
    currency: 'USD',
    isGeneralExpense: false,
  });
  const [currencies, setCurrencies] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        // Initialize currency service
        await currencyService.initialize();
        setCurrencies(currencyService.getCurrencies());
        
        // If editing an existing type, populate the form
        if (expenseType) {
          setFormData({
            name: expenseType.name || '',
            description: expenseType.description || '',
            policyLimit: expenseType.policyLimit?.toString() || '',
            currency: expenseType.currency || 'USD',
            isGeneralExpense: expenseType.isGeneralExpense || false,
          });
        }
      } catch (error) {
        console.error('Error initializing:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [expenseType]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert policy limit to a number
      const policyLimit = parseFloat(formData.policyLimit);
      
      if (isNaN(policyLimit)) {
        throw new Error('Policy limit must be a valid number');
      }

      // Create the expense type data object
      const expenseTypeData = {
        ...formData,
        policyLimit: policyLimit,
      };

      // Save to Firestore
      if (expenseType) {
        await adminExpenseService.updateExpenseType(expenseType.id, expenseTypeData);
      } else {
        await adminExpenseService.createExpenseType(expenseTypeData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving expense type:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Loading...">
        <div className="p-6 text-center">Loading expense type data...</div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${expenseType ? 'Edit' : 'Add'} Expense Type`}
    >
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              rows="4"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Limit
              </label>
              <input
                type="number"
                name="policyLimit"
                value={formData.policyLimit}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none bg-white"
                required
              >
                {currencies.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-4">
              Maximum amount that can be claimed for this expense type
            </p>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                name="isGeneralExpense"
                id="isGeneralExpense"
                checked={formData.isGeneralExpense}
                onChange={handleChange}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="isGeneralExpense" className="font-medium text-gray-700">
                Company Expense Type
              </label>
              <p className="text-gray-500">
                If checked, this expense type will be available for company expenses only
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 border-t pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-[#8B0000] rounded-md hover:bg-[#A52A2A] disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ExpenseTypeModal;