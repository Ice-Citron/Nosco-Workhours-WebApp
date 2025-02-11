// src/pages/worker/WorkerProjectsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import WorkerProjectsDetail from '../../components/worker/WorkerProjectsDetail';
import WorkerProjectInvitations from '../../components/worker/WorkerProjectInvitations';
import { getWorkerProjects } from '../../services/workerProjectService';
import { getWorkerProjectInvitations } from '../../services/workerProjectInvitationService';

console.log("WorkerProjectsDetail:", WorkerProjectsDetail);
console.log("WorkerProjectInvitations:", WorkerProjectInvitations);

const WorkerProjectsPage = () => {
  const { user } = useAuth();
  console.log('Current user:', user);
  const [activeTab, setActiveTab] = useState('current');
  const [allProjects, setAllProjects] = useState([]);
  const [currentProjects, setCurrentProjects] = useState([]);
  const [historicalProjects, setHistoricalProjects] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  useEffect(() => {
    console.log("WorkerProjectsPage useEffect: user =", user);
    if (user) {
      fetchProjects();
      fetchInvitations();
    }
  }, [user]);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      console.log("Calling getWorkerProjects with UID:", user.uid);
      const projects = await getWorkerProjects(user.uid);
      console.log("Projects returned from service:", projects);
      setAllProjects(projects);
      const currentProj = projects.filter(
        (proj) => proj.status === 'draft' || proj.status === 'active'
      );
      const historicalProj = projects.filter(
        (proj) => proj.status === 'archived' || proj.status === 'ended'
      );
      setCurrentProjects(currentProj);
      setHistoricalProjects(historicalProj);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
    setLoadingProjects(false);
  };

  const fetchInvitations = async () => {
    setLoadingInvitations(true);
    try {
      const invs = await getWorkerProjectInvitations(user.uid);
      setInvitations(invs);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
    setLoadingInvitations(false);
  };

  const handleSelectActiveProject = async (projectId) => {
    console.log('Selected active project:', projectId);
    // TODO: Update the worker document with the selected currentActiveProject field.
  };

  const renderTabContent = () => {
    if (activeTab === 'current') {
      return (
        <div>
          {loadingProjects ? (
            <div>Loading projects...</div>
          ) : currentProjects.length === 0 ? (
            <div className="text-gray-500 text-center">
              No current projects found.
            </div>
          ) : (
            <div className="space-y-4">
              {currentProjects.map((project) => (
                <div
                  key={project.id}
                  className="border p-4 rounded shadow-sm flex flex-col md:flex-row md:items-center justify-between"
                >
                  <div>
                    <h3 className="text-xl font-semibold">{project.name}</h3>
                    <p className="text-gray-600">{project.customer}</p>
                  </div>
                  <div className="mt-2 md:mt-0 flex items-center space-x-3">
                    <button
                      onClick={() => handleSelectActiveProject(project.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    >
                      Set as Active
                    </button>
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="text-blue-500 hover:underline"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } else if (activeTab === 'historical') {
      return (
        <div>
          {loadingProjects ? (
            <div>Loading projects...</div>
          ) : historicalProjects.length === 0 ? (
            <div className="text-gray-500 text-center">
              No historical projects found.
            </div>
          ) : (
            <div className="space-y-4">
              {historicalProjects.map((project) => (
                <div
                  key={project.id}
                  className="border p-4 rounded shadow-sm flex flex-col md:flex-row md:items-center justify-between"
                >
                  <div>
                    <h3 className="text-xl font-semibold">{project.name}</h3>
                    <p className="text-gray-600">{project.customer}</p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="text-blue-500 hover:underline"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } else if (activeTab === 'invitations') {
      return (
        <WorkerProjectInvitations
          invitations={invitations}
          loading={loadingInvitations}
          refreshInvitations={fetchInvitations}
          user={user}
        />
      );
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">My Projects &amp; Invitations</h1>
      <div className="flex space-x-4 border-b mb-4">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'current'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Projects - Current
        </button>
        <button
          onClick={() => setActiveTab('historical')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'historical'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Projects - Historical
        </button>
        <button
          onClick={() => setActiveTab('invitations')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'invitations'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Project Invitations
        </button>
      </div>
      <div>{renderTabContent()}</div>
      {selectedProject && (
        <WorkerProjectsDetail
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
};

export default WorkerProjectsPage;
