// GeneralExpenseModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../../common/Modal';
import { useAuth } from '../../../../context/AuthContext';
import { adminExpenseService } from '../../../../services/adminExpenseService';
import { storage } from '../../../../firebase/firebase_config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import currencyService from '../../../../services/currencyService';

const GeneralExpenseModal = ({ isOpen, onClose, expense, isEditing, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApprovalConfirm, setShowApprovalConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currencies, setCurrencies] = useState([]);
  const [validationError, setValidationError] = useState('');
  
  // For receipt file handling
  const [receipts, setReceipts] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  
  const [formData, setFormData] = useState({
    expenseType: '',
    isGeneralExpense: true,
    userID: '',
    amount: '',
    currency: 'USD',
    description: '',
    date: new Date().toISOString().split('T')[0],
    projectID: '',
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        await currencyService.initialize();
        setCurrencies(currencyService.getCurrencies());
        await loadInitialData();
        
        if (expense && isEditing) {
          setFormData({
            expenseType: expense.expenseType || '',
            isGeneralExpense: expense.isGeneralExpense || true,
            userID: expense.userID || '',
            amount: expense.originalAmount?.toString() || expense.amount?.toString() || '',
            currency: expense.originalCurrency || expense.currency || 'USD',
            date: expense.date?.toDate?.().toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            projectID: expense.projectID || '',
            description: expense.description || '',
          });
          
          const existingReceipts = expense.receipts || [];
          // Set existing receipts for preview
          setPreviewUrls(existingReceipts.map(url => ({ 
            url, 
            isExisting: true 
          })));
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      initialize();
    }
  }, [expense, isEditing, isOpen]);

  // Validate expense amount when expenseType or amount/currency changes
  useEffect(() => {
    const validateAmount = async () => {
      if (formData.expenseType && formData.amount) {
        const result = await adminExpenseService.validateExpenseAmount(
          formData.amount,
          formData.currency,
          formData.expenseType
        );
        
        setValidationError(result.message);
      } else {
        setValidationError('');
      }
    };
    
    validateAmount();
  }, [formData.expenseType, formData.amount, formData.currency]);

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
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFileObjects = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      isExisting: false
    }));
    
    setPreviewUrls(prev => [...prev, ...newFileObjects]);
    setReceipts(prev => [...prev, ...files]);
  };

  const removeReceipt = (index) => {
    const preview = previewUrls[index];
    
    // If it's an existing receipt (from Firestore)
    if (preview.isExisting) {
      setPreviewUrls(prev => prev.filter((_, i) => i !== index));
      // We'll handle removing from Firestore during submit
    } else {
      // New receipt that hasn't been uploaded yet
      setPreviewUrls(prev => prev.filter((_, i) => i !== index));
      setReceipts(prev => prev.filter((_, i) => i !== index));
      
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(preview.url);
    }
  };

  const uploadReceipts = async () => {
    if (receipts.length === 0) return [];
    
    try {
      const uploadPromises = receipts.map(async (file) => {
        const path = `receipts/${user.uid}/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
      });
      
      return Promise.all(uploadPromises);
    } catch (err) {
      console.error('Error uploading receipts:', err);
      throw err;
    }
  };

  const handleSubmit = async (e, action = 'submit') => {
    e.preventDefault();
    
    // Check for validation errors
    if (validationError && action === 'submit') {
      return; // Don't submit if there's a validation error
    }
    
    // If approving and confirmation not shown yet, show confirmation first
    if (action === 'approve' && !showApprovalConfirm) {
      setShowApprovalConfirm(true);
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      // 1. Upload new receipts
      let receiptUrls = [];
      
      // Get existing receipt URLs
      const existingUrls = previewUrls
        .filter(preview => preview.isExisting)
        .map(preview => preview.url);
      
      // Upload new files
      if (receipts.length > 0) {
        const newUploadedUrls = await uploadReceipts();
        receiptUrls = [...existingUrls, ...newUploadedUrls];
      } else {
        receiptUrls = existingUrls;
      }
  
      // 2. Convert amount to USD if needed
      const userAmount = parseFloat(formData.amount);
      const convertedAmount = await adminExpenseService.convertToUSD(
        userAmount,
        formData.currency
      );

      // 3. Prepare expense data
      const expenseData = {
        expenseType: formData.expenseType,
        isGeneralExpense: formData.isGeneralExpense,
        userID: formData.isGeneralExpense ? user.uid : formData.userID,
        amount: convertedAmount, // Converted to USD
        currency: 'USD', // Always store as USD
        originalAmount: userAmount,
        originalCurrency: formData.currency,
        date: new Date(formData.date),
        projectID: formData.projectID || null,
        description: formData.description,
        receipts: receiptUrls,
        status: action === 'reject' ? 'rejected' : 'approved'
      };
  
      // 4. Handle different actions
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

      // 5. Close modal and notify parent
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error handling expense:', error);
    } finally {
      setIsSubmitting(false);
      setShowApprovalConfirm(false);
    }
  };

  const handleRejectClick = () => {
    setShowRejectionInput(true);
  };

  if (loading) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Loading..."
      >
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-nosco-red"></div>
        </div>
      </Modal>
    );
  }

  // Find the selected expense type object to display policy limit
  const selectedExpenseType = expenseTypes.find(type => type.name === formData.expenseType);
  const policyLimit = selectedExpenseType?.policyLimit;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isEditing ? 'Edit' : 'Add'} General Expense`}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Expense Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expense Type <span className="text-red-500">*</span>
          </label>
          <select
            name="expenseType"
            value={formData.expenseType}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-nosco-red appearance-none bg-white"
          >
            <option value="">Select Type</option>
            {expenseTypes.map(type => (
              <option key={type.id} value={type.name}>
                {type.name}
              </option>
            ))}
          </select>
          
          {/* Display policy limit if expense type is selected */}
          {policyLimit && (
            <p className="mt-1 text-xs text-gray-500">
              Policy limit: {currencyService.formatCurrency(policyLimit, 'USD')}
            </p>
          )}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Worker <span className="text-red-500">*</span>
            </label>
            <select
              name="userID"
              value={formData.userID}
              onChange={handleChange}
              required={!formData.isGeneralExpense}
              className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none bg-white"
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
        <div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className={`w-full px-3 py-2 border ${validationError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-nosco-red`}
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
                className={`w-full px-3 py-2 border ${validationError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-nosco-red appearance-none bg-white`}
              >
                {currencies.map(currency => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Display validation error if amount exceeds policy limit */}
          {validationError && (
            <div className="mt-2 text-sm text-red-600">
              {validationError}
            </div>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-nosco-red"
          />
        </div>

        {/* Project */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project
          </label>
          <select
            name="projectID"
            value={formData.projectID}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-nosco-red appearance-none bg-white"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-nosco-red"
          />
        </div>

        {/* Receipts */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Receipts
          </label>
          
          {/* Preview images */}
          {previewUrls.length > 0 && (
            <div className="flex gap-3 flex-wrap mb-4">
              {previewUrls.map((preview, index) => (
                <div key={index} className="relative w-20 h-20">
                  <img
                    src={preview.url}
                    alt={`Receipt ${index + 1}`}
                    className="object-cover w-full h-full rounded border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeReceipt(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* File upload area */}
          <div className="border border-dashed border-gray-300 rounded-md p-6">
            <div className="text-center">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <div className="mt-1 text-sm text-center">
                <label className="text-blue-500 cursor-pointer hover:text-blue-700">
                  Upload receipts
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    multiple
                    accept="image/*,.pdf"
                  />
                </label>
                <span className="text-gray-500"> or drag and drop</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
            </div>
          </div>
        </div>

        {/* Rejection Reason Input */}
        {showRejectionInput && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-nosco-red"
              placeholder="Please provide a reason for rejection..."
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
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
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
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
                disabled={isSubmitting || !!validationError}
              >
                {isSubmitting ? 'Saving...' : 'Submit'}
              </button>
            )
          )}
        </div>
      </form>
    </Modal>
  );
};

export default GeneralExpenseModal;
