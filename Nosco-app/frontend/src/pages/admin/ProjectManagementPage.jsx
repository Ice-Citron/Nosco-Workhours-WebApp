// src/pages/admin/ProjectManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import AddProjectForm from '../../components/admin/projects/AddProjectForm';
import Table from '../../components/common/Table';
import Tab from './../../components/admin/projects/ProjectsTab'; // Add this import
import { adminProjectService } from '../../services/adminProjectService';
import { useNavigate } from 'react-router-dom';

const ProjectManagementPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('draft');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await adminProjectService.getProjects();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError('Failed to load projects');
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredProjects = () => {
    return projects.filter(p => p.status === activeTab);
  };

  const getTabs = () => {
    const counts = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {});

    return [
      { id: 'draft', label: 'Draft', count: counts.draft || 0 },
      { id: 'active', label: 'Active', count: counts.active || 0 },
      { id: 'ended', label: 'Ended', count: counts.ended || 0 },
      { id: 'archived', label: 'Archived', count: counts.archived || 0 }
    ];
  };

  const columns = [
    {
      header: 'NAME',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-nosco-text">{row.original.name}</div>
          <div className="text-sm text-gray-500">
            {Object.keys(row.original.workers || {}).length} workers assigned
          </div>
        </div>
      )
    },
    {
      header: 'CUSTOMER',
      accessorKey: 'customer'
    },
    {
      header: 'COUNTRY',
      accessorKey: 'location'
    },
    {
      header: 'DATES',
      cell: ({ row }) => (
        <div>
          <div className="text-sm">
            Start: {format(row.original.startDate.toDate(), 'MMM d, yyyy')}
          </div>
          <div className="text-sm">
            End: {format(row.original.endDate.toDate(), 'MMM d, yyyy')}
          </div>
        </div>
      )
    },
    {
      header: 'STATUS',
      accessorKey: 'status',
      cell: ({ getValue }) => (
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          getValue() === 'active' 
            ? 'bg-green-100 text-green-800'
            : getValue() === 'draft'
            ? 'bg-yellow-100 text-yellow-800'
            : getValue() === 'archived'
            ? 'bg-gray-100 text-gray-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {getValue()}
        </span>
      )
    }
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Project Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-nosco-red hover:bg-nosco-red-dark text-white px-6 py-2 rounded-md transition-colors duration-200"
        >
          Add New Project
        </button>
      </div>

      <div className="mb-6">
        <Tab
          tabs={getTabs()}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <Table
          data={getFilteredProjects()}
          columns={columns}
          onRowClick={(row) => navigate(`/admin/projects/${row.id}/management`)}
          emptyMessage={`No ${activeTab} projects found`}
        />
      </div>

      {showAddModal && (
        <AddProjectForm
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onProjectAdded={fetchProjects}
        />
      )}
    </div>
  );
};

export default ProjectManagementPage;