import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import AddProjectForm from '../../components/admin/projects/AddProjectForm';
import ProjectDetailsModal from '../../components/admin/projects/ProjectDetailsModal';
import { adminProjectService } from '../../services/adminProjectService';
import { useNavigate } from 'react-router-dom';

const ProjectManagementPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await adminProjectService.getProjects();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError('Failed to load projects');
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEndProject = async (projectId) => {
    try {
      await adminProjectService.updateProjectStatus(projectId, 'ended');
      await fetchProjects();
    } catch (err) {
      console.error('Error ending project:', err);
    }
  };

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const handleManage = (projectId) => {
    navigate(`/admin/projects/${projectId}/management`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nosco-red"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Project Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-nosco-red hover:bg-nosco-red-dark text-white px-6 py-2 rounded-md transition-colors duration-200"
        >
          Add New Project
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 text-nosco-text font-medium">NAME</th>
              <th className="text-left p-4 text-nosco-text font-medium">CUSTOMER</th>
              <th className="text-left p-4 text-nosco-text font-medium">COUNTRY</th>
              <th className="text-left p-4 text-nosco-text font-medium">DATES</th>
              <th className="text-left p-4 text-nosco-text font-medium">STATUS</th>
              <th className="text-left p-4 text-nosco-text font-medium">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b">
                <td className="p-4">
                  <div className="font-medium text-nosco-text">{project.name}</div>
                  <div className="text-sm text-gray-500">
                    {project.assignedWorkers?.length || 0} workers assigned
                  </div>
                </td>
                <td className="p-4 text-nosco-text">{project.customer}</td>
                <td className="p-4 text-nosco-text">{project.country}</td>
                <td className="p-4 text-nosco-text">
                  <div className="text-sm">
                    Start: {format(project.startDate.toDate(), 'MMM d, yyyy')}
                  </div>
                  <div className="text-sm">
                    End: {format(project.endDate.toDate(), 'MMM d, yyyy')}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    project.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {project.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleManage(project.id)}
                      className="px-4 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
                    >
                      Manage
                    </button>
                    {project.status === 'active' && (
                      <button
                        onClick={() => handleEndProject(project.id)}
                        className="px-4 py-1 rounded bg-red-50 text-nosco-red hover:bg-red-100 transition-colors duration-200"
                      >
                        End Project
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddProjectForm
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onProjectAdded={fetchProjects}
        />
      )}

      {showDetailsModal && selectedProject && (
        <ProjectDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedProject(null);
          }}
          project={selectedProject}
          onProjectUpdated={fetchProjects}
        />
      )}
    </div>
  );
};

export default ProjectManagementPage;