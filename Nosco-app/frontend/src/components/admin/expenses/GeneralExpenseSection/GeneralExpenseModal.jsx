// GeneralExpenseModal.jsx
import React, { useState, useEffect } from 'react';
import { adminExpenseService } from '../../../../services/adminExpenseService';

const GeneralExpenseModal = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    expenseType: '',
    amount: '',
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    description: '',
    projectID: '',
    receipts: []
  });
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadFormOptions();
  }, []);

  const loadFormOptions = async () => {
    try {
      const [types, projectsList] = await Promise.all([
        adminExpenseService.getExpenseTypes(),
        adminExpenseService.getProjects()
      ]);
      setExpenseTypes(types.filter(type => type.isGeneralExpense));
      setProjects(projectsList);
    } catch (error) {
      console.error('Error loading form options:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      receipts: [...prev.receipts, ...files]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        ...formData,
        isGeneralExpense: true,
        status: 'approved' // Auto-approve general expenses
      });
    } catch (error) {
      console.error('Error submitting general expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center m-0">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Add General Expense</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expense Type
              </label>
              <select
                name="expenseType"
                value={formData.expenseType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Type</option>
                {expenseTypes.map(type => (
                  <option key={type.id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                  step="0.01"
                  required
                />
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project (Optional)
              </label>
              <select
                name="projectID"
                value={formData.projectID}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">No Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
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
                Receipts
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full"
                multiple
                accept="image/*,.pdf"
              />
              {formData.receipts.length > 0 && (
                <div className="mt-2 text-sm text-gray-500">
                  {formData.receipts.length} file(s) selected
                </div>
              )}
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
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GeneralExpenseModal;