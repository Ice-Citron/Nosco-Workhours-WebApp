import React, { useState } from 'react';
import { adminPaymentService } from '../../../services/adminPaymentService';
import { useAuth } from '../../../context/AuthContext';
import { Card } from "@/components/ui/card";

const CreatePaymentSection = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    userID: '',
    paymentType: '',
    amount: '',
    currency: 'USD',
    description: '',
    projectID: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await adminPaymentService.createPayment({
        ...formData,
        amount: parseFloat(formData.amount),
        status: 'pending',
        createdBy: user.uid,
        comments: {
          text: `Payment created: ${formData.description}`,
          userID: user.uid,
          createdAt: new Date()
        }
      });

      // Reset form
      setFormData({
        userID: '',
        paymentType: '',
        amount: '',
        currency: 'USD',
        description: '',
        projectID: '',
        date: new Date().toISOString().split('T')[0],
      });

    } catch (error) {
      console.error('Error creating payment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Create New Payment</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Worker ID</label>
            <input
              type="text"
              value={formData.userID}
              onChange={(e) => setFormData(prev => ({ ...prev, userID: e.target.value }))}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Type</label>
            <select
              value={formData.paymentType}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentType: e.target.value }))}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Type</option>
              <option value="salary">Salary</option>
              <option value="bonus">Bonus</option>
              <option value="expenseReimbursement">Expense Reimbursement</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
              step="0.01"
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Project ID</label>
            <input
              type="text"
              value={formData.projectID}
              onChange={(e) => setFormData(prev => ({ ...prev, projectID: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            required
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300"
          >
            {loading ? 'Creating...' : 'Create Payment'}
          </button>
        </div>
      </form>
    </Card>
  );
};

export default CreatePaymentSection;