// File: src/pages/worker/WorkerProjectsPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { parseISO } from 'date-fns';
import WorkerProjectsDetail from '../../components/worker/WorkerProjectsDetail';
import WorkerProjectInvitations from '../../components/worker/WorkerProjectInvitations';

// Import your service functions
import {
  getWorkerProjects,
  setCurrentActiveProject,
} from '../../services/workerProjectService';
import { getWorkerProjectInvitations } from '../../services/workerProjectInvitationService';

const WorkerProjectsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // We keep the user's current active project ID in local React state.
  // This ensures any changes to it will cause a re-render.
  const [currentActiveProject, setCurrentActiveProjectId] = useState(null);

  // List states
  const [allProjects, setAllProjects] = useState([]);
  const [currentProjects, setCurrentProjects] = useState([]);
  const [historicalProjects, setHistoricalProjects] = useState([]);
  const [invitations, setInvitations] = useState([]);

  // UI states
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('current');
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  // Historical filter states
  const [historicalStatusFilter, setHistoricalStatusFilter] = useState('all'); // 'all' | 'ended' | 'archived'
  const [historicalFromDate, setHistoricalFromDate] = useState('');
  const [historicalToDate, setHistoricalToDate] = useState('');

  // 1) On initial load (and whenever `user` changes), load both:
  //    - The user's current active project from the doc (if not already stored)
  //    - The projects
  //    - The invitations
  useEffect(() => {
    if (!user?.uid) return;
    console.log('WorkerProjectsPage useEffect: user =', user.uid);

    // If the user doc has currentActiveProject (from AuthContext or doc),
    // store it in local state. If it's missing, set null.
    const docField = user.currentActiveProject || null;
    setCurrentActiveProjectId(docField);

    // Now fetch everything
    fetchProjects();
    fetchInvitations();
  }, [user]);

  // 2) fetchProjects: gets all worker projects, splits them into current vs historical
  const fetchProjects = async () => {
    if (!user?.uid) return;
    setLoadingProjects(true);
    try {
      const projects = await getWorkerProjects(user.uid);
      console.log('Projects returned from service:', projects);
      setAllProjects(projects);

      // Separate into current vs. historical by status
      const currentProj = projects.filter(
        (p) => p.status === 'draft' || p.status === 'active'
      );
      const historicalProj = projects.filter(
        (p) => p.status === 'archived' || p.status === 'ended'
      );
      setCurrentProjects(currentProj);
      setHistoricalProjects(historicalProj);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
    setLoadingProjects(false);
  };

  // 3) fetchInvitations: get the worker’s invitations
  const fetchInvitations = async () => {
    if (!user?.uid) return;
    setLoadingInvitations(true);
    try {
      const invs = await getWorkerProjectInvitations(user.uid);
      setInvitations(invs);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    }
    setLoadingInvitations(false);
  };

  // 4) handleSelectActiveProject: sets the active project in Firestore, then updates local state
  const handleSelectActiveProject = async (projectId) => {
    console.log('Selected active project:', projectId);
    if (!user?.uid) return;

    try {
      // This calls setCurrentActiveProject, which updates Firestore and returns fresh user doc data
      const updatedUserData = await setCurrentActiveProject(user.uid, projectId);

      // If the service returns the new user data, set local state to that field
      setCurrentActiveProjectId(updatedUserData?.currentActiveProject || null);

      // Optionally re-fetch projects so the top portion updates
      fetchProjects();
    } catch (error) {
      console.error('Error setting active project:', error);
    }
  };

  // 5) getFilteredHistoricalProjects: applies status/date filters
  const getFilteredHistoricalProjects = () => {
    let filtered = [...historicalProjects];

    // Status filter
    if (historicalStatusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === historicalStatusFilter);
    }

    // Date range filter (using project.endDate)
    const fromDate = historicalFromDate ? parseISO(historicalFromDate) : null;
    const toDate = historicalToDate ? parseISO(historicalToDate) : null;

    if (fromDate || toDate) {
      filtered = filtered.filter((p) => {
        const end = p.endDate?.toDate?.();
        if (!end) return false;
        if (fromDate && end < fromDate) return false;
        if (toDate && end > toDate) return false;
        return true;
      });
    }

    return filtered;
  };

  // 6) Render the tab content
  const renderTabContent = () => {
    if (activeTab === 'current') {
      // The currently active project ID is from our local state
      const otherCurrentProjects = currentProjects.filter(
        (p) => p.id !== currentActiveProject
      );

      return (
        <div>
          {loadingProjects ? (
            <div>Loading projects...</div>
          ) : (
            <>
              {/* TOP BOX - Current Project */}
              {currentActiveProject ? (
                <div className="mb-6 p-4 border rounded shadow-sm">
                  <h2 className="text-xl font-bold text-nosco-red">
                    Current Project
                  </h2>

                  {/* Attempt to find that project ID in currentProjects */}
                  {currentProjects.find((proj) => proj.id === currentActiveProject) ? (
                    (() => {
                      const proj = currentProjects.find((p) => p.id === currentActiveProject);
                      return (
                        // Wrap in a flex container
                        <div className="mt-2 flex items-center justify-between">
                        {/* Left side: project info */}
                        <div>
                          <h3 className="text-lg font-semibold">{proj.name}</h3>
                          <p className="text-gray-600">{proj.customer}</p>
                          <p className="text-sm text-gray-500">
                            Start: {proj.startDate?.toDate()?.toLocaleDateString()} - End: {proj.endDate?.toDate()?.toLocaleDateString()}
                          </p>
                        </div>

                        {/* Right side: 'View Details' button */}
                        <button
                          onClick={() => navigate(`/worker/projects/${proj.id}/details`)}
                          className="text-nosco-red hover:underline"
                        >
                          View Details
                        </button>
                      </div>
                      );
                    })()
                  ) : (
                    <div className="text-gray-500">
                      Active project not found in projects list.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-center mb-4">
                  You have not set any project as active.
                </div>
              )}

              {/* BOTTOM LIST - Other current projects */}
              <div className="mb-2">
                <h2 className="text-xl font-bold">Other Current Projects</h2>
              </div>

              {otherCurrentProjects.length === 0 ? (
                <div className="text-gray-500 text-center">
                  No other current projects found.
                </div>
              ) : (
                <div className="space-y-4">
                  {otherCurrentProjects.map((project) => (
                    <div
                      key={project.id}
                      className="border p-4 rounded shadow-sm flex flex-col md:flex-row md:items-center justify-between"
                    >
                      <div>
                        <h3 className="text-xl font-semibold">{project.name}</h3>
                        <p className="text-gray-600">{project.customer}</p>
                      </div>
                      <div className="mt-2 md:mt-0 flex items-center space-x-2">
                        <button
                          onClick={() => handleSelectActiveProject(project.id)}
                          className="bg-nosco-red hover:bg-nosco-red-dark text-white px-4 py-2 rounded"
                        >
                          Set as Active
                        </button>
                        <button
                          onClick={() => navigate(`/worker/projects/${project.id}/details`)}
                          className="text-nosco-red hover:underline"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      );
    }
    else if (activeTab === 'historical') {
      const filtered = getFilteredHistoricalProjects();
      return (
        <div>
          {loadingProjects ? (
            <div>Loading projects...</div>
          ) : filtered.length === 0 ? (
            <div className="text-gray-500 text-center">
              No historical projects found.
            </div>
          ) : (
            <>
              {/* Sub-filter UI */}
              <div className="mb-4 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Status:</label>
                  <select
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    value={historicalStatusFilter}
                    onChange={(e) => setHistoricalStatusFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="ended">Ended</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">From:</label>
                  <input
                    type="date"
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    value={historicalFromDate}
                    onChange={(e) => setHistoricalFromDate(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">To:</label>
                  <input
                    type="date"
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    value={historicalToDate}
                    onChange={(e) => setHistoricalToDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filtered.map((p) => (
                  <div
                    key={p.id}
                    className="border p-4 rounded shadow-sm flex flex-col md:flex-row md:items-center justify-between"
                  >
                    <div>
                      <h3 className="text-xl font-semibold">{p.name}</h3>
                      <p className="text-gray-600">{p.customer}</p>
                      <p className="text-sm text-gray-500">
                        Start: {p.startDate?.toDate?.().toLocaleDateString()} -{' '}
                        End: {p.endDate?.toDate?.().toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">Status: {p.status}</p>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <button
                        onClick={() => navigate(`/worker/projects/${p.id}/details`)}
                        className="text-nosco-red hover:underline"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );
    }
    else if (activeTab === 'invitations') {
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
              ? 'border-nosco-red text-nosco-red'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Projects - Current
        </button>
        <button
          onClick={() => setActiveTab('historical')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'historical'
              ? 'border-nosco-red text-nosco-red'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Projects - Historical
        </button>
        <button
          onClick={() => setActiveTab('invitations')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'invitations'
              ? 'border-nosco-red text-nosco-red'
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
