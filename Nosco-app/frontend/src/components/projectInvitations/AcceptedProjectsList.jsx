import React from 'react';
import ProjectInvitationItem from './ProjectInvitationItem';

const AcceptedProjectsList = ({ 
  projects, 
  onViewDetails,
  isLoading,
  error 
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        Error loading projects: {error}
      </div>
    );
  }

  if (!projects?.length) {
    return (
      <div className="text-gray-500 p-4 text-center">
        No accepted projects
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <ProjectInvitationItem
          key={project.id}
          invitation={project}
          onViewDetails={onViewDetails}
          isAccepted={true}
        />
      ))}
    </div>
  );
};

export default AcceptedProjectsList;