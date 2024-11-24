import React, { useState } from 'react';
import Card from '../../../common/Card';
import GeneralExpenseTable from './GeneralExpenseTable';
import GeneralExpenseModal from './GeneralExpenseModal';
import ExpenseFilterModal from '../common/ExpenseFilterModal';
import ExpenseDetailsModal from '../ExpenseApprovalSection/ExpenseDetailsModal';
import { useAuth } from '../../../../context/AuthContext';
import { adminExpenseService } from '../../../../services/adminExpenseService';

const GeneralExpenseSection = () => {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedExpenseForDetails, setSelectedExpenseForDetails] = useState(null);


  const handleAddClick = () => {
    setIsEditing(false);
    setSelectedExpense(null);
    setShowAddModal(true);
  };

  const handleEditClick = (expense) => {
    setSelectedExpense(expense);
    setIsEditing(true);
    setShowAddModal(true);
  };

  const handleViewDetails = (expense) => {
    setSelectedExpenseForDetails(expense);
    setShowDetailsModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setSelectedExpense(null);
    setIsEditing(false);
    // Refresh the data
    refreshData();
  };

  // Add this function to refresh data
  const refreshData = () => {
    // Reset any filters if needed
    setActiveFilters(prevFilters => ({
      ...prevFilters,
      // Add any specific filter resets if needed
    }));
    
    // Force table components to refresh
    setShowAddModal(false);
    setSelectedExpense(null);
    setIsEditing(false);
  };

  const handleSubmit = async (formData) => {
    try {
      if (isEditing) {
        // Update existing expense
        await adminExpenseService.updateExpense(selectedExpense.id, {
          ...formData,
          updatedAt: new Date(),
          updatedBy: user.uid
        });
      } else {
        // Create new expense
        await adminExpenseService.createExpense({
          ...formData,
          isGeneralExpense: true,
          status: 'approved',
          createdBy: user.uid,
          approvedBy: user.uid,
          approvalDate: new Date()
        });
      }
      setShowAddModal(false);
      setSelectedExpense(null);
      setIsEditing(false);
      // Refresh table data
      // You might want to add a refresh function to your table component
    } catch (error) {
      console.error('Error handling expense:', error);
    }
  };

  const handleApplyFilters = (filters) => {
    // Clean up filters before setting
    const cleanedFilters = {};
    
    if (filters.dateRange?.start || filters.dateRange?.end) {
      cleanedFilters.dateRange = filters.dateRange;
    }
    if (filters.expenseType) {
      cleanedFilters.expenseType = filters.expenseType;
    }
    if (filters.expenseCategory) {
      cleanedFilters.expenseCategory = filters.expenseCategory;
    }
    if (filters.amount?.min || filters.amount?.max) {
      cleanedFilters.amount = filters.amount;
    }

    setActiveFilters(cleanedFilters);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">General Expenses</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage company-wide expenses
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilterModal(true)}
            className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors border border-gray-300"
          >
            Filters
          </button>
          <button
            onClick={handleAddClick}
            className="px-4 py-2 bg-[#8B0000] text-white rounded-lg text-sm hover:bg-[#A52A2A] transition-colors"
          >
            Add General Expense
          </button>
        </div>
      </div>

      {/* Historical Expenses */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-medium mb-4">Historical Expenses</h3>
          <GeneralExpenseTable
            filters={{ ...activeFilters, status: 'approved' }}
            onViewDetails={handleViewDetails}  // Pass this handler
            onEdit={handleEditClick}
            tableType="historical"
          />
        </div>
      </Card>

      {/* Rejected Expenses */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-medium mb-4">Rejected Expenses</h3>
          <GeneralExpenseTable
            filters={{ ...activeFilters, status: 'rejected' }}
            onViewDetails={handleViewDetails}  // Pass this handler
            onEdit={handleEditClick}
            tableType="rejected"
          />
        </div>
      </Card>

      {/* Add your modals */}
      {showAddModal && (
        <GeneralExpenseModal
          isOpen={showAddModal}
          onClose={handleModalClose}
          expense={selectedExpense}
          isEditing={isEditing}
          onSuccess={() => {
            handleModalClose();
            refreshData();
          }}
        />
      )}

      {showDetailsModal && selectedExpenseForDetails && (
        <ExpenseDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedExpenseForDetails(null);
          }}
          expense={selectedExpenseForDetails}
        />
      )}

      {showFilterModal && (
        <ExpenseFilterModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onApplyFilters={handleApplyFilters}
          activeFilters={activeFilters}
        />
      )}
    </div>
  );
};

export default GeneralExpenseSection;