// src/pages/admin/WorkerManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminUserService } from '../../services/adminUserService';
import Table from '../../components/common/Table';
import AddWorkerForm from '../../components/admin/workers/AddWorkerForm';
import AddAdminForm from '../../components/admin/admins/AddAdminForm';
import Modal from '../../components/common/Modal';
import AdminDetailsModal from '../../components/admin/admins/AdminDetailsModal';

// New TabsBar component for four tabs
const TabsBar = ({ tabs, activeTab, onChange }) => (
  <div className="border-b border-gray-200 mb-6">
    <nav className="-mb-px flex space-x-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors
            ${activeTab === tab.id 
              ? 'border-nosco-red text-nosco-red' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  </div>
);

const WorkerManagementPage = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('workerActive');
  const [showWorkerAddModal, setShowWorkerAddModal] = useState(false);
  const [showAdminAddModal, setShowAdminAddModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // New function to refresh both workers and admins
  const fetchData = async () => {
    try {
      setLoading(true);
      const workersData = await adminUserService.getWorkers();
      const adminsData = await adminUserService.getAdmins();
      setWorkers(workersData);
      setAdmins(adminsData);
      setError(null);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Build tabs with counts for each category
  const getTabs = () => {
    const workerActiveCount = workers.filter(u => u.status === 'active').length;
    const workerArchivedCount = workers.filter(u => u.status === 'archived').length;
    const adminActiveCount = admins.filter(u => u.status === 'active').length;
    const adminArchivedCount = admins.filter(u => u.status === 'archived').length;
    return [
      { id: 'workerActive', label: `Worker - Active (${workerActiveCount})` },
      { id: 'workerArchived', label: `Worker - Archived (${workerArchivedCount})` },
      { id: 'adminActive', label: `Admin - Active (${adminActiveCount})` },
      { id: 'adminArchived', label: `Admin - Archived (${adminArchivedCount})` },
    ];
  };

  // Filter users by the selected tab
  const getFilteredUsers = () => {
    if (activeTab === 'workerActive' || activeTab === 'workerArchived') {
      return workers.filter(u => u.status === (activeTab === 'workerActive' ? 'active' : 'archived'));
    } else {
      return admins.filter(u => u.status === (activeTab === 'adminActive' ? 'active' : 'archived'));
    }
  };

  // Base columns for both workers and admins
  const baseColumns = [
    {
      header: 'NAME',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div>
            <div className="font-medium text-nosco-text">{user.name}</div>
            <div className="text-sm text-gray-500">{user.position}</div>
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

  // If current tab is one of the admin tabs, add an "Actions" column
  const columns =
    activeTab === 'adminActive' || activeTab === 'adminArchived'
      ? [
          ...baseColumns,
          {
            header: 'ACTIONS',
            cell: ({ row }) => {
              const admin = row.original;
              return (
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newStatus = admin.status === 'active' ? 'archived' : 'active';
                      adminUserService.updateWorkerStatus(admin.id, newStatus)
                        .then(() => fetchData())
                        .catch(err => console.error('Error updating admin status:', err));
                    }}
                    className="px-3 py-1 rounded bg-nosco-red text-white hover:bg-nosco-red-dark"
                  >
                    {admin.status === 'active' ? 'Archive' : 'Unarchive'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAdmin(admin);
                    }}
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    More Details
                  </button>
                </div>
              );
            },
          },
        ]
      : baseColumns;

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">User Management</h1>
        {activeTab === 'workerActive' && (
          <button
            onClick={() => setShowWorkerAddModal(true)}
            className="bg-nosco-red hover:bg-nosco-red-dark text-white px-6 py-2 rounded-md transition-colors duration-200"
          >
            Add New Worker
          </button>
        )}
        {activeTab === 'adminActive' && (
          <button
            onClick={() => setShowAdminAddModal(true)}
            className="bg-nosco-red hover:bg-nosco-red-dark text-white px-6 py-2 rounded-md transition-colors duration-200"
          >
            Add New Admin
          </button>
        )}
      </div>

      {/* Tab Bar */}
      <TabsBar tabs={getTabs()} activeTab={activeTab} onChange={setActiveTab} />

      {/* Table Listing Users */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <Table
          data={getFilteredUsers()}
          columns={columns}
          emptyMessage={`No ${activeTab} users found`}
          onRowClick={(user) => {
            if (user.role === 'worker') {
              navigate(`/admin/workers/${user.id}`);
            } else {
              setSelectedAdmin(user);
            }
          }}
        />
      </div>

      {/* Modals */}
      {showWorkerAddModal && (
        <AddWorkerForm
          isOpen={showWorkerAddModal}
          onClose={() => setShowWorkerAddModal(false)}
          onWorkerAdded={fetchData}
        />
      )}
      {showAdminAddModal && (
        <AddAdminForm
          isOpen={showAdminAddModal}
          onClose={() => setShowAdminAddModal(false)}
          onAdminAdded={fetchData}
        />
      )}
      {selectedAdmin && (
        <AdminDetailsModal
          admin={selectedAdmin}
          onClose={() => setSelectedAdmin(null)}
        />
      )}
    </div>
  );
};

export default WorkerManagementPage;
