// File: src/pages/worker/WorkerProjectDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getProjectDetails } from '../../services/workerProjectService'; 
// or wherever your "getProjectDetails" is

const WorkerProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjectDetails(projectId); 
      // or worker-friendly approach 
      setProject(data);
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError('Failed to load project data.');
    } finally {
      setLoading(false);
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
          {error || 'Project not found.'}
        </div>
      </div>
    );
  }

  // For convenience, parse the Firestore Timestamps:
  const startDate = project.startDate?.toDate?.() || null;
  const endDate = project.endDate?.toDate?.() || null;

  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/worker/projects')}
        className="flex items-center text-nosco-red hover:text-nosco-red-dark mb-4"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Projects
      </button>

      {/* Project Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <span className="inline-block px-3 py-1 mt-2 rounded-full text-sm font-medium bg-gray-200">
          {project.status}
        </span>
      </div>

      {/* Project Details */}
      <div className="grid grid-cols-2 gap-6">
        {/* Customer */}
        <div className="bg-gray-50 p-4 rounded shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Customer</h3>
          <p className="text-lg mt-1">{project.customer || 'N/A'}</p>
        </div>
        {/* Location */}
        <div className="bg-gray-50 p-4 rounded shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Location</h3>
          <p className="text-lg mt-1">{project.location || 'N/A'}</p>
        </div>
        {/* Department */}
        <div className="bg-gray-50 p-4 rounded shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Department</h3>
          <p className="text-lg mt-1">{project.department || 'N/A'}</p>
        </div>
        {/* Dates */}
        <div className="bg-gray-50 p-4 rounded shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Project Duration</h3>
          <p className="mt-1">
            {startDate ? format(startDate, 'MMM d, yyyy') : 'N/A'} -{' '}
            {endDate ? format(endDate, 'MMM d, yyyy') : 'N/A'}
          </p>
        </div>
        {/* Description */}
        {project.description && (
          <div className="col-span-2 bg-gray-50 p-4 rounded shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-1 text-gray-700 whitespace-pre-wrap">
              {project.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerProjectDetailPage;
