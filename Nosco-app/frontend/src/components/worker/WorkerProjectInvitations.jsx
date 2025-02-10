// src/components/worker/WorkerProjectInvitations.jsx
import React from 'react';
import { format } from 'date-fns';
import { acceptProjectInvitation, declineProjectInvitation } from '../../services/workerProjectInvitationService';

const WorkerProjectInvitations = ({ invitations, loading, refreshInvitations }) => {
  const handleAccept = async (invitationId) => {
    try {
      await acceptProjectInvitation(invitationId);
      refreshInvitations();
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleDecline = async (invitationId) => {
    try {
      const reason = prompt("Enter the reason for declining this invitation:");
      if (!reason) return;
      await declineProjectInvitation(invitationId, undefined, reason);
      refreshInvitations();
    } catch (error) {
      console.error('Error declining invitation:', error);
    }
  };

  if (loading) {
    return <div>Loading invitations...</div>;
  }

  if (!invitations || invitations.length === 0) {
    return <div className="text-gray-500 text-center">No invitations found.</div>;
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <div key={invitation.id} className="border p-4 rounded shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold">
                {invitation.project?.name || 'Project Invitation'}
              </h3>
              <p className="text-gray-600">{invitation.message}</p>
              <p className="text-sm text-gray-500">
                Invited on:{" "}
                {invitation.createdAt
                  ? format(new Date(invitation.createdAt.seconds * 1000), "MMM d, yyyy")
                  : "-"}
              </p>
            </div>
            {invitation.status.toLowerCase() === "pending" ? (
              <div className="space-x-2">
                <button
                  onClick={() => handleAccept(invitation.id)}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDecline(invitation.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                  Decline
                </button>
              </div>
            ) : (
              <span className="px-3 py-1 rounded-full text-sm font-medium text-gray-700 border">
                {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkerProjectInvitations;
