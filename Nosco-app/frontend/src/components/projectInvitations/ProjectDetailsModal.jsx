import React from 'react';

const ProjectDetailsModal = ({ project, onClose }) => {
  if (!project) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-semibold">{project.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <h3 className="font-medium text-lg">Customer</h3>
              <p>{project.customer}</p>
            </div>

            <div>
              <h3 className="font-medium text-lg">Location</h3>
              <p>{project.location}</p>
            </div>

            <div>
              <h3 className="font-medium text-lg">Duration</h3>
              <p>
                {new Date(project.startDate).toLocaleDateString()} -{' '}
                {new Date(project.endDate).toLocaleDateString()}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-lg">Description</h3>
              <p className="whitespace-pre-line">{project.description}</p>
            </div>

            <div>
              <h3 className="font-medium text-lg">Status</h3>
              <p className="capitalize">{project.status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsModal;