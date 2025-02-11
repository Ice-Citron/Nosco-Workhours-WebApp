// src/pages/worker/WorkHoursHistoryPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from './../../context/AuthContext';
import { firestore } from './../../firebase/firebase_config';
import { collection, query, where, orderBy, getDocs, getDoc, doc } from 'firebase/firestore';
import Table from './../../components/common/Table';
import Modal from './../../components/common/Modal';

const WorkHoursHistoryPage = () => {
  const [workHours, setWorkHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting & filters
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [filters, setFilters] = useState({ status: '', dateFrom: '', dateTo: '' });
  const itemsPerPage = 10;

  useEffect(() => {
    if (user?.uid) {
      fetchWorkHours();
    }
  }, [user]);

  const fetchWorkHours = async () => {
    try {
      const workHoursRef = collection(firestore, 'workHours');
      // Use userID
      const q = query(
        workHoursRef,
        where('userID', '==', user.uid),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      const hours = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();

          // Attempt to fetch project name
          let projectName = 'Unknown Project';
          if (data.projectID) {
            const projectRef = doc(firestore, 'projects', data.projectID);
            const projectDoc = await getDoc(projectRef);
            if (projectDoc.exists()) {
              projectName = projectDoc.data().name;
            }
          }

          return {
            id: docSnapshot.id,
            ...data,
            date: data.date?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || null,
            updatedAt: data.updatedAt?.toDate() || null,
            approvalDate: data.approvalDate?.toDate() || null,
            projectName,
            regularHours: parseFloat(data.regularHours) || 0,
            overtime15x: parseFloat(data.overtime15x) || 0,
            overtime20x: parseFloat(data.overtime20x) || 0,
            paid: data.paid ?? false,
            approvedBy: data.approvedBy || '',
            rejectionReason: data.rejectionReason || '',
            paymentReference: data.paymentReference || '',
          };
        })
      );
      setWorkHours(hours);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch work hours:', err);
      setError('Failed to fetch work hours history');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Filtering
  const filteredData = workHours.filter(entry => {
    const matchesStatus = !filters.status || entry.status === filters.status;
    const matchesDateFrom = !filters.dateFrom || entry.date >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || entry.date <= new Date(filters.dateTo);
    return matchesStatus && matchesDateFrom && matchesDateTo;
  });

  // Sorting
  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // CSV Export
  const exportToCSV = () => {
    const headers = [
      'Date',
      'Project',
      'Regular Hours',
      'OT 1.5x',
      'OT 2.0x',
      'Total Hours',
      'Status',
      'Paid',
      'Approved By',
      'Remarks'
    ];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [
        row.date.toLocaleDateString(),
        row.projectName,
        row.regularHours,
        row.overtime15x,
        row.overtime20x,
        (row.regularHours + row.overtime15x + row.overtime20x).toFixed(1),
        row.status,
        row.paid ? 'Yes' : 'No',
        row.approvedBy,
        `"${row.remarks || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `work_hours_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Table columns
  const columns = [
    {
      header: 'Date',
      accessorKey: 'date',
      cell: info => info.getValue().toLocaleDateString()
    },
    {
      header: 'Project',
      accessorKey: 'projectName'
    },
    {
      header: 'Regular Hours',
      accessorKey: 'regularHours',
      cell: info => info.getValue().toFixed(1)
    },
    {
      header: 'OT 1.5x',
      accessorKey: 'overtime15x',
      cell: info => info.getValue() > 0 ? info.getValue().toFixed(1) : '-'
    },
    {
      header: 'OT 2.0x',
      accessorKey: 'overtime20x',
      cell: info => info.getValue() > 0 ? info.getValue().toFixed(1) : '-'
    },
    {
      header: 'Total Hours',
      accessorFn: row => (row.regularHours + row.overtime15x + row.overtime20x).toFixed(1)
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: info => {
        const val = info.getValue();
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              val === 'approved'
                ? 'bg-green-100 text-green-800'
                : val === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {val}
          </span>
        );
      }
    },
    {
      // New "Paid?" column
      header: 'Paid?',
      accessorKey: 'paid',
      cell: info => info.getValue() ? 'Yes' : 'No'
    },
    {
      // New "Approved By" column
      header: 'Approved By',
      accessorKey: 'approvedBy'
    }
  ];

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Work Hours History</h1>
        <button
          onClick={exportToCSV}
          className="bg-nosco-red text-white px-4 py-2 rounded hover:bg-nosco-red-dark"
        >
          Export to CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilter}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleFilter}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleFilter}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          data={paginatedData}
          columns={columns}
          emptyMessage="No work hours records found"
          onRowClick={row => {
            setSelectedEntry(row);
            setIsModalOpen(true);
          }}
        />

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          {/* ... same pagination as you already had ... */}
          {/* ... not repeating for brevity ... */}
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEntry(null);
        }}
        title="Work Hours Details"
      >
        {selectedEntry && (
          <div className="p-4 space-y-4">
            <p><strong>Date:</strong> {selectedEntry.date.toLocaleDateString()}</p>
            <p><strong>Project:</strong> {selectedEntry.projectName}</p>
            <p><strong>Regular Hours:</strong> {selectedEntry.regularHours}</p>
            <p><strong>OT 1.5x:</strong> {selectedEntry.overtime15x}</p>
            <p><strong>OT 2.0x:</strong> {selectedEntry.overtime20x}</p>
            <p><strong>Total Hours:</strong> {(selectedEntry.regularHours + selectedEntry.overtime15x + selectedEntry.overtime20x).toFixed(1)}</p>
            <p><strong>Status:</strong> {selectedEntry.status}</p>
            <p><strong>Paid?:</strong> {selectedEntry.paid ? 'Yes' : 'No'}</p>
            <p><strong>Approved By:</strong> {selectedEntry.approvedBy || '-'}</p>
            {selectedEntry.paymentReference && (
              <p><strong>Payment Reference:</strong> {selectedEntry.paymentReference}</p>
            )}
            {selectedEntry.rejectionReason && (
              <p className="text-red-600"><strong>Rejection Reason:</strong> {selectedEntry.rejectionReason}</p>
            )}
            {selectedEntry.remarks && (
              <p><strong>Remarks:</strong> {selectedEntry.remarks}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WorkHoursHistoryPage;
