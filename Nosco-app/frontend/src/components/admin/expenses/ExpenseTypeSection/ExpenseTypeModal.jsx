import React, { useState, useEffect } from 'react';
import Modal from '../../../common/Modal';
import { adminExpenseService } from '../../../../services/adminExpenseService';

const ExpenseTypeModal = ({ expenseType, onClose, isOpen }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    policyLimit: '',
    currency: 'USD',
    isGeneralExpense: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (expenseType) {
      setFormData({
        name: expenseType.name,
        description: expenseType.description,
        policyLimit: expenseType.policyLimit.toString(),
        currency: expenseType.currency,
        isGeneralExpense: expenseType.isGeneralExpense,
      });
    }
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
      const expenseTypeData = {
        ...formData,
        policyLimit: parseFloat(formData.policyLimit),
      };

      if (expenseType) {
        await adminExpenseService.updateExpenseType(expenseType.id, expenseTypeData);
      } else {
        await adminExpenseService.createExpenseType(expenseTypeData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving expense type:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${expenseType ? 'Edit' : 'Add'} Expense Type`}
    >
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Policy Limit
            </label>
            <input
              type="number"
              name="policyLimit"
              value={formData.policyLimit}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isGeneralExpense"
                checked={formData.isGeneralExpense}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 mr-2"
              />
              <span className="text-sm text-gray-700">Company Expense Type</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-nosco-red text-white rounded hover:bg-nosco-red-dark disabled:opacity-50"
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