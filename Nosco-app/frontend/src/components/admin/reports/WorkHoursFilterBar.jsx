// src/components/admin/reports/WorkHoursFilterBar.jsx
import React, { useState, useEffect } from 'react';
import adminExpenseService from '../../../services/adminExpenseService'; 
// or wherever you fetch projects/workers

/**
 * Filter bar for Work Hours CSV:
 *  - Single worker selection (dropdown)
 *  - Multi-check projects
 *  - Date range
 *  - Possibly a "status" filter if you want to see rejected/approved
 */
const WorkHoursFilterBar = ({ onApply }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Single-select worker
  const [selectedWorkerID, setSelectedWorkerID] = useState('');

  // Multi-select projects
  const [selectedProjectIDs, setSelectedProjectIDs] = useState([]);

  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    // Load projects & workers from your service 
    // (maybe rename these calls if you have a separate place)
    const fetchData = async () => {
      try {
        const [proj, wks] = await Promise.all([
          adminExpenseService.getProjects(),
          adminExpenseService.getWorkers(),
        ]);
        setProjects(proj);
        // filter to role=worker so we don't show admins
        setWorkers(wks.filter((wk) => wk.role === 'worker'));
      } catch (err) {
        console.error('Error loading projects/workers:', err);
      }
    };
    fetchData();
  }, []);

  // Toggle multi-check for projects
  const toggleProject = (projID) => {
    setSelectedProjectIDs((prev) =>
      prev.includes(projID)
        ? prev.filter((id) => id !== projID)
        : [...prev, projID]
    );
  };
  const selectAllProjects = () => {
    const allIDs = projects.map((p) => p.id);
    setSelectedProjectIDs(allIDs);
  };
  const deselectAllProjects = () => {
    setSelectedProjectIDs([]);
  };

  const handleApplyFilters = () => {
    const filters = {
      dateRange: {
        start: startDate || null,
        end: endDate || null,
      },
      workerID: selectedWorkerID || null, 
      projectIDs: selectedProjectIDs, 
    };
    onApply(filters);
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4 space-y-4">
      <h2 className="font-semibold text-lg">Work Hours Filters</h2>

      {/* Date Range */}
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

      {/* Single-select Worker */}
      <div>
        <label className="block text-sm mb-1">Select Worker</label>
        <select
          className="border p-1 rounded w-full"
          value={selectedWorkerID}
          onChange={(e) => setSelectedWorkerID(e.target.value)}
        >
          <option value="">-- Choose a worker --</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name || w.id}
            </option>
          ))}
        </select>
      </div>

      {/* Multi-check Projects */}
      <div>
        <label className="block text-sm font-semibold mb-1">Projects</label>
        <div className="flex items-center gap-2 text-xs mb-2">
          <button onClick={selectAllProjects} className="underline text-blue-600">
            Select All
          </button>
          <button onClick={deselectAllProjects} className="underline text-blue-600">
            Deselect All
          </button>
        </div>
        <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
          {projects.map((p) => (
            <label key={p.id} className="flex items-center text-sm gap-2">
              <input
                type="checkbox"
                checked={selectedProjectIDs.includes(p.id)}
                onChange={() => toggleProject(p.id)}
              />
              <span>{p.name || p.id}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        className="bg-nosco-red text-white px-4 py-2 rounded mt-4"
        onClick={handleApplyFilters}
      >
        Apply
      </button>
    </div>
  );
};

export default WorkHoursFilterBar;
