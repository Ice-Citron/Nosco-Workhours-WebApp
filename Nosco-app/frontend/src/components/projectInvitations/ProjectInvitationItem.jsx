import React from 'react';

const ProjectInvitationItem = ({ 
  invitation, 
  onAccept, 
  onDecline, 
  onViewDetails,
  isAccepted = false
}) => {
  const { project, invitationDate } = invitation;

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{project.name}</h3>
          <p className="text-gray-600">{project.customer}</p>
        </div>
        {!isAccepted && (
          <div className="space-x-2">
            <button
              onClick={() => onAccept(invitation.id)}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Accept
            </button>
            <button
              onClick={() => onDecline(invitation.id)}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Decline
            </button>
          </div>
        )}
      </div>

      <div className="mt-2 space-y-1">
        <p className="text-sm">
          <span className="font-medium">Location:</span> {project.location}
        </p>
        <p className="text-sm">
          <span className="font-medium">Duration:</span>{' '}
          {new Date(project.startDate).toLocaleDateString()} -{' '}
          {new Date(project.endDate).toLocaleDateString()}
        </p>
      </div>

      <div className="mt-3 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {isAccepted ? 'Accepted on: ' : 'Invited on: '}
          {new Date(invitationDate).toLocaleDateString()}
        </span>
        <button
          onClick={() => onViewDetails(project)}
          className="text-blue-500 hover:text-blue-600 text-sm"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default ProjectInvitationItem;