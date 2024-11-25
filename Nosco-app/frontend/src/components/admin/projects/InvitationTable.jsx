// src/components/admin/projects/InvitationTable.jsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import Table from '../../common/Table';
import Modal from '../../common/Modal';

const InvitationTable = ({ invitations, onResend, onCancel, projectStatus }) => {
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
      header: 'Worker',
      accessorFn: (row) => row.user?.name || 'Unknown',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.user?.name}</div>
          <div className="text-sm text-gray-500">{row.original.user?.department}</div>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => {
        const status = getValue();
        return (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            status === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : status === 'accepted'
              ? 'bg-green-100 text-green-800'
              : status === 'declined'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {status}
          </span>
        );
      }
    },
    {
      header: 'Invited',
      accessorKey: 'createdAt',
      cell: ({ getValue }) => format(getValue().toDate(), 'MMM d, yyyy')
    },
    {
      header: 'Last Updated',
      accessorKey: 'updatedAt',
      cell: ({ getValue }) => format(getValue().toDate(), 'MMM d, yyyy')
    },
    {
      header: 'Actions',
      cell: ({ row }) => {
        const invitation = row.original;
        return (
          <div className="flex gap-2">
            {invitation.status === 'pending' && projectStatus !== 'ended' && (
              <>
                <button
                  onClick={() => onResend(invitation.id)}
                  className="px-3 py-1 text-sm rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
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
          </div>
        );
      }
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <Table
        data={invitations}
        columns={columns}
        emptyMessage="No invitations found"
      />

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
    </div>
  );
};

export default InvitationTable;