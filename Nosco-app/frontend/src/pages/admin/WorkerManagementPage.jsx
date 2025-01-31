// src/pages/admin/WorkerManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminUserService } from '../../services/adminUserService';
import Table from '../../components/common/Table';
import Tab from '../../components/admin/projects/ProjectsTab'; 
  // or wherever your Tab component is
import AddWorkerForm from '../../components/admin/workers/AddWorkerForm';

const WorkerManagementPage = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // We'll replicate the "tab" concept, e.g. 'active' vs 'archived'
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const data = await adminUserService.getWorkers(); 
      // assume this returns ALL workers, both active + archived
      setWorkers(data);
      setError(null);
    } catch (err) {
      setError('Failed to load workers');
      console.error('Error loading workers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Build tabs: "Active" / "Archived" & their counts
  const getTabs = () => {
    const counts = workers.reduce((acc, w) => {
      // w.status might be 'active' or 'archived'
      acc[w.status] = (acc[w.status] || 0) + 1;
      return acc;
    }, {});

    return [
      { id: 'active', label: 'Active', count: counts.active || 0 },
      { id: 'archived', label: 'Archived', count: counts.archived || 0 },
    ];
  };

  // Filter the workers by the selected tab
  const getFilteredWorkers = () => {
    return workers.filter((w) => w.status === activeTab);
  };

  // We'll define columns for the table, similar to how you do in ProjectManagementPage
  const columns = [
    {
      header: 'NAME',
      cell: ({ row }) => {
        const worker = row.original;
        return (
          <div>
            <div className="font-medium text-nosco-text">{worker.name}</div>
            <div className="text-sm text-gray-500">{worker.position}</div>
          </div>
        );
      },
    },
    {
      header: 'EMAIL',
      accessorKey: 'email',
    },
    {
      header: 'DEPARTMENT',
      accessorKey: 'department',
    },
    {
      header: 'STATUS',
      accessorKey: 'status',
      cell: ({ getValue }) => (
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            getValue() === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {getValue()}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nosco-red"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header & Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Worker Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-nosco-red hover:bg-nosco-red-dark text-white px-6 py-2 rounded-md transition-colors duration-200"
        >
          Add New Worker
        </button>
      </div>

      {/* Tab bar like the project approach */}
      <div className="mb-6">
        <Tab
          tabs={getTabs()}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Table listing workers for the current tab */}
      <div className="bg-white rounded-lg shadow-sm">
        <Table
          data={getFilteredWorkers()}
          columns={columns}
          emptyMessage={`No ${activeTab} workers found`}
          onRowClick={(row) => navigate(`/admin/workers/${row.id}`)}
        />
      </div>

      {/* Add Worker Modal */}
      {showAddModal && (
        <AddWorkerForm
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onWorkerAdded={fetchWorkers}
        />
      )}
    </div>
  );
};

export default WorkerManagementPage;
