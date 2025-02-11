import React from 'react';
import { format } from 'date-fns';
import {
  acceptProjectInvitation,
  declineProjectInvitation
} from '../../services/workerProjectInvitationService';

console.log("WorkerProjectInvitations component loaded");

const WorkerProjectInvitations = ({ invitations, loading, refreshInvitations, user }) => {
  const handleAccept = async (invitationId) => {
    try {
      console.log("handleAccept called for invitationId:", invitationId, "with user:", user.uid);
      // Pass the worker’s UID
      await acceptProjectInvitation(invitationId, user.uid);
      refreshInvitations();
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleReject = async (invitationId) => {
    try {
      console.log("handleReject called for invitationId:", invitationId, "with user:", user.uid);
      const reason = prompt("Enter the reason for rejecting this invitation:");
      if (!reason) return;
      // Pass the worker’s UID
      await declineProjectInvitation(invitationId, user.uid, reason);
      refreshInvitations();
    } catch (error) {
      console.error('Error rejecting invitation:', error);
    }
  };

  if (loading) {
    console.log("WorkerProjectInvitations: Loading invitations...");
    return <div>Loading invitations...</div>;
  }

  if (!invitations || invitations.length === 0) {
    console.log("WorkerProjectInvitations: No invitations found.");
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
                Invited on:{' '}
                {invitation.createdAt
                  ? format(new Date(invitation.createdAt.seconds * 1000), 'MMM d, yyyy')
                  : '-'}
              </p>
            </div>
            {invitation.status.toLowerCase() === 'pending' ? (
              <div className="space-x-2">
                <button
                  onClick={() => handleAccept(invitation.id)}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleReject(invitation.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                  Reject
                </button>
              </div>
            ) : (
              <span className="px-3 py-1 rounded-full text-sm font-medium text-gray-700 border">
                {invitation.status.charAt(0).toUpperCase() +
                  invitation.status.slice(1)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkerProjectInvitations;
