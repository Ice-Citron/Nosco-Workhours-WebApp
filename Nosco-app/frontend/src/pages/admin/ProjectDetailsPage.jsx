// src/pages/admin/ProjectDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { adminProjectService } from '../../services/adminProjectService';
import { adminProjectInvitationService } from '../../services/adminProjectInvitationService';
import InviteWorkerModal from '../../components/admin/projects/InviteWorkerModal';
import InvitationTable from '../../components/admin/projects/InvitationTable';
import Modal from '../../components/common/Modal';

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState(null);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch project data
      const projectData = await adminProjectService.getProjectDetails(projectId);
      setProject(projectData);
      
      // Fetch invitations
      const invitationsData = await adminProjectInvitationService.getProjectInvitations(projectId);
      setInvitations(invitationsData);
    } catch (err) {
      setError('Failed to load project data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    try {
      if (!statusAction) return;
  
      switch (statusAction) {
        case 'end':
          await adminProjectService.endProject(projectId);
          break;
        case 'archive':
          await adminProjectService.archiveProject(projectId);
          break;
        case 'unarchive':
          await adminProjectService.unarchiveProject(projectId);
          break;
        case 'start':
          await adminProjectService.updateProjectStatus(projectId, 'active');
          break;
        default:
          break;
      }
      
      await fetchProjectData();
      setShowStatusModal(false);
      setStatusAction(null);
    } catch (err) {
      console.error('Error updating project status:', err);
      // Consider adding a toast notification here
    }
  };

  const handleDeleteProject = async () => {
    try {
      await adminProjectService.deleteProject(projectId);
      navigate('/admin/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      // Consider adding a toast notification here
    }
  };

  const getStatusActions = () => {
    switch (project?.status) {
      case 'draft':
        return [
          { label: 'Start Project', action: 'start', color: 'bg-green-600' },
          { label: 'Archive Project', action: 'archive', color: 'bg-gray-600' },
        ];
      case 'active':
        return [
          { label: 'End Project', action: 'end', color: 'bg-red-600' },
          { label: 'Archive Project', action: 'archive', color: 'bg-gray-600' },
        ];
      case 'ended':
        return [
          { label: 'Archive Project', action: 'archive', color: 'bg-gray-600' },
        ];
      case 'archived':
        return [
          { label: 'Unarchive Project', action: 'unarchive', color: 'bg-green-600' },
          { label: 'Delete Project', action: 'delete', color: 'bg-red-600' },
        ];
      default:
        return [];
    }
  };

  const handleCreateInvitation = async (userId, message) => {
    try {
      await adminProjectInvitationService.createInvitation(projectId, userId, message);
      await fetchProjectData(); // Refresh the invitations list
      setShowInviteModal(false);
    } catch (err) {
      console.error('Error creating invitation:', err);
      // Consider adding error notification here
    }
  };
  
  const handleResendInvitation = async (invitationId) => {
    try {
      await adminProjectInvitationService.resendInvitation(invitationId);
      await fetchProjectData(); // Refresh the invitations list
    } catch (err) {
      console.error('Error resending invitation:', err);
      // Consider adding error notification here
    }
  };
  
  const handleCancelInvitation = async (invitationId, reason) => {
    try {
      await adminProjectInvitationService.cancelInvitation(invitationId, reason);
      await fetchProjectData(); // Refresh the invitations list
    } catch (err) {
      console.error('Error cancelling invitation:', err);
      // Consider adding error notification here
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
      {/* Header Section */}
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
          <div>
            <h1 className="text-2xl font-semibold">Project Details: {project.name}</h1>
            <span className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium ${
              project.status === 'active' 
                ? 'bg-green-100 text-green-800'
                : project.status === 'draft'
                ? 'bg-yellow-100 text-yellow-800'
                : project.status === 'archived'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          </div>
          
          <div className="flex gap-2">
            {project.status !== 'archived' && project.status !== 'ended' && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-nosco-red hover:bg-nosco-red-dark text-white px-4 py-2 rounded-md transition-colors duration-200"
              >
                Invite Worker
              </button>
            )}
            
            <div className="relative">
              <button
                onClick={() => setShowStatusModal(true)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors duration-200"
              >
                Actions
              </button>
            </div>
          </div>
        </div>

        {/* Project Details Grid */}
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
            <h3 className="text-sm font-medium text-gray-500">Department</h3>
            <p className="mt-1 text-lg">{project.department}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Project Duration</h3>
            <p className="mt-1">
              {format(project.startDate.toDate(), 'MMM d, yyyy')} - {format(project.endDate.toDate(), 'MMM d, yyyy')}
            </p>
          </div>
          {project.description && (
            <div className="bg-gray-50 p-4 rounded-lg col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1 whitespace-pre-wrap">{project.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Invitations Section */}
      {project.status !== 'archived' && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Project Invitations</h2>
          <InvitationTable 
            invitations={invitations}
            onResend={handleResendInvitation}
            onCancel={handleCancelInvitation}
            projectStatus={project.status}
          />
        </div>
      )}

      {/* Modals */}
      {showInviteModal && (
        <InviteWorkerModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onInvite={handleCreateInvitation}
          existingWorkers={project.workers ? Object.keys(project.workers) : []}
        />
      )}

      {/* Status Change Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setStatusAction(null);
        }}
        title="Project Actions"
      >
        <div className="p-6">
          <div className="space-y-4">
            {getStatusActions().map((action) => (
              <button
                key={action.action}
                onClick={() => {
                  setStatusAction(action.action);
                  setShowStatusModal(false);
                  if (action.action === 'delete') {
                    setShowDeleteModal(true);
                  } else {
                    setShowStatusModal(true);
                  }
                }}
                className={`w-full px-4 py-2 ${action.color} text-white rounded-md hover:opacity-90`}
              >
                {action.label}
              </button>
            ))}
            {project.status === 'archived' && (
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setShowDeleteModal(true);
                }}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:opacity-90"
              >
                Delete Project
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project"
      >
        <div className="p-6">
          <p className="mb-4 text-gray-700">
            Are you sure you want to delete this project? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteProject}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete Project
            </button>
          </div>
        </div>
      </Modal>

      {/* Status Change Confirmation Modal */}
      <Modal
        isOpen={showStatusModal && statusAction}
        onClose={() => {
          setShowStatusModal(false);
          setStatusAction(null);
        }}
        title={`Confirm ${statusAction?.charAt(0).toUpperCase()}${statusAction?.slice(1)} Project`}
      >
        <div className="p-6">
          <p className="mb-4 text-gray-700">
            Are you sure you want to {statusAction} this project?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowStatusModal(false);
                setStatusAction(null);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleStatusChange}
              className={`px-4 py-2 text-white rounded-md ${
                statusAction === 'end' 
                  ? 'bg-red-600 hover:bg-red-700'
                  : statusAction === 'archive'
                  ? 'bg-gray-600 hover:bg-gray-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDetailsPage;