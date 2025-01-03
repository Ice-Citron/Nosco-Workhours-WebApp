// src/components/admin/reports/ExpensesFilterBar.jsx
import React, { useState, useEffect } from 'react';
import adminExpenseService from '../../../services/adminExpenseService';

/**
 * A filter bar for Expenses:
 *  - Date range
 *  - Projects (multi-check)
 *  - Workers (multi-check)
 *  - Expense Types (multi-check)
 */
const ExpensesFilterBar = ({ onApply }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // multi-check states
  const [selectedProjectIDs, setSelectedProjectIDs] = useState([]);
  const [selectedWorkerIDs, setSelectedWorkerIDs] = useState([]);
  const [selectedExpenseTypes, setSelectedExpenseTypes] = useState([]);

  // fetched lists
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [proj, wks, exTypes] = await Promise.all([
          adminExpenseService.getProjects(),
          adminExpenseService.getWorkers(),
          adminExpenseService.getExpenseTypes(),
        ]);
        setProjects(proj);
        setWorkers(wks.filter((wk) => wk.role === 'worker'));
        setExpenseTypes(exTypes);
      } catch (err) {
        console.error('Error loading expense filter data:', err);
      }
    };
    fetchData();
  }, []);

  // Toggle / select all / deselect all for projects
  const toggleProject = (id) => {
    setSelectedProjectIDs((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };
  const selectAllProjects = () => {
    const all = projects.map((p) => p.id);
    setSelectedProjectIDs(all);
  };
  const deselectAllProjects = () => {
    setSelectedProjectIDs([]);
  };

  // Toggle / select all / deselect all for workers
  const toggleWorker = (id) => {
    setSelectedWorkerIDs((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };
  const selectAllWorkers = () => {
    const all = workers.map((w) => w.id);
    setSelectedWorkerIDs(all);
  };
  const deselectAllWorkers = () => {
    setSelectedWorkerIDs([]);
  };

  // Toggle / select all / deselect all for expense types
  const toggleExpenseType = (name) => {
    setSelectedExpenseTypes((prev) =>
      prev.includes(name) ? prev.filter((et) => et !== name) : [...prev, name]
    );
  };
  const selectAllExpenseTypes = () => {
    const all = expenseTypes.map((et) => et.name);
    setSelectedExpenseTypes(all);
  };
  const deselectAllExpenseTypes = () => {
    setSelectedExpenseTypes([]);
  };

  const handleApplyFilters = () => {
    const filters = {
      dateRange: {
        start: startDate || null,
        end: endDate || null,
      },
      projectIDs: selectedProjectIDs,
      workerIDs: selectedWorkerIDs,
      expenseTypes: selectedExpenseTypes,
    };
    onApply(filters);
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4 space-y-4">
      <h2 className="font-semibold text-lg">Expenses Filters</h2>

      {/* Date range */}
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

      {/* Multi-check sections */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Projects */}
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

        {/* Workers */}
        <div>
          <label className="block text-sm font-semibold mb-1">Workers</label>
          <div className="flex items-center gap-2 text-xs mb-2">
            <button onClick={selectAllWorkers} className="underline text-blue-600">
              Select All
            </button>
            <button onClick={deselectAllWorkers} className="underline text-blue-600">
              Deselect All
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
            {workers.map((w) => (
              <label key={w.id} className="flex items-center text-sm gap-2">
                <input
                  type="checkbox"
                  checked={selectedWorkerIDs.includes(w.id)}
                  onChange={() => toggleWorker(w.id)}
                />
                <span>{w.name || w.id}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Expense Types */}
        <div>
          <label className="block text-sm font-semibold mb-1">Expense Types</label>
          <div className="flex items-center gap-2 text-xs mb-2">
            <button onClick={selectAllExpenseTypes} className="underline text-blue-600">
              Select All
            </button>
            <button onClick={deselectAllExpenseTypes} className="underline text-blue-600">
              Deselect All
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
            {expenseTypes.map((et) => (
              <label key={et.id} className="flex items-center text-sm gap-2">
                <input
                  type="checkbox"
                  checked={selectedExpenseTypes.includes(et.name)}
                  onChange={() => toggleExpenseType(et.name)}
                />
                <span>{et.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <button
        className="bg-nosco-red text-white px-4 py-2 rounded"
        onClick={handleApplyFilters}
      >
        Apply
      </button>
    </div>
  );
};

export default ExpensesFilterBar;
