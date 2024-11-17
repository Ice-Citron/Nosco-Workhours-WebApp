import React, { useState, useEffect } from 'react';
import { useAuth } from './../context/AuthContext';
import { firestore } from './../firebase/firebase_config';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import Table from './../components/common/Table';
import Modal from './../components/common/Modal';

const ExpenseHistoryPage = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [filters, setFilters] = useState({
        status: '',
        dateFrom: '',
        dateTo: '',
    });

    const itemsPerPage = 10;

    useEffect(() => {
        fetchExpenses();
    }, [user]);

    const fetchExpenses = async () => {
        try {
            if (!user?.uid) return;
            console.log('Fetching expenses for user:', user.uid);

            const expensesRef = collection(firestore, 'expenses');
            const q = query(
                expensesRef,
                where('userID', '==', user.uid),
                orderBy('date', 'desc')
            );

            const snapshot = await getDocs(q);
            console.log('Found documents:', snapshot.size);

            const expensesData = await Promise.all(
                snapshot.docs.map(async (docSnapshot) => {
                    const data = docSnapshot.data();
                    console.log('Raw document data:', data);

                    // Fetch project details if expense is linked to a project
                    let projectName = 'General Expense';
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

                    return {
                        id: docSnapshot.id,
                        ...data,
                        date: data.date?.toDate() || new Date(),
                        createdAt: data.createdAt?.toDate(),
                        updatedAt: data.updatedAt?.toDate(),
                        approvalDate: data.approvalDate?.toDate(),
                        projectName,
                        amount: parseFloat(data.amount) || 0
                    };
                })
            );

            console.log('Processed expenses:', expensesData);
            setExpenses(expensesData);
        } catch (err) {
            console.error('Detailed error:', err);
            setError('Failed to fetch expense history');
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        setCurrentPage(1);
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Type', 'Amount', 'Currency', 'Project', 'Status', 'Points', 'Description'];
        const csvContent = [
            headers.join(','),
            ...filteredData.map(row => [
                row.date.toLocaleDateString(),
                row.expenseType,
                row.amount.toFixed(2),
                row.currency,
                row.projectName,
                row.status,
                row.pointsAwarded || 0,
                `"${row.description || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `expense_history_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const columns = [
        {
            header: 'Date',
            accessorKey: 'date',
            cell: (info) => info.getValue().toLocaleDateString(),
        },
        {
            header: 'Type',
            accessorKey: 'expenseType',
        },
        {
            header: 'Amount',
            accessorKey: 'amount',
            cell: (info) => (
                <span>
                    {info.getValue().toFixed(2)} {info.row.original.currency}
                </span>
            ),
        },
        {
            header: 'Project',
            accessorKey: 'projectName',
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
        },
        {
            header: 'Points',
            accessorKey: 'pointsAwarded',
            cell: (info) => info.getValue() || '-',
        },
    ];

    const filteredData = expenses.filter(entry => {
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
                <h1 className="text-2xl font-bold">Expense History</h1>
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
                    emptyMessage="No expense records found"
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
                title="Expense Details"
            >
                {selectedEntry && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Date</p>
                                <p className="mt-1">{selectedEntry.date.toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Type</p>
                                <p className="mt-1">{selectedEntry.expenseType}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Amount</p>
                                <p className="mt-1">
                                    {selectedEntry.amount.toFixed(2)} {selectedEntry.currency}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Project</p>
                                <p className="mt-1">{selectedEntry.projectName}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500">Status</p>
                            <span
                                className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                    selectedEntry.status === 'approved'
                                        ? 'bg-green-100 text-green-800'
                                        : selectedEntry.status === 'rejected'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}
                            >
                                {selectedEntry.status}
                            </span>
                        </div>

                        {selectedEntry.description && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Description</p>
                                <p className="mt-1 text-gray-700">{selectedEntry.description}</p>
                            </div>
                        )}

                        {selectedEntry.receipts && selectedEntry.receipts.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-2">Receipts</p>
                                <div className="grid grid-cols-2 gap-4">
                                {selectedEntry.receipts.map((receipt, index) => (
                                    <a
                                        key={index}
                                        href={receipt}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                    >
                                        <img
                                            src={receipt}
                                            alt={`Receipt ${index + 1}`}
                                            className="w-full h-48 object-cover rounded-lg hover:opacity-90 transition-opacity"
                                        />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedEntry.adminComments && (
                        <div>
                            <p className="text-sm font-medium text-gray-500">Admin Comments</p>
                            <p className="mt-1 text-gray-700">{selectedEntry.adminComments}</p>
                        </div>
                    )}

                    {selectedEntry.status === 'rejected' && selectedEntry.rejectionReason && (
                        <div className="bg-red-50 p-4 rounded-md">
                            <p className="text-sm font-medium text-red-800">Rejection Reason</p>
                            <p className="mt-1 text-red-700">{selectedEntry.rejectionReason}</p>
                        </div>
                    )}

                    {selectedEntry.pointsAwarded && (
                        <div className="bg-green-50 p-4 rounded-md">
                            <p className="text-sm font-medium text-green-800">Points Awarded</p>
                            <p className="mt-1 text-green-700">{selectedEntry.pointsAwarded} points</p>
                        </div>
                    )}

                    {selectedEntry.approvedBy && selectedEntry.approvalDate && (
                        <div className="bg-gray-50 p-4 rounded-md">
                            <p className="text-sm text-gray-500">
                                Approved by: {selectedEntry.approvedBy}
                            </p>
                            <p className="text-sm text-gray-500">
                                Approval Date: {selectedEntry.approvalDate.toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    </div>
);
};

export default ExpenseHistoryPage;