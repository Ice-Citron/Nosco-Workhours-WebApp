// src/components/worker/WorkerProjectInvitations.jsx
import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  acceptProjectInvitation,
  declineProjectInvitation
} from '../../services/workerProjectInvitationService';

const WorkerProjectInvitations = ({ invitations, loading, refreshInvitations, user }) => {
  const [subTab, setSubTab] = useState('pending'); // 'pending' or 'historical'
  const [historicalStatusFilter, setHistoricalStatusFilter] = useState('all'); // 'all', 'accepted', 'rejected', 'cancelled'
  const [startFilter, setStartFilter] = useState('');
  const [endFilter, setEndFilter] = useState('');

  const handleAccept = async (invitationId) => {
    try {
      // 1) call service to accept invitation
      await acceptProjectInvitation(invitationId, user.uid);
      // 2) re-fetch from Firestore
      await refreshInvitations();
      // 3) optional: show a success toast, etc.
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleReject = async (invitationId) => {
    try {
      const reason = prompt('Enter the reason for rejecting this invitation:');
      if (!reason) return;

      await declineProjectInvitation(invitationId, user.uid, reason);
      await refreshInvitations();
    } catch (error) {
      console.error('Error rejecting invitation:', error);
    }
  };

  if (loading) {
    return <div>Loading invitations...</div>;
  }

  if (!invitations || invitations.length === 0) {
    return <div className="text-gray-500 text-center">No invitations found.</div>;
  }

  // Separate pending vs historical
  const pendingInvitations = invitations.filter(
    (inv) => inv.status?.toLowerCase() === 'pending'
  );

  let historicalInvitations = invitations.filter((inv) => {
    const s = inv.status?.toLowerCase() || '';
    return ['accepted', 'rejected', 'cancelled'].includes(s);
  });

  // Filter historical by status if not "all"
  if (historicalStatusFilter !== 'all') {
    historicalInvitations = historicalInvitations.filter(
      (inv) => inv.status?.toLowerCase() === historicalStatusFilter
    );
  }

  // Optional date range filter (based on project startDate)
  if (subTab === 'historical') {
    const fromDate = startFilter ? parseISO(startFilter) : null;
    const toDate = endFilter ? parseISO(endFilter) : null;

    historicalInvitations = historicalInvitations.filter((inv) => {
      const projStartDate = inv.project?.startDate?.toDate?.();
      if (!projStartDate) return false;
      if (fromDate && projStartDate < fromDate) return false;
      if (toDate && projStartDate > toDate) return false;
      return true;
    });
  }

  return (
    <div>
      {/* Sub-Tab Navigation */}
      <div className="flex space-x-4 border-b mb-4">
        <button
          onClick={() => setSubTab('pending')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            subTab === 'pending'
              ? 'border-nosco-red text-nosco-red'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setSubTab('historical')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            subTab === 'historical'
              ? 'border-nosco-red text-nosco-red'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Historical
        </button>
      </div>

      {/* Historical Filters */}
      {subTab === 'historical' && (
        <div className="mb-4 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Status Filter:</label>
            <select
              value={historicalStatusFilter}
              onChange={(e) => setHistoricalStatusFilter(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">From:</label>
            <input
              type="date"
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              value={startFilter}
              onChange={(e) => setStartFilter(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">To:</label>
            <input
              type="date"
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              value={endFilter}
              onChange={(e) => setEndFilter(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Pending Tab */}
      {subTab === 'pending' ? (
        pendingInvitations.length === 0 ? (
          <div className="text-gray-500 text-center">No pending invitations.</div>
        ) : (
          <div className="space-y-4">
            {pendingInvitations.map((inv) => (
              <div key={inv.id} className="border p-4 rounded shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {inv.project?.name || 'Project Invitation'}
                    </h3>
                    <p className="text-gray-600">{inv.message}</p>
                    <p className="text-sm text-gray-500">
                      Invited on:{' '}
                      {inv.createdAt
                        ? format(new Date(inv.createdAt.seconds * 1000), 'MMM d, yyyy')
                        : '-'}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 items-center justify-end">
                    <button
                      onClick={() => handleAccept(inv.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(inv.id)}
                      className="bg-nosco-red hover:bg-nosco-red-dark text-white px-3 py-1 rounded"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // Historical Tab
        historicalInvitations.length === 0 ? (
          <div className="text-gray-500 text-center">
            No historical invitations found.
          </div>
        ) : (
          <div className="space-y-4">
            {historicalInvitations.map((inv) => (
              <div key={inv.id} className="border p-4 rounded shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {inv.project?.name || 'Project Invitation'}
                    </h3>
                    <p className="text-gray-600">{inv.message}</p>
                    <p className="text-sm text-gray-500">
                      Invited on:{' '}
                      {inv.createdAt
                        ? format(new Date(inv.createdAt.seconds * 1000), 'MMM d, yyyy')
                        : '-'}
                    </p>
                    <p className="text-sm text-gray-500">Status: {inv.status}</p>
                    <p className="text-sm text-gray-500">
                      Start Date:{' '}
                      {inv.project?.startDate
                        ? format(inv.project.startDate.toDate(), 'MMM d, yyyy')
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default WorkerProjectInvitations;
