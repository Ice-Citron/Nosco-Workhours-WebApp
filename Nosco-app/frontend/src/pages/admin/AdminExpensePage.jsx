// AdminExpensePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminExpenseService } from '../../services/adminExpenseService';
import Button from '../../components/common/Button';
import ExpenseTable from '../../components/admin/expenses/ExpenseApprovalSection/ExpenseTable';
import ExpenseDetailsModal from '../../components/admin/expenses/ExpenseApprovalSection/ExpenseDetailsModal';
import RejectionReasonModal from '../../components/admin/expenses/ExpenseApprovalSection/RejectionReasonModal';
import ExpenseFilterModal from '../../components/admin/expenses/common/ExpenseFilterModal';

const AdminExpensePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailsModalData, setDetailsModalData] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [isBulkRejection, setIsBulkRejection] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  useEffect(() => {
    fetchExpenses();
  }, [statusFilter, activeFilters]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await adminExpenseService.getExpenses({ status: statusFilter, ...activeFilters });
      setExpenses(data);
      setError(null);
      setSelectedIds([]);
    } catch (err) {
      setError('Failed to load expenses');
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (expense) => {
    setDetailsModalData(expense);
  };

  const handleApprove = async (id) => {
    try {
      await adminExpenseService.approveExpense(id, user.uid);
      await fetchExpenses();
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    } catch (err) {
      console.error('Error approving expense:', err);
    }
  };

  const handleReject = (id) => {
    setRejectingId(id);
    setIsBulkRejection(false);
    setShowRejectionModal(true);
  };

  const handleBulkApprove = async () => {
    try {
      setLoading(true);
      await adminExpenseService.bulkApproveExpenses(selectedIds, user.uid);
      await fetchExpenses();
      setSelectedIds([]);
    } catch (err) {
      console.error('Error bulk approving expenses:', err);
      setError('Failed to approve selected expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReject = () => {
    if (selectedIds.length === 0) return;
    setIsBulkRejection(true);
    setShowRejectionModal(true);
  };

  const handleRejectConfirm = async (reason) => {
    try {
      setLoading(true);
      if (isBulkRejection) {
        await adminExpenseService.bulkRejectExpenses(selectedIds, user.uid, reason);
      } else {
        await adminExpenseService.rejectExpense(rejectingId, user.uid, reason);
      }
      await fetchExpenses();
      setSelectedIds([]);
      setShowRejectionModal(false);
      setRejectingId(null);
      setIsBulkRejection(false);
    } catch (err) {
      console.error('Error rejecting expenses:', err);
      setError('Failed to reject expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = async (filters) => {
    setActiveFilters(filters);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nosco-red"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const pendingCount = expenses.filter(exp => exp.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Expense Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pendingCount} pending approval{pendingCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-nosco-red focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              onClick={() => setShowFilterModal(true)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm hover:bg-gray-50"
            >
              {Object.keys(activeFilters).length > 0 ? 'Filters Active' : 'Filters'}
            </button>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 ml-4">
              <span className="text-sm text-gray-500">
                {selectedIds.length} selected
              </span>
              <Button
                onClick={handleBulkApprove}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve Selected
              </Button>
              <Button
                onClick={handleBulkReject}
                className="bg-nosco-red hover:bg-nosco-red-dark"
              >
                Reject Selected
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <ExpenseTable
          expenses={expenses}
          selectedIds={selectedIds}
          onSelect={setSelectedIds}
          onViewDetails={handleViewDetails}
          onApprove={handleApprove}
          onReject={handleReject}
        />

        {expenses.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No expenses found for the selected filter
          </div>
        )}
      </div>

      {detailsModalData && (
        <ExpenseDetailsModal
          isOpen={!!detailsModalData}
          onClose={() => setDetailsModalData(null)}
          expense={detailsModalData}
        />
      )}

      <RejectionReasonModal
        isOpen={showRejectionModal}
        onClose={() => {
          setShowRejectionModal(false);
          setRejectingId(null);
          setIsBulkRejection(false);
        }}
        onConfirm={handleRejectConfirm}
        isBulk={isBulkRejection}
      />

      <ExpenseFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        activeFilters={activeFilters}
      />
    </div>
  );
};

export default AdminExpensePage;