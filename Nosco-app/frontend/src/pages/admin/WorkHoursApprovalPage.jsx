import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminWorkHoursService } from '../../services/adminWorkHoursService';
import { collection, getDocs } from 'firebase/firestore';
import { firestore as db } from '../../firebase/firebase_config';
import Button from '../../components/common/Button';
import WorkHoursTable from '../../components/admin/approvals/WorkHoursTable';
import WorkHoursDetailsModal from '../../components/admin/approvals/WorkHoursDetailsModal';
import RejectionReasonModal from '../../components/admin/approvals/RejectionReasonModal';
import WorkHoursFilterModal from '../../components/admin/approvals/WorkHoursFilterModal';

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
  const [statusFilter, setStatusFilter] = useState('pending');

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    await Promise.all([
      fetchWorkHours(),
      fetchProjects(),
      fetchWorkers()
    ]);
  };

  const fetchProjects = async () => {
    try {
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchWorkers = async () => {
    try {
      const workersSnapshot = await getDocs(collection(db, 'users'));
      const workersData = workersSnapshot.docs
        .filter(doc => doc.data().role === 'worker')
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      setWorkers(workersData);
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const fetchWorkHours = async () => {
    try {
      setLoading(true);
      const data = await adminWorkHoursService.getWorkHours(statusFilter, activeFilters);
      setWorkHours(data);
      setError(null);
      setSelectedIds([]);
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
    }
  };

  const handleBulkApprove = async () => {
    try {
      await adminWorkHoursService.bulkApproveWorkHours(selectedIds, user.uid);
      await fetchWorkHours();
      setSelectedIds([]);
    } catch (err) {
      console.error('Error bulk approving work hours:', err);
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
    }
  };

  const handleApplyFilters = async (filters) => {
    setActiveFilters(filters);
    await fetchWorkHours();
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

  const pendingCount = workHours.filter(wh => wh.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Work Hours Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pendingCount} pending approval{pendingCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-4">
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
      </div>

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
            No work hours found for the selected filter
          </div>
        )}
      </div>

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

      <WorkHoursFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        projects={projects}
        workers={workers}
        activeFilters={activeFilters}  // Add this line
      />
    </div>
  );
};

export default WorkHoursApprovalPage;