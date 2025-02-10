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
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    const [activeTab, setActiveTab] = useState('workHours');
    const [filters, setFilters] = useState({
      status: '',
      dateFrom: '',
      dateTo: '',
    });
  
    const itemsPerPage = 10;
  
    useEffect(() => {
      fetchWorkHours();
    }, [user]);
  
    const fetchWorkHours = async () => {
        try {
          if (!user?.uid) return;
          console.log('Fetching work hours for user:', user.uid);
      
          const workHoursRef = collection(firestore, 'workHours');
          const q = query(
            workHoursRef,
            where('userID', '==', user.uid),
            orderBy('date', 'desc')
          );
      
          const snapshot = await getDocs(q);
          console.log('Found documents:', snapshot.size); // Debug log
      
          const hours = await Promise.all(
            snapshot.docs.map(async (docSnapshot) => {
              const data = docSnapshot.data();
              console.log('Raw document data:', data); // Debug log
      
              // Fetch project details
              let projectName = 'Unknown Project';
              try {
                if (data.projectID) {
                  const projectRef = doc(firestore, 'projects', data.projectID);
                  const projectDoc = await getDoc(projectRef);
                  if (projectDoc.exists()) {
                    projectName = projectDoc.data().name;
                  }
                }
              } catch (err) {
                console.error('Error fetching project:', err);
              }
      
              // Return the formatted data
              return {
                id: docSnapshot.id,
                ...data,
                date: data.date?.toDate() || new Date(),
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
                approvalDate: data.approvalDate?.toDate(),
                projectName,
                // Ensure numeric fields are properly parsed
                regularHours: parseFloat(data.regularHours) || 0,
                overtime15x: parseFloat(data.overtime15x) || 0,
                overtime20x: parseFloat(data.overtime20x) || 0
              };
            })
          );
      
          console.log('Processed hours:', hours); // Debug log
          setWorkHours(hours);
        } catch (err) {
          console.error('Detailed error:', err);
          setError('Failed to fetch work hours history');
        } finally {
          setLoading(false);
        }
    };
  
    const handleSort = (key) => {
      setSortConfig({
        key,
        direction:
          sortConfig.key === key && sortConfig.direction === 'asc'
            ? 'desc'
            : 'asc',
      });
    };
  
    const handleFilter = (e) => {
      const { name, value } = e.target;
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
      setCurrentPage(1);
    };
  
    const filteredData = workHours.filter(entry => {
      const matchesStatus = !filters.status || entry.status === filters.status;
      const matchesDateFrom = !filters.dateFrom || entry.date >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || entry.date <= new Date(filters.dateTo);
      return matchesStatus && matchesDateFrom && matchesDateTo;
    });
  
    const sortedData = [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  
    const paginatedData = sortedData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  
    const exportToCSV = () => {
      const headers = ['Date', 'Project', 'Regular Hours', 'OT 1.5x', 'OT 2.0x', 'Total Hours', 'Status', 'Remarks'];
      const csvContent = [
        headers.join(','),
        ...filteredData.map(row => [
          row.date.toLocaleDateString(),
          row.projectName,
          row.regularHours,
          row.overtime15x || 0,
          row.overtime20x || 0,
          (parseFloat(row.regularHours) + parseFloat(row.overtime15x || 0) + parseFloat(row.overtime20x || 0)).toFixed(1),
          row.status,
          `"${row.remarks || ''}"`
        ].join(','))
      ].join('\n');
  
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `work_hours_history_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    };
  
    const columns = [
        {
          header: 'Date',
          accessorKey: 'date',
          cell: (info) => info.getValue().toLocaleDateString(),
        },
        {
          header: 'Project',
          accessorKey: 'projectName',
        },
        {
          header: 'Regular Hours',
          accessorKey: 'regularHours',
          cell: (info) => parseFloat(info.getValue() || 0).toFixed(1),
        },
        {
          header: 'OT 1.5x',
          accessorKey: 'overtime15x',
          cell: (info) => info.getValue() ? parseFloat(info.getValue()).toFixed(1) : '-',
        },
        {
          header: 'OT 2.0x',
          accessorKey: 'overtime20x',
          cell: (info) => info.getValue() ? parseFloat(info.getValue()).toFixed(1) : '-',
        },
        {
          header: 'Total Hours',
          accessorFn: (row) => {
            return (
              parseFloat(row.regularHours || 0) +
              parseFloat(row.overtime15x || 0) +
              parseFloat(row.overtime20x || 0)
            ).toFixed(1);
          },
        },
        {
          header: 'Status',
          accessorKey: 'status',
          cell: (info) => (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                info.getValue() === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : info.getValue() === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {info.getValue()}
            </span>
          ),
        }
    ];

    // Add this new component
    const TabButton = ({ id, label, active }) => (
        <button
        onClick={() => setActiveTab(id)}
        className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors duration-150 ${
            active 
            ? 'bg-blue-100 text-blue-700' 
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
        >
        {label}
        </button>
    );
  
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
  
    // Modify the return statement
    return (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Work Hours History</h1>
            <button
              onClick={exportToCSV}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
              onRowClick={(row) => {
                setSelectedEntry(row);
                setIsModalOpen(true);
              }}
            />
      
            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage * itemsPerPage >= filteredData.length}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredData.length)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{filteredData.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from(
                      { length: Math.ceil(filteredData.length / itemsPerPage) },
                      (_, i) => i + 1
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
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
              <div className="space-y-4">
                {/* ... rest of your modal content stays the same ... */}
              </div>
            )}
          </Modal>
        </div>
    );
};

export default WorkHoursHistoryPage;