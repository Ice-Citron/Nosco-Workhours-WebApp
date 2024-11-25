// src/pages/admin/projects/ProjectDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { adminProjectService } from '../../services/adminProjectService';
import { adminProjectInvitationService } from '../../services/adminProjectInvitationService';
import InviteWorkerModal from '../../components/admin/projects/InviteWorkerModal';
import InvitationTable from '../../components/admin/projects/InvitationTable';

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      // First fetch project data
      const projectData = await adminProjectService.getProjectDetails(projectId);
      setProject(projectData);
      
      // Then fetch invitations
      try {
        const invitationsData = await adminProjectInvitationService.getProjectInvitations(projectId);
        setInvitations(invitationsData);
      } catch (invitationError) {
        console.error('Error fetching invitations:', invitationError);
        // Don't set error state here as we still want to show project data
      }
    } catch (err) {
      setError('Failed to load project data');
      console.error('Error loading project data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async (userId, message) => {
    try {
      await adminProjectInvitationService.createInvitation(projectId, userId, message);
      await fetchProjectData();
      setShowInviteModal(false);
    } catch (err) {
      console.error('Error creating invitation:', err);
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      await adminProjectInvitationService.resendInvitation(invitationId);
      await fetchProjectData();
    } catch (err) {
      console.error('Error resending invitation:', err);
    }
  };

  const handleCancelInvitation = async (invitationId, reason) => {
    try {
      await adminProjectInvitationService.cancelInvitation(invitationId, reason);
      await fetchProjectData();
    } catch (err) {
      console.error('Error cancelling invitation:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nosco-red"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">Project not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/projects')}
          className="text-nosco-text hover:text-nosco-red mb-4 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Projects
        </button>

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Project Details: {project.name}</h1>
          <div className="flex gap-2">
            {project.status !== 'ended' && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-nosco-red hover:bg-nosco-red-dark text-white px-4 py-2 rounded-md transition-colors duration-200"
              >
                Invite Worker
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Customer</h3>
            <p className="mt-1 text-lg">{project.customer}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Location</h3>
            <p className="mt-1 text-lg">{project.location}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <p className="mt-1">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                project.status === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : project.status === 'draft'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {project.status}
              </span>
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Department</h3>
            <p className="mt-1 text-lg">{project.department}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg col-span-2">
            <h3 className="text-sm font-medium text-gray-500">Project Duration</h3>
            <p className="mt-1">
              {format(project.startDate.toDate(), 'MMM d, yyyy')} - {format(project.endDate.toDate(), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Project Invitations</h2>
        <InvitationTable 
          invitations={invitations}
          onResend={handleResendInvitation}
          onCancel={handleCancelInvitation}
          projectStatus={project.status}
        />
      </div>

      {showInviteModal && (
        <InviteWorkerModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onInvite={handleCreateInvitation}
          existingWorkers={project.workers ? Object.keys(project.workers) : []}
        />
      )}
    </div>
  );
};

export default ProjectDetailsPage;