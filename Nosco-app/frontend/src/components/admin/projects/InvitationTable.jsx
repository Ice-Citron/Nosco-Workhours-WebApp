// src/components/admin/projects/InvitationTable.jsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import Table from '../../common/Table';
import Modal from '../../common/Modal';

const InvitationTable = ({ 
  invitations, 
  onResend, 
  onCancel,
  onDelete,
  onNudge,
  projectStatus 
}) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancel = async () => {
    await onCancel(selectedInvitation.id, cancelReason);
    setShowCancelModal(false);
    setSelectedInvitation(null);
    setCancelReason('');
  };

  const columns = [
    {
      header: 'WORKER',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.user?.name || 'Unknown User'}
          </div>
          <div className="text-sm text-gray-500">
            {row.original.user?.department || 'No Department'}
          </div>
        </div>
      )
    },
    {
      header: 'STATUS',
      accessorKey: 'status',
      cell: ({ getValue }) => (
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          getValue() === 'pending'
            ? 'bg-yellow-100 text-yellow-800'
            : getValue() === 'accepted'
            ? 'bg-green-100 text-green-800'
            : getValue() === 'declined'
            ? 'bg-red-100 text-red-800'
            : getValue() === 'cancelled'
            ? 'bg-gray-100 text-gray-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {getValue()}
        </span>
      )
    },
    {
      header: 'INVITED',
      accessorKey: 'createdAt',
      cell: ({ getValue }) => {
        const date = getValue();
        return date ? format(date.toDate(), 'MMM d, yyyy') : '-';
      }
    },
    {
      header: 'LAST UPDATED',
      accessorKey: 'updatedAt',
      cell: ({ getValue }) => {
        const date = getValue();
        return date ? format(date.toDate(), 'MMM d, yyyy') : '-';
      }
    },
    {
      header: 'ACTIONS',
      cell: ({ row }) => {
        const invitation = row.original;
        return (
          <div className="flex gap-2">
            {invitation.status === 'pending' && projectStatus !== 'ended' && (
              <>
                <button
                  onClick={() => onNudge(invitation.id)}
                  className="px-3 py-1 text-sm rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                >
                  Send Nudge
                </button>
                <button
                  onClick={() => onResend(invitation.id)}
                  className="px-3 py-1 text-sm rounded bg-green-50 text-green-600 hover:bg-green-100"
                >
                  Resend
                </button>
                <button
                  onClick={() => {
                    setSelectedInvitation(invitation);
                    setShowCancelModal(true);
                  }}
                  className="px-3 py-1 text-sm rounded bg-red-50 text-red-600 hover:bg-red-100"
                >
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={() => {
                setSelectedInvitation(invitation);
                setShowDetailsModal(true);
              }}
              className="px-3 py-1 text-sm rounded bg-gray-50 text-gray-600 hover:bg-gray-100"
            >
              Details
            </button>
            {invitation.status !== 'pending' && (
              <button
                onClick={() => onDelete(invitation.id)}
                className="px-3 py-1 text-sm rounded bg-red-50 text-red-600 hover:bg-red-100"
              >
                Delete
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <>
      <Table
        data={invitations}
        columns={columns}
        emptyMessage="No invitations found"
      />

      {/* Details Modal */}
      {showDetailsModal && selectedInvitation && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedInvitation(null);
          }}
          title="Invitation Details"
        >
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Worker</h3>
                <p className="mt-1">{selectedInvitation.user?.name || 'Unknown'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Department</h3>
                <p className="mt-1">{selectedInvitation.user?.department || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="mt-1">{selectedInvitation.status}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Message</h3>
                <p className="mt-1">{selectedInvitation.message}</p>
              </div>
              {selectedInvitation.cancelReason && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Cancellation Reason</h3>
                  <p className="mt-1">{selectedInvitation.cancelReason}</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500">History</h3>
                <div className="mt-1 space-y-2">
                  {selectedInvitation.attempts?.map((attempt, index) => (
                    <div key={index} className="text-sm">
                      {attempt.type} on {format(attempt.date.toDate(), 'MMM d, yyyy HH:mm')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <Modal
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setSelectedInvitation(null);
            setCancelReason('');
          }}
          title="Cancel Invitation"
        >
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for cancellation
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="Enter reason for cancellation..."
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={!cancelReason.trim()}
              >
                Confirm
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default InvitationTable;