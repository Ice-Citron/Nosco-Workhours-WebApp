// src/components/admin/reports/ProjectsFilterBar.jsx
import React, { useState, useEffect } from 'react';
import adminExpenseService from '../../../services/adminExpenseService';

/**
 * A filter bar for Projects:
 *  - Date range
 *  - Statuses (multi-check)
 *  - Locations (multi-check)
 *  - Projects (multi-check)
 */
const ProjectsFilterBar = ({ onApply }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // For statuses
  const [statusOptions, setStatusOptions] = useState(['active', 'completed', 'onHold']);
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  // For locations
  const [locationOptions, setLocationOptions] = useState(['Singapore', 'Malaysia', 'Remote']);
  const [selectedLocations, setSelectedLocations] = useState([]);

  // For projects
  const [projects, setProjects] = useState([]);
  const [selectedProjectIDs, setSelectedProjectIDs] = useState([]);

  // If your 'projects' collection or a service can dynamically fetch statuses/locations, 
  // you can do so here. 
  useEffect(() => {
    // Example: fetch from your service. 
    // If you have a dedicated "adminProjectService.getProjects()" you can use that instead.
    const fetchData = async () => {
      try {
        // We can reuse adminExpenseService.getProjects() if it returns an array of { id, name }.
        const projList = await adminExpenseService.getProjects();
        setProjects(projList);
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    };
    fetchData();
  }, []);

  /* ---------------------------
   * Toggle / SelectAll for Statuses
   * -------------------------*/
  const toggleStatus = (st) => {
    setSelectedStatuses((prev) =>
      prev.includes(st) ? prev.filter((x) => x !== st) : [...prev, st]
    );
  };
  const selectAllStatus = () => setSelectedStatuses(statusOptions);
  const deselectAllStatus = () => setSelectedStatuses([]);

  /* ---------------------------
   * Toggle / SelectAll for Locations
   * -------------------------*/
  const toggleLocation = (loc) => {
    setSelectedLocations((prev) =>
      prev.includes(loc) ? prev.filter((x) => x !== loc) : [...prev, loc]
    );
  };
  const selectAllLocations = () => setSelectedLocations(locationOptions);
  const deselectAllLocations = () => setSelectedLocations([]);

  /* ---------------------------
   * Toggle / SelectAll for Projects
   * -------------------------*/
  const toggleProject = (projID) => {
    setSelectedProjectIDs((prev) =>
      prev.includes(projID) ? prev.filter((x) => x !== projID) : [...prev, projID]
    );
  };
  const selectAllProjects = () => {
    const allIDs = projects.map((p) => p.id);
    setSelectedProjectIDs(allIDs);
  };
  const deselectAllProjects = () => setSelectedProjectIDs([]);

  /* ---------------------------
   * APPLY FILTERS
   * -------------------------*/
  const handleApplyFilters = () => {
    const filters = {
      dateRange: {
        start: startDate || null,
        end: endDate || null,
      },
      statuses: selectedStatuses,
      locations: selectedLocations,
      projectIDs: selectedProjectIDs,
    };
    onApply(filters);
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4 space-y-4">
      <h2 className="font-semibold mb-2 text-lg">Projects Filters</h2>

      {/* Row 1: Date Range in 2 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Start Date</label>
          <input
            type="date"
            className="border p-1 rounded w-full"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">End Date</label>
          <input
            type="date"
            className="border p-1 rounded w-full"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Row 2: 3 columns for Statuses, Locations, Projects */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1) Statuses */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-semibold">Statuses</label>
            <div className="text-xs space-x-2">
              <button onClick={selectAllStatus} className="underline text-blue-600">
                Select All
              </button>
              <button onClick={deselectAllStatus} className="underline text-blue-600">
                Deselect All
              </button>
            </div>
          </div>
          <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-1">
            {statusOptions.map((st) => (
              <label key={st} className="flex items-center text-sm gap-2">
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(st)}
                  onChange={() => toggleStatus(st)}
                />
                <span>{st}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 2) Locations */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-semibold">Locations</label>
            <div className="text-xs space-x-2">
              <button onClick={selectAllLocations} className="underline text-blue-600">
                Select All
              </button>
              <button onClick={deselectAllLocations} className="underline text-blue-600">
                Deselect All
              </button>
            </div>
          </div>
          <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-1">
            {locationOptions.map((loc) => (
              <label key={loc} className="flex items-center text-sm gap-2">
                <input
                  type="checkbox"
                  checked={selectedLocations.includes(loc)}
                  onChange={() => toggleLocation(loc)}
                />
                <span>{loc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 3) Projects */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-semibold">Projects</label>
            <div className="text-xs space-x-2">
              <button onClick={selectAllProjects} className="underline text-blue-600">
                Select All
              </button>
              <button onClick={deselectAllProjects} className="underline text-blue-600">
                Deselect All
              </button>
            </div>
          </div>
          <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-1">
            {projects.map((proj) => (
              <label key={proj.id} className="flex items-center text-sm gap-2">
                <input
                  type="checkbox"
                  checked={selectedProjectIDs.includes(proj.id)}
                  onChange={() => toggleProject(proj.id)}
                />
                <span>{proj.name || proj.id}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Apply Button */}
      <button
        className="bg-nosco-red text-white px-4 py-2 rounded mt-2"
        onClick={handleApplyFilters}
      >
        Apply
      </button>
    </div>
  );
};

export default ProjectsFilterBar;
