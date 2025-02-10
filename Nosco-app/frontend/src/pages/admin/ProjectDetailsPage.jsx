// src/pages/admin/ProjectDetailsPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import Modal from '../../components/common/Modal';
import InviteWorkerModal from '../../components/admin/projects/InviteWorkerModal';
import { adminProjectService } from '../../services/adminProjectService';
import { adminProjectInvitationService } from '../../services/adminProjectInvitationService';
import { updateDoc, doc, Timestamp } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase_config';

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // Main project data and inline editing state
  const [project, setProject] = useState(null);
  const [projectEdits, setProjectEdits] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Other states
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState(null);

  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const openDetailsModal = (invitation) => {
    setSelectedInvitation(invitation);
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  
  const handleRetryInvitation = async (invitationId) => {
    try {
      await adminProjectInvitationService.retryInvitation(invitationId);
      await fetchProjectData();
    } catch (err) {
      console.error('Error retrying invitation:', err);
    }
  };

  const handleReinstateInvitation = async (invitationId) => {
    try {
      await adminProjectInvitationService.reinstateInvitation(invitationId);
      await fetchProjectData(); // refresh the project and invitation data
    } catch (err) {
      console.error('Error reinstating invitation:', err);
    }
  };

  // New function to handle sending a nudge for an invitation
  const handleNudge = async (invitationId) => {
    try {
      // Call your service to send a nudge (make sure you have a corresponding method in adminProjectInvitationService)
      await adminProjectInvitationService.sendNudge(invitationId);
      // Reload the project data to update the invitation list
      await fetchProjectData();
    } catch (err) {
      console.error('Error sending nudge:', err);
    }
  };

  // New function to handle cancelling an invitation
  const handleCancelInvitation = async (invitationId) => {
    // Optionally, prompt for a cancellation reason (or you could use a modal)
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;
    try {
      await adminProjectInvitationService.cancelInvitation(invitationId, reason);
      await fetchProjectData();
    } catch (err) {
      console.error('Error cancelling invitation:', err);
    }
  };

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch project data
      const projectData = await adminProjectService.getProjectDetails(projectId);
      setProject(projectData);

      // Initialize the editable copy. For date fields, convert to YYYY-MM-DD
      setProjectEdits({
        ...projectData,
        startDate: projectData.startDate
          ? format(projectData.startDate.toDate(), 'yyyy-MM-dd')
          : '',
        endDate: projectData.endDate
          ? format(projectData.endDate.toDate(), 'yyyy-MM-dd')
          : ''
      });

      // Fetch invitations
      const invitationsData = await adminProjectInvitationService.getProjectInvitations(projectId);
      const now = new Date();
      for (const inv of invitationsData) {
        if (
          inv.status === 'pending' &&
          inv.requiredResponseDate &&
          inv.requiredResponseDate.toDate &&
          inv.requiredResponseDate.toDate() < now
        ) {
          await adminProjectInvitationService.expireInvitation(inv.id);
        }
      }
      // Re-fetch the invitations after expiring old ones:
      const updatedInvitations = await adminProjectInvitationService.getProjectInvitations(projectId);
      setInvitations(updatedInvitations);
    } catch (err) {
      setError('Failed to load project data');
      console.error('Error fetching project data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Inline editing functions
  const enableEditMode = () => {
    // Make a fresh copy of the current project with dates as strings
    setProjectEdits({
      ...project,
      startDate: project.startDate
        ? format(project.startDate.toDate(), 'yyyy-MM-dd')
        : '',
      endDate: project.endDate
        ? format(project.endDate.toDate(), 'yyyy-MM-dd')
        : ''
    });
    setEditMode(true);
  };

  const handleSaveEdits = async () => {
    try {
      // Convert date strings back to Firestore Timestamps
      const updatedData = {
        ...projectEdits,
        startDate: projectEdits.startDate
          ? Timestamp.fromDate(new Date(projectEdits.startDate))
          : null,
        endDate: projectEdits.endDate
          ? Timestamp.fromDate(new Date(projectEdits.endDate))
          : null
      };
      await adminProjectService.updateProject(projectId, updatedData);
      setProject(updatedData);
      setEditMode(false);
    } catch (err) {
      console.error('Error saving project changes:', err);
      setError('Failed to save project changes');
    }
  };

  const handleCancelEdits = () => {
    // Reset edits to original project data
    setProjectEdits({
      ...project,
      startDate: project.startDate
        ? format(project.startDate.toDate(), 'yyyy-MM-dd')
        : '',
      endDate: project.endDate
        ? format(project.endDate.toDate(), 'yyyy-MM-dd')
        : ''
    });
    setEditMode(false);
  };

  // Status change
  const handleStatusChange = async () => {
    if (!statusAction) return;
    try {
      switch (statusAction) {
        case 'start':
          await adminProjectService.updateProjectStatus(projectId, 'active');
          break;
        case 'archive':
          await adminProjectService.archiveProject(projectId);
          break;
        case 'end':
          await adminProjectService.endProject(projectId);
          break;
        case 'unarchive':
          await adminProjectService.unarchiveProject(projectId);
          break;
        default:
          break;
      }
      await fetchProjectData();
      setStatusAction(null);
      setShowStatusModal(false);
    } catch (err) {
      console.error('Error updating project status:', err);
    }
  };

  const handleDeleteProject = async () => {
    try {
      await adminProjectService.deleteProject(projectId);
      navigate('/admin/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      case 'ended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nosco-red"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          {error || 'Project not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/projects')}
        className="flex items-center text-nosco-text hover:text-nosco-red mb-4"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Projects
      </button>

      {/* Project Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          {editMode ? (
            <input
              type="text"
              value={projectEdits.name}
              onChange={(e) =>
                setProjectEdits({ ...projectEdits, name: e.target.value })
              }
              className="text-2xl font-semibold p-2 border rounded shadow-sm w-full"
            />
          ) : (
            <h1 className="text-2xl font-semibold">{project.name}</h1>
          )}
          <span
            className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
              project.status
            )}`}
          >
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </span>
        </div>

        <div className="flex gap-2">
          {/* If NOT in edit mode, and project is not ended/archived, show "Modify" + other status actions */}
          {!editMode && project.status !== 'ended' && project.status !== 'archived' ? (
            <>
              <button
                onClick={enableEditMode}
                className="bg-nosco-red hover:bg-nosco-red-dark text-white px-4 py-2 rounded-md"
              >
                Modify
              </button>
              {project.status === 'draft' && (
                <button
                  onClick={() => {
                    setStatusAction('start');
                    setShowStatusModal(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                >
                  Start Project
                </button>
              )}
              {(project.status === 'active' || project.status === 'draft') && (
                <button
                  onClick={() => {
                    setStatusAction('archive');
                    setShowStatusModal(true);
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                >
                  Archive Project
                </button>
              )}
              {project.status === 'active' && (
                <button
                  onClick={() => {
                    setStatusAction('end');
                    setShowStatusModal(true);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                >
                  End Project
                </button>
              )}
            </>
          ) : editMode ? (
            // If in edit mode, show Save/Cancel
            <>
              <button
                onClick={handleSaveEdits}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdits}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
            </>
            ) : project.status === 'archived' ? (
              // If project *is* archived, show "Unarchive" button
              <button
                onClick={() => { setStatusAction('unarchive'); setShowStatusModal(true); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                  Unarchive Project
              </button>
            ) : null}
        </div>
      </div>

      {/* Project Details Grid */}
      <div className="mt-4 grid grid-cols-2 gap-6">
        {/* Customer */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Customer</h3>
          {editMode ? (
            <input
              type="text"
              value={projectEdits.customer || ''}
              onChange={(e) =>
                setProjectEdits({ ...projectEdits, customer: e.target.value })
              }
              className="mt-1 block w-full p-2 border rounded"
            />
          ) : (
            <p className="mt-1 text-lg">{project.customer}</p>
          )}
        </div>

        {/* Location */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Location</h3>
          {editMode ? (
            <input
              type="text"
              value={projectEdits.location || ''}
              onChange={(e) =>
                setProjectEdits({ ...projectEdits, location: e.target.value })
              }
              className="mt-1 block w-full p-2 border rounded"
            />
          ) : (
            <p className="mt-1 text-lg">{project.location}</p>
          )}
        </div>

        {/* Department */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Department</h3>
          {editMode ? (
            <input
              type="text"
              value={projectEdits.department || ''}
              onChange={(e) =>
                setProjectEdits({ ...projectEdits, department: e.target.value })
              }
              className="mt-1 block w-full p-2 border rounded"
            />
          ) : (
            <p className="mt-1 text-lg">{project.department}</p>
          )}
        </div>

        {/* Project Duration */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Project Duration</h3>
          {editMode ? (
            <div className="flex flex-col space-y-2">
              <div>
                <label className="text-xs text-gray-500">Start Date</label>
                <input
                  type="date"
                  value={projectEdits.startDate || ''}
                  onChange={(e) =>
                    setProjectEdits({ ...projectEdits, startDate: e.target.value })
                  }
                  className="mt-1 block w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">End Date</label>
                <input
                  type="date"
                  value={projectEdits.endDate || ''}
                  onChange={(e) =>
                    setProjectEdits({ ...projectEdits, endDate: e.target.value })
                  }
                  className="mt-1 block w-full p-2 border rounded"
                />
              </div>
            </div>
          ) : (
            <p className="mt-1">
              {format(project.startDate.toDate(), 'MMM d, yyyy')} -{' '}
              {format(project.endDate.toDate(), 'MMM d, yyyy')}
            </p>
          )}
        </div>

        {/* Description */}
        {project.description !== undefined && (
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm col-span-2">
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            {editMode ? (
              <textarea
                value={projectEdits.description || ''}
                onChange={(e) =>
                  setProjectEdits({
                    ...projectEdits,
                    description: e.target.value
                  })
                }
                className="mt-1 block w-full p-2 border rounded"
                rows={4}
              />
            ) : (
              <p className="mt-1 whitespace-pre-wrap">{project.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Project Invitations Section */}
      {project.status !== 'archived' && (
        <div className="mt-8 bg-white p-6 rounded-md shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Project Invitations</h2>

            {/* Hide "Invite Worker" if ended or archived */}
            {project.status !== 'ended' && project.status !== 'archived' && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-nosco-red hover:bg-nosco-red-dark text-white px-4 py-2 rounded-md transition-colors duration-200"
              >
                Invite Worker
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invited On</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Nudge</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No invitations found.
                    </td>
                  </tr>
                ) : (
                  invitations.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inv.user?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {inv.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {inv.createdAt && inv.createdAt.toDate
                          ? format(inv.createdAt.toDate(), 'MMM d, yyyy')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {inv.lastNudgeSent && inv.lastNudgeSent.toDate
                          ? format(inv.lastNudgeSent.toDate(), 'MMM d, yyyy')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {/* Always show a Details button */}
                        <button
                          onClick={() => openDetailsModal(inv)}  // You need to implement openDetailsModal (or reuse your existing details handler)
                          className="text-gray-600 hover:text-gray-900 inline-flex items-center mr-2"
                        >
                          Details
                        </button>
                        
                        {inv.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleNudge(inv.id)}
                              className="text-blue-600 hover:text-blue-900 inline-flex items-center mr-2"
                            >
                              Nudge
                            </button>
                            <button
                              onClick={() => handleCancelInvitation(inv.id)}
                              className="text-red-600 hover:text-red-900 inline-flex items-center"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {inv.status === 'accepted' && (
                          <>
                            <button
                              onClick={() => handleCancelInvitation(inv.id)}
                              className="text-red-600 hover:text-red-900 inline-flex items-center"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {inv.status === 'rejected' && (
                          <>
                            <button
                              onClick={() => handleRetryInvitation(inv.id)}
                              className="text-green-600 hover:text-green-900 inline-flex items-center"
                            >
                              Retry
                            </button>
                          </>
                        )}

                        {inv.status === 'cancelled' && (
                          <>
                            <button
                              onClick={() => handleReinstateInvitation(inv.id)}
                              className="text-green-600 hover:text-green-900 inline-flex items-center"
                            >
                              Reinstate
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      <Modal
        isOpen={showStatusModal && statusAction}
        onClose={() => {
          setShowStatusModal(false);
          setStatusAction(null);
        }}
        title={`Confirm ${
          statusAction
            ? statusAction.charAt(0).toUpperCase() + statusAction.slice(1)
            : ''
        } Project`}
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

      {/* Invite Worker Modal */}
      {showInviteModal && (
        <InviteWorkerModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onInvite={async (userId, message) => {
            try {
              await adminProjectInvitationService.createInvitation(
                projectId,
                userId,
                message
              );
              await fetchProjectData();
              setShowInviteModal(false);
            } catch (err) {
              console.error('Error inviting worker:', err);
            }
          }}
          projectId={projectId} // Pass projectId here!
          existingWorkers={project.workers ? Object.keys(project.workers) : []}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project"
      >
        <div className="p-6">
          <p className="mb-4 text-gray-700">
            Are you sure you want to delete this project? This action cannot be
            undone.
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

      {selectedInvitation && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedInvitation(null)}
          title="Invitation Details"
        >
          <div className="p-6">
            <p><strong>Worker:</strong> {selectedInvitation.user?.name || 'Unknown'}</p>
            <p><strong>Status:</strong> {selectedInvitation.status}</p>
            <p>
              <strong>Invited On:</strong>{' '}
              {selectedInvitation.createdAt && selectedInvitation.createdAt.toDate
                ? format(selectedInvitation.createdAt.toDate(), 'MMM d, yyyy')
                : '-'}
            </p>
            <p>
              <strong>Required Response:</strong>{' '}
              {selectedInvitation.requiredResponseDate && selectedInvitation.requiredResponseDate.toDate
                ? format(selectedInvitation.requiredResponseDate.toDate(), 'MMM d, yyyy')
                : '-'}
            </p>
            <p><strong>Message:</strong> {selectedInvitation.message}</p>
            {selectedInvitation.cancelReason && (
              <p><strong>Cancel Reason:</strong> {selectedInvitation.cancelReason}</p>
            )}
            {/* NEW: Show declineReason if it exists */}
            {selectedInvitation.declineReason && (
              <p>
                <strong>Decline Reason:</strong> {selectedInvitation.declineReason}
              </p>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedInvitation(null)}
                className="px-4 py-2 bg-nosco-red hover:bg-nosco-red-dark text-white rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProjectDetailsPage;
