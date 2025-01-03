// src/components/admin/reports/ProjectsFilterBar.jsx
import React, { useState, useEffect } from 'react';
import adminExpenseService from '../../../services/adminExpenseService';

/**
 * A filter bar for Projects:
 *  - date range
 *  - statuses (multi-check?)
 *  - locations (multi-check?)
 */
const ProjectsFilterBar = ({ onApply }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // multi-check states for statuses or locations if you want
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);

  // fetched lists for statuses/locations
  const [statusOptions, setStatusOptions] = useState(['active', 'completed', 'onHold']); 
  const [locationOptions, setLocationOptions] = useState(['Singapore', 'Malaysia', 'Remote']);

  // If your 'projects' collection has dynamic statuses/locations, you might fetch them
  // For example, if you want to fetch all possible statuses from Firestore, do so here
  useEffect(() => {
    // Example: in reality, fetch from your service or a separate collection
    // setStatusOptions([...]);
    // setLocationOptions([...]);
  }, []);

  // toggles
  const toggleStatus = (st) => {
    setSelectedStatuses((prev) =>
      prev.includes(st) ? prev.filter((x) => x !== st) : [...prev, st]
    );
  };
  const selectAllStatus = () => setSelectedStatuses(statusOptions);
  const deselectAllStatus = () => setSelectedStatuses([]);

  const toggleLocation = (loc) => {
    setSelectedLocations((prev) =>
      prev.includes(loc) ? prev.filter((x) => x !== loc) : [...prev, loc]
    );
  };
  const selectAllLocations = () => setSelectedLocations(locationOptions);
  const deselectAllLocations = () => setSelectedLocations([]);

  // finalize filters
  const handleApplyFilters = () => {
    const filters = {
      dateRange: {
        start: startDate || null,
        end: endDate || null,
      },
      statuses: selectedStatuses,
      locations: selectedLocations,
    };
    onApply(filters);
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4 space-y-4">
      <h2 className="font-semibold mb-2 text-lg">Projects Filters</h2>

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

      {/* Statuses */}
      <div>
        <label className="block text-sm font-semibold mb-1">Statuses</label>
        <div className="flex items-center gap-2 text-xs mb-2">
          <button onClick={selectAllStatus} className="underline text-blue-600">
            Select All
          </button>
          <button onClick={deselectAllStatus} className="underline text-blue-600">
            Deselect All
          </button>
        </div>
        <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
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

      {/* Locations */}
      <div>
        <label className="block text-sm font-semibold mb-1">Locations</label>
        <div className="flex items-center gap-2 text-xs mb-2">
          <button onClick={selectAllLocations} className="underline text-blue-600">
            Select All
          </button>
          <button onClick={deselectAllLocations} className="underline text-blue-600">
            Deselect All
          </button>
        </div>
        <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
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

      <button
        className="bg-nosco-red text-white px-4 py-2 rounded mt-4"
        onClick={handleApplyFilters}
      >
        Apply
      </button>
    </div>
  );
};

export default ProjectsFilterBar;
