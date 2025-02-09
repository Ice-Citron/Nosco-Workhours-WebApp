// src/components/admin/admins/AddAdminForm.jsx
import React, { useState } from 'react';
import { adminUserService } from '../../../services/adminUserService';
import Modal from '../../common/Modal';

const AddAdminForm = ({ isOpen, onClose, onAdminAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    position: '',
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
      await adminUserService.createAdmin(formData);
      onAdminAdded();
      onClose();
    } catch (err) {
      setError('Failed to create admin. Please try again.');
      console.error('Error creating admin:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Admin">
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
              <option value="Operations">Operations</option>
              <option value="Engineering">Engineering</option>
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
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

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
              {loading ? 'Adding...' : 'Add Admin'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddAdminForm;
