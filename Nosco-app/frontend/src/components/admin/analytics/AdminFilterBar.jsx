// src/components/admin/analytics/AdminFilterBar.jsx
import React, { useState, useEffect } from 'react';
import adminExpenseService from '../../../services/adminExpenseService';

const AdminFilterBar = ({ onApply, collapsible = false }) => {
  // Local state for date range
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // For multi-checkbox
  const [selectedProjectIDs, setSelectedProjectIDs] = useState([]);
  const [selectedWorkerIDs, setSelectedWorkerIDs] = useState([]);
  const [selectedExpenseTypes, setSelectedExpenseTypes] = useState([]);

  // For populating checkbox lists
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);

  // State to handle collapsing/hiding the checkbox sections
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    // Load project list, worker list, and expense types on mount
    const fetchData = async () => {
      try {
        const [proj, wks, exTypes] = await Promise.all([
          adminExpenseService.getProjects(),
          adminExpenseService.getWorkers(),
          adminExpenseService.getExpenseTypes(),
        ]);
        setProjects(proj);
        setWorkers(wks);
        setExpenseTypes(exTypes);
      } catch (err) {
        console.error('Error loading filter data:', err);
      }
    };
    fetchData();
  }, []);

  // ---------------------------
  // PROJECTS: Toggle / Select All / Deselect All
  // ---------------------------
  const handleToggleProject = (projectID) => {
    setSelectedProjectIDs((prev) =>
      prev.includes(projectID)
        ? prev.filter((id) => id !== projectID)
        : [...prev, projectID]
    );
  };

  const handleSelectAllProjects = () => {
    // Grab all project IDs
    const allIDs = projects.map((p) => p.id);
    setSelectedProjectIDs(allIDs);
  };
  const handleDeselectAllProjects = () => {
    setSelectedProjectIDs([]);
  };

  // ---------------------------
  // WORKERS: Toggle / Select All / Deselect All
  // ---------------------------
  const handleToggleWorker = (workerID) => {
    setSelectedWorkerIDs((prev) =>
      prev.includes(workerID)
        ? prev.filter((id) => id !== workerID)
        : [...prev, workerID]
    );
  };

  const handleSelectAllWorkers = () => {
    // Only workers with role === 'worker'
    const allWorkerIDs = workers
      .filter((w) => w.role === 'worker')
      .map((w) => w.id);
    setSelectedWorkerIDs(allWorkerIDs);
  };
  const handleDeselectAllWorkers = () => {
    setSelectedWorkerIDs([]);
  };

  // ---------------------------
  // EXPENSE TYPES: Toggle / Select All / Deselect All
  // ---------------------------
  const handleToggleExpenseType = (expenseName) => {
    setSelectedExpenseTypes((prev) =>
      prev.includes(expenseName)
        ? prev.filter((name) => name !== expenseName)
        : [...prev, expenseName]
    );
  };

  const handleSelectAllExpenseTypes = () => {
    const allTypes = expenseTypes.map((et) => et.name);
    setSelectedExpenseTypes(allTypes);
  };
  const handleDeselectAllExpenseTypes = () => {
    setSelectedExpenseTypes([]);
  };

  // ---------------------------
  // APPLY FILTERS
  // ---------------------------
  const handleApplyFilters = () => {
    // Build filter object
    const filters = {
      dateRange: {
        start: startDate || null,
        end: endDate || null,
      },
      projectIDs: selectedProjectIDs,      // array
      workerIDs: selectedWorkerIDs,        // array
      expenseTypes: selectedExpenseTypes,  // array
    };
    onApply(filters);
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-xl">Filters</h2>
        {collapsible && (
          <button
            className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        )}
      </div>

      {showFilters && (
        <>
          {/* 1) DATE RANGE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 2) PROJECT CHECKBOXES */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold">Projects</label>
                <div className="text-xs space-x-2">
                  <button
                    type="button"
                    className="underline text-blue-600"
                    onClick={handleSelectAllProjects}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="underline text-blue-600"
                    onClick={handleDeselectAllProjects}
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                {projects.map((p) => (
                  <label key={p.id} className="flex items-center text-sm gap-2">
                    <input
                      type="checkbox"
                      checked={selectedProjectIDs.includes(p.id)}
                      onChange={() => handleToggleProject(p.id)}
                    />
                    <span>{p.name || p.id}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 3) WORKER CHECKBOXES */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold">Workers</label>
                <div className="text-xs space-x-2">
                  <button
                    type="button"
                    className="underline text-blue-600"
                    onClick={handleSelectAllWorkers}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="underline text-blue-600"
                    onClick={handleDeselectAllWorkers}
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                {workers
                  .filter((w) => w.role === 'worker')
                  .map((w) => (
                    <label key={w.id} className="flex items-center text-sm gap-2">
                      <input
                        type="checkbox"
                        checked={selectedWorkerIDs.includes(w.id)}
                        onChange={() => handleToggleWorker(w.id)}
                      />
                      <span>{w.name || w.id}</span>
                    </label>
                  ))}
              </div>
            </div>

            {/* 4) EXPENSE TYPES CHECKBOXES */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold">Expense Types</label>
                <div className="text-xs space-x-2">
                  <button
                    type="button"
                    className="underline text-blue-600"
                    onClick={handleSelectAllExpenseTypes}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="underline text-blue-600"
                    onClick={handleDeselectAllExpenseTypes}
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                {expenseTypes.map((et) => (
                  <label key={et.id} className="flex items-center text-sm gap-2">
                    <input
                      type="checkbox"
                      checked={selectedExpenseTypes.includes(et.name)}
                      onChange={() => handleToggleExpenseType(et.name)}
                    />
                    <span>{et.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* APPLY BUTTON */}
          <div className="mt-4">
            <button
              className="bg-nosco-red text-white px-4 py-2 rounded"
              onClick={handleApplyFilters}
            >
              Apply Filters
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminFilterBar;
