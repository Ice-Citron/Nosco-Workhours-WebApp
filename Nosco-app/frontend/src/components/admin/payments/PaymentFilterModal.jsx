import React, { useState } from 'react';
import Modal from '../../common/Modal';
import InputField from '../../common/InputField';
import Button from '../../common/Button';
import { Calendar, Filter } from 'lucide-react';

const PaymentFilterModal = ({ isOpen, onClose, onApply, currentFilters }) => {
  const [filters, setFilters] = useState(currentFilters || {
    startDate: '',
    endDate: '',
    status: 'all',
    projectId: '',
  });

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Filter Payments"
    >
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
          />
          <InputField
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Statuses</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project ID
          </label>
          <input
            type="text"
            value={filters.projectId}
            onChange={(e) => setFilters(prev => ({ ...prev, projectId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter project ID"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button 
            onClick={() => {
              setFilters({
                startDate: '',
                endDate: '',
                status: 'all',
                projectId: '',
              });
            }}
            className="bg-gray-500"
          >
            Reset
          </Button>
          <Button onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentFilterModal;