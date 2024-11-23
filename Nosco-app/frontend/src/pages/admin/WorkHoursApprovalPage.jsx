// src/pages/admin/WorkHoursApprovalPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminWorkHoursService } from '../../services/adminWorkHoursService';
import Button from '../../components/common/Button';
import WorkHoursTable from '../../components/admin/approvals/WorkHoursTable';
import WorkHoursDetailsModal from '../../components/admin/approvals/WorkHoursDetailsModal';
import RejectionReasonModal from '../../components/admin/approvals/RejectionReasonModal';

const WorkHoursApprovalPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workHours, setWorkHours] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailsModalData, setDetailsModalData] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [isBulkRejection, setIsBulkRejection] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWorkHours();
  }, []);

  const fetchWorkHours = async () => {
    try {
      setLoading(true);
      const data = await adminWorkHoursService.getPendingWorkHours();
      setWorkHours(data);
      setError(null);
    } catch (err) {
      setError('Failed to load work hours');
      console.error('Error loading work hours:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (workHour) => {
    setDetailsModalData(workHour);
  };

  const handleApprove = async (id) => {
    try {
      await adminWorkHoursService.approveWorkHours(id, user.uid);
      await fetchWorkHours();
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    } catch (err) {
      console.error('Error approving work hours:', err);
      // TODO: Add error notification
    }
  };

  const handleBulkApprove = async () => {
    try {
      await adminWorkHoursService.bulkApproveWorkHours(selectedIds, user.uid);
      await fetchWorkHours();
      setSelectedIds([]);
    } catch (err) {
      console.error('Error bulk approving work hours:', err);
      // TODO: Add error notification
    }
  };

  const handleReject = (id) => {
    setRejectingId(id);
    setIsBulkRejection(false);
    setShowRejectionModal(true);
  };

  const handleBulkReject = () => {
    setIsBulkRejection(true);
    setShowRejectionModal(true);
  };

  const handleRejectConfirm = async (reason) => {
    try {
      if (isBulkRejection) {
        await adminWorkHoursService.bulkRejectWorkHours(selectedIds, user.uid, reason);
        setSelectedIds([]);
      } else {
        await adminWorkHoursService.rejectWorkHours(rejectingId, user.uid, reason);
        setSelectedIds(prev => prev.filter(id => id !== rejectingId));
      }
      await fetchWorkHours();
      setShowRejectionModal(false);
      setRejectingId(null);
      setIsBulkRejection(false);
    } catch (err) {
      console.error('Error rejecting work hours:', err);
      // TODO: Add error notification
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Work Hours Approval</h1>
          <p className="text-sm text-gray-500 mt-1">
            {workHours.length} pending approval{workHours.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3">
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

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <WorkHoursTable
          workHours={workHours}
          selectedIds={selectedIds}
          onSelect={setSelectedIds}
          onViewDetails={handleViewDetails}
          onApprove={handleApprove}
          onReject={handleReject}
        />

        {workHours.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No pending work hours to approve
          </div>
        )}
      </div>

      {/* Modals */}
      <WorkHoursDetailsModal
        isOpen={!!detailsModalData}
        onClose={() => setDetailsModalData(null)}
        workHours={detailsModalData}
      />

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
    </div>
  );
};

export default WorkHoursApprovalPage;