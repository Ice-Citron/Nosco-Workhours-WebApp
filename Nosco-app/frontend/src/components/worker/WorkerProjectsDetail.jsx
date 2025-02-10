// src/components/worker/WorkerProjectsDetail.jsx
import React from 'react';
import Modal from '../../components/common/Modal';
import { format } from 'date-fns';

const WorkerProjectsDetail = ({ project, onClose }) => {
  if (!project) return null;

  // Assume project.startDate and project.endDate are either Date objects or ISO strings.
  const startDate = project.startDate ? new Date(project.startDate) : null;
  const endDate = project.endDate ? new Date(project.endDate) : null;

  return (
    <Modal isOpen={true} onClose={onClose} title="Project Details">
      <div className="p-4">
        <h2 className="text-2xl font-semibold">{project.name}</h2>
        <p className="mt-2 text-gray-600">
          <strong>Customer:</strong> {project.customer}
        </p>
        <p className="mt-2 text-gray-600">
          <strong>Location:</strong> {project.location}
        </p>
        <p className="mt-2 text-gray-600">
          <strong>Duration:</strong>{' '}
          {startDate ? format(startDate, 'MMM d, yyyy') : 'N/A'} -{' '}
          {endDate ? format(endDate, 'MMM d, yyyy') : 'N/A'}
        </p>
        {project.description && (
          <div className="mt-2">
            <strong>Description:</strong>
            <p className="text-gray-600">{project.description}</p>
          </div>
        )}
        <p className="mt-2 text-gray-600">
          <strong>Status:</strong> {project.status}
        </p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default WorkerProjectsDetail;
