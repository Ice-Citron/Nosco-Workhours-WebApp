// components/admin/notifications/PendingInvitationsTable.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, doc, getDoc } from 'firebase/firestore';
import { firestore as db } from '../../../firebase/firebase_config';

const PendingInvitationsTable = ({ invitations }) => {
  const [projectNames, setProjectNames] = useState({});
  const [workerNames, setWorkerNames] = useState({});

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Fetch project and worker names
  useEffect(() => {
    const fetchDetails = async () => {
      const projectIds = [...new Set(invitations.map(inv => inv.projectID))];
      const workerIds = [...new Set(invitations.map(inv => inv.userID))];
      
      // Fetch project names
      const projectData = {};
      for (const projectId of projectIds) {
        try {
          const projectDocRef = doc(db, 'projects', projectId);
          const projectDocSnap = await getDoc(projectDocRef);
          
          if (projectDocSnap.exists()) {
            projectData[projectId] = projectDocSnap.data().name || 'Unknown Project';
          } else {
            projectData[projectId] = 'Unknown Project';
          }
        } catch (error) {
          console.error(`Error fetching project ${projectId}:`, error);
          projectData[projectId] = 'Unknown Project';
        }
      }
      setProjectNames(projectData);
      
      // Fetch worker names
      const userData = {};
      for (const userId of workerIds) {
        try {
          const userDocRef = doc(db, 'users', userId);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            userData[userId] = userDocSnap.data().name || 'Unknown Worker';
          } else {
            userData[userId] = 'Unknown Worker';
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
          userData[userId] = 'Unknown Worker';
        }
      }
      setWorkerNames(userData);
    };
    
    if (invitations.length > 0) {
      fetchDetails();
    }
  }, [invitations]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium mb-3">Pending Project Invitations</h2>
      <p className="text-sm text-gray-500 mb-4">
        {invitations.length} invitation{invitations.length !== 1 ? 's' : ''} awaiting response
      </p>
      
      {invitations.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No pending invitations.
        </div>
      ) : (
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worker</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invitation Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Deadline</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invitations.map((invitation) => (
              <tr key={invitation.id}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link to={`/admin/projects/${invitation.projectID}/management`} className="text-blue-600 hover:text-blue-900">
                    {projectNames[invitation.projectID] || 'Loading...'}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link to={`/admin/workers/${invitation.userID}`} className="text-blue-600 hover:text-blue-900">
                    {workerNames[invitation.userID] || 'Loading...'}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(invitation.createdAt)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(invitation.requiredResponseDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PendingInvitationsTable;
