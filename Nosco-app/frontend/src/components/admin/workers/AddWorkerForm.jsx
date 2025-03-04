// src/components/admin/workers/AddWorkerForm.jsx
import React, { useState } from 'react';
import { adminUserService } from '../../../services/adminUserService';
import Modal from '../../common/Modal';

const AddWorkerForm = ({ isOpen, onClose, onWorkerAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    position: '',
    baseRate: '',
    otRate15: '',
    otRate20: '',
    currency: 'USD',
    defaultPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await adminUserService.createWorker(formData);
      onWorkerAdded();
      onClose();
    } catch (err) {
      setError('Failed to create worker. Please try again.');
      console.error('Error creating worker:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Worker">
      <div className="px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">Select Department</option>
              <option value="Engineering">Engineering</option>
              <option value="Operations">Operations</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          {/* Wage Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Rate
              </label>
              <input
                type="number"
                step="0.01"
                name="baseRate"
                value={formData.baseRate}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
                placeholder="e.g. 15.00"
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
                className="w-full px-3 py-2 border rounded"
              >
                <option value="USD">USD</option>
                <option value="SGD">SGD</option>
                <option value="MYR">MYR</option>
                {/* Add more currencies as needed */}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Overtime 1.5 Rate
              </label>
              <input
                type="number"
                step="0.01"
                name="otRate15"
                value={formData.otRate15}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
                placeholder="e.g. 22.50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Overtime 2.0 Rate
              </label>
              <input
                type="number"
                step="0.01"
                name="otRate20"
                value={formData.otRate20}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
                placeholder="e.g. 30.00"
              />
            </div>
          </div>

          {/* Default Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Password
            </label>
            <input
              type="text"
              name="defaultPassword"
              value={formData.defaultPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              placeholder="(Optional) Not recommended"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Form Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-nosco-red rounded hover:bg-nosco-red-dark disabled:bg-nosco-red/70"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Worker'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddWorkerForm;
