// src/components/admin/approvals/WorkHoursDetailsModal.jsx
import React from 'react';
import Modal from '../../common/Modal';
import { format } from 'date-fns';

const WorkHoursDetailsModal = ({ isOpen, onClose, workHours }) => {
  if (!workHours) return null;

  const totalHours = 
    (workHours.regularHours || 0) + 
    (workHours.overtime15x || 0) + 
    (workHours.overtime20x || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Work Hours Details"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Worker</h4>
            <p className="mt-1">{workHours.worker?.name}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Project</h4>
            <p className="mt-1">{workHours.project?.name}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Date</h4>
            <p className="mt-1">{format(workHours.date.toDate(), 'PPP')}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Status</h4>
            <p className="mt-1 capitalize">{workHours.status}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Hours Breakdown</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Regular Hours</p>
              <p className="mt-1 font-medium">{workHours.regularHours || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Overtime (1.5x)</p>
              <p className="mt-1 font-medium">{workHours.overtime15x || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Overtime (2.0x)</p>
              <p className="mt-1 font-medium">{workHours.overtime20x || 0}</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-500">Total Hours</p>
            <p className="mt-1 font-medium">{totalHours}</p>
          </div>
        </div>

        {workHours.remarks && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Remarks</h4>
            <p className="text-sm">{workHours.remarks}</p>
          </div>
        )}

        {workHours.rejectionReason && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Rejection Reason</h4>
            <p className="text-sm text-red-600">{workHours.rejectionReason}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default WorkHoursDetailsModal;