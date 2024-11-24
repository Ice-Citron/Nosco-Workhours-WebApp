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
      <div className="px-6 py-4 space-y-6">
        {/* Worker and Project */}
        <div className="grid grid-cols-2 gap-x-16">
          <div>
            <div className="text-sm text-gray-500 mb-1">Worker</div>
            <div className="font-medium">{workHours.worker?.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Project</div>
            <div className="font-medium">{workHours.project?.name}</div>
          </div>
        </div>

        {/* Date and Status */}
        <div className="grid grid-cols-2 gap-x-16">
          <div>
            <div className="text-sm text-gray-500 mb-1">Date</div>
            <div className="font-medium">
              {format(workHours.date.toDate(), 'MMMM do, yyyy')}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Status</div>
            <div className={`font-medium ${
              workHours.status === 'approved' ? 'text-green-600' :
              workHours.status === 'rejected' ? 'text-red-600' :
              'text-yellow-600'
            }`}>
              {workHours.status.charAt(0).toUpperCase() + workHours.status.slice(1)}
            </div>
          </div>
        </div>

        {/* Hours Breakdown */}
        <div>
          <div className="text-sm text-gray-500 mb-3">Hours Breakdown</div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-500 mb-1">Regular Hours</div>
              <div className="text-2xl font-medium">{workHours.regularHours || 0}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-500 mb-1">Overtime (1.5x)</div>
              <div className="text-2xl font-medium">{workHours.overtime15x || 0}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-500 mb-1">Overtime (2.0x)</div>
              <div className="text-2xl font-medium">{workHours.overtime20x || 0}</div>
            </div>
          </div>
        </div>

        {/* Total Hours */}
        <div>
          <div className="text-sm text-gray-500 mb-1">Total Hours</div>
          <div className="text-2xl font-medium">{totalHours}</div>
        </div>

        {/* Remarks */}
        {workHours.remarks && (
          <div>
            <div className="text-sm text-gray-500 mb-1">Remarks</div>
            <div className="bg-gray-50 rounded p-3">{workHours.remarks}</div>
          </div>
        )}

        {/* Rejection Reason */}
        {workHours.rejectionReason && (
          <div>
            <div className="text-sm text-gray-500 mb-1">Rejection Reason</div>
            <div className="bg-red-50 text-red-700 rounded p-3">
              {workHours.rejectionReason}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default WorkHoursDetailsModal;