// GeneralExpenseModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../../common/Modal';
import { useAuth } from '../../../../context/AuthContext';
import { adminExpenseService } from '../../../../services/adminExpenseService';
import { firestore as storage } from '../../../../firebase/firebase_config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const GeneralExpenseModal = ({ isOpen, onClose, expense, isEditing, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApprovalConfirm, setShowApprovalConfirm] = useState(false);  // Add this state
  
  const [formData, setFormData] = useState({
    expenseType: '',
    isGeneralExpense: true,
    userID: '',
    amount: '',
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    projectID: '',
    description: '',
    receipts: [],
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (expense && isEditing) {
      setFormData({
        expenseType: expense.expenseType || '',
        isGeneralExpense: expense.isGeneralExpense || true,
        userID: expense.userID || '',
        amount: expense.amount?.toString() || '',
        currency: expense.currency || 'USD',
        date: expense.date?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        projectID: expense.projectID || '',
        description: expense.description || '',
        receipts: expense.receipts || [],
      });
    }
  }, [expense, isEditing]);

  const loadInitialData = async () => {
    try {
      const [typesData, workersData, projectsData] = await Promise.all([
        adminExpenseService.getExpenseTypes(),
        adminExpenseService.getWorkers(),
        adminExpenseService.getProjects()
      ]);
      setExpenseTypes(typesData);
      setWorkers(workersData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      setFormData(prev => ({ ...prev, receipts: [...prev.receipts, ...Array.from(files)] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const uploadReceipts = async (files) => {
    const uploadPromises = files.map(async (file) => {
      const storageRef = ref(storage, `receipts/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e, action = 'submit') => {
    e.preventDefault();
    
    // If approving and confirmation not shown yet, show confirmation first
    if (action === 'approve' && !showApprovalConfirm) {
      setShowApprovalConfirm(true);
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const currentDate = new Date();
      let receiptUrls = [];
  
      // Handle receipt uploads
      const newReceipts = formData.receipts.filter(r => r instanceof File);
      if (newReceipts.length > 0) {
        const uploadPromises = newReceipts.map(async (file) => {
          const storageRef = ref(storage, `receipts/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        });
        const uploadedUrls = await Promise.all(uploadPromises);
        receiptUrls = [
          ...formData.receipts.filter(r => typeof r === 'string'),
          ...uploadedUrls
        ];
      } else {
        receiptUrls = formData.receipts.filter(r => typeof r === 'string');
      }
  
      // Prepare expense data
      const expenseData = {
        expenseType: formData.expenseType,
        isGeneralExpense: formData.isGeneralExpense,
        userID: formData.isGeneralExpense ? user.uid : formData.userID, // Set userID based on expense type
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        date: new Date(formData.date),
        projectID: formData.projectID || null,
        description: formData.description,
        receipts: receiptUrls,
        status: action === 'reject' ? 'rejected' : 'approved'
      };
  
      // Add additional fields based on action
      if (action === 'reject') {
        await adminExpenseService.rejectExpense(expense.id, user.uid, rejectionReason);
      } else if (action === 'approve') {
        await adminExpenseService.restoreExpense(expense.id, user.uid);
      } else {
        if (isEditing) {
          await adminExpenseService.updateExpense(expense.id, expenseData, user.uid);
        } else {
          await adminExpenseService.createExpense(expenseData, user.uid);
        }
      }

      // Call onSuccess instead of onClose
      onSuccess?.();
    } catch (error) {
      console.error('Error handling expense:', error);
    } finally {
      setIsSubmitting(false);
      setShowApprovalConfirm(false);
    }
  };


  // Add this function to handle rejection button click
  const handleRejectClick = () => {
    setShowRejectionInput(true);
  };


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isEditing ? 'Edit' : 'Add'} Expense`}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Expense Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expense Type <span className="text-red-500">*</span>
          </label>
          <select
            name="expenseType"
            value={formData.expenseType}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-nosco-red"
          >
            <option value="">Select Type</option>
            {expenseTypes.map(type => (
              <option key={type.id} value={type.name}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {/* General vs Worker Expense Toggle */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              name="isGeneralExpense"
              checked={formData.isGeneralExpense}
              onChange={handleChange}
              className="mr-2 rounded border-gray-300"
            />
            Company Expense
          </label>
        </div>

        {/* Worker Selection (only if not general expense) */}
        {!formData.isGeneralExpense && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Worker <span className="text-red-500">*</span>
            </label>
            <select
              name="userID"
              value={formData.userID}
              onChange={handleChange}
              required={!formData.isGeneralExpense}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Worker</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Amount and Currency */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Project */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project
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

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Receipts */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Receipts
          </label>
          <input
            type="file"
            onChange={(e) => {
              const files = Array.from(e.target.files);
              setFormData(prev => ({
                ...prev,
                receipts: [...prev.receipts, ...files]
              }));
            }}
            multiple
            accept="image/*,.pdf"
            className="w-full"
          />
          {formData.receipts.length > 0 && (
            <div className="mt-2 text-sm text-gray-500">
              {formData.receipts.length} file(s) selected
            </div>
          )}
        </div>

        {/* Rejection Reason Input */}
        {showRejectionInput && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Please provide a reason for rejection..."
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>

          {isEditing && expense?.status === 'approved' && (
            <button
              type="button"
              onClick={handleRejectClick}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reject
            </button>
          )}

          {isEditing && expense?.status === 'rejected' && !showApprovalConfirm && (
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'approve')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Approve
            </button>
          )}

          {showApprovalConfirm && (
            <>
              <div className="text-sm text-gray-600 mr-2">
                Are you sure you want to approve this expense?
              </div>
              <button
                type="button"
                onClick={() => setShowApprovalConfirm(false)}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'approve')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Confirm Approval
              </button>
            </>
          )}

          {showRejectionInput ? (
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'reject')}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              disabled={!rejectionReason.trim()}
            >
              Confirm Rejection
            </button>
          ) : (
            !showApprovalConfirm && (
              <button
                type="submit"
                className="px-4 py-2 bg-[#8B0000] text-white rounded hover:bg-[#A52A2A]"
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Submit'}
              </button>
            )
          )}
        </div>
      </form>
    </Modal>
  );
};

export default GeneralExpenseModal;