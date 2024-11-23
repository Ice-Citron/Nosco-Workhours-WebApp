import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';

const WorkHoursFilterModal = ({ 
  isOpen, 
  onClose, 
  onApplyFilters,
  projects = [],
  workers = [],
  activeFilters = {} // Add this prop
}) => {
  const [filters, setFilters] = useState({
    projectId: '',
    workerId: '',
    dateFrom: '',
    dateTo: '',
    regularHoursMin: '',
    regularHoursMax: '',
    overtime15xMin: '',
    overtime15xMax: '',
    overtime20xMin: '',
    overtime20xMax: ''
  });

  // Update filters when modal is opened with active filters
  useEffect(() => {
    if (isOpen && activeFilters) {
      setFilters(prev => ({
        ...prev,
        ...activeFilters
      }));
    }
  }, [isOpen, activeFilters]);

  const handleReset = () => {
    setFilters({
      projectId: '',
      workerId: '',
      dateFrom: '',
      dateTo: '',
      regularHoursMin: '',
      regularHoursMax: '',
      overtime15xMin: '',
      overtime15xMax: '',
      overtime20xMin: '',
      overtime20xMax: ''
    });
  };

  const handleApply = () => {
    // Clean up empty filters
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    onApplyFilters(cleanFilters);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Advanced Filters"
    >
      <div className="space-y-6 px-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <select
              value={filters.projectId}
              onChange={(e) => setFilters(prev => ({ ...prev, projectId: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-nosco-red focus:ring-nosco-red"
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Worker
            </label>
            <select
              value={filters.workerId}
              onChange={(e) => setFilters(prev => ({ ...prev, workerId: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-nosco-red focus:ring-nosco-red"
            >
              <option value="">All Workers</option>
              {workers.map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-nosco-red focus:ring-nosco-red"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-nosco-red focus:ring-nosco-red"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hours Range
          </label>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Regular Hours Min
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={filters.regularHoursMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, regularHoursMin: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-nosco-red focus:ring-nosco-red"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Regular Hours Max
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={filters.regularHoursMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, regularHoursMax: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-nosco-red focus:ring-nosco-red"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Overtime (1.5x) Min
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={filters.overtime15xMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, overtime15xMin: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-nosco-red focus:ring-nosco-red"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Overtime (1.5x) Max
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={filters.overtime15xMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, overtime15xMax: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-nosco-red focus:ring-nosco-red"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Overtime (2.0x) Min
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={filters.overtime20xMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, overtime20xMin: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-nosco-red focus:ring-nosco-red"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Overtime (2.0x) Max
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={filters.overtime20xMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, overtime20xMax: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-nosco-red focus:ring-nosco-red"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Reset Filters
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-white bg-nosco-red border border-transparent rounded-md hover:bg-nosco-red-dark"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default WorkHoursFilterModal;