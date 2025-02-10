import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllInvitations,
  updateInvitationStatus
} from '../../services/workerProjectInvitationService';
import PendingInvitationsList from '../../components/projectInvitations/PendingInvitationsList';
import AcceptedProjectsList from '../../components/projectInvitations/AcceptedProjectsList';
import ProjectDetailsModal from '../../components/projectInvitations/ProjectDetailsModal';

const ProjectInvitationsPage = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState({
    pending: [],
    accepted: [],
    declined: []
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);

  const loadInvitations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allInvitations = await getAllInvitations(user.uid);
      setInvitations(allInvitations);
    } catch (err) {
      setError(err.message);
      console.error('Error loading invitations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      loadInvitations();
    }
  }, [user?.uid]);

  const handleStatusUpdate = async (invitationId, newStatus) => {
    // Prevent multiple simultaneous actions
    if (actionInProgress) return;
    
    setActionInProgress(invitationId);
    try {
      // Find the invitation in pending list
      const invitation = invitations.pending.find(inv => inv.id === invitationId);
      if (!invitation) throw new Error('Invitation not found');

      // Optimistically update UI
      setInvitations(prev => ({
        ...prev,
        pending: prev.pending.filter(inv => inv.id !== invitationId),
        [newStatus.toLowerCase()]: [...prev[newStatus.toLowerCase()], { ...invitation, status: newStatus }]
      }));

      // Actually update in database
      await updateInvitationStatus(invitationId, user.uid, newStatus);
    } catch (error) {
      console.error(`Error ${newStatus.toLowerCase()}ing invitation:`, error);
      setError(`Failed to ${newStatus.toLowerCase()} invitation. Please try again.`);
      // Revert optimistic update
      await loadInvitations();
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAccept = (invitationId) => handleStatusUpdate(invitationId, 'Accepted');
  const handleDecline = (invitationId) => handleStatusUpdate(invitationId, 'Declined');
  
  const handleViewDetails = (project) => {
    setSelectedProject(project);
  };

  const handleCloseModal = () => {
    setSelectedProject(null);
  };

  const handleRetry = () => {
    loadInvitations();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Pending Invitations Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Pending Invitations</h2>
          {error && (
            <button
              onClick={handleRetry}
              className="text-blue-500 hover:text-blue-600"
            >
              Retry Loading
            </button>
          )}
        </div>
        <PendingInvitationsList
          invitations={invitations.pending}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onViewDetails={handleViewDetails}
          isLoading={isLoading}
          error={error}
          actionInProgress={actionInProgress}
        />
      </div>

      {/* Accepted Projects Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Accepted Projects</h2>
        <AcceptedProjectsList
          projects={invitations.accepted}
          onViewDetails={handleViewDetails}
          isLoading={isLoading}
          error={error}
        />
      </div>

      {/* Declined Projects Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Declined Projects</h2>
        <AcceptedProjectsList
          projects={invitations.declined}
          onViewDetails={handleViewDetails}
          isLoading={isLoading}
          error={error}
          isDeclined={true}
        />
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default ProjectInvitationsPage;