import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { firestore } from '../../firebase/firebase_config';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid]);

    const fetchExpenses = async () => {
        try {
            if (!user?.uid) return;
            console.log('Current user:', user);

            const expensesRef = collection(firestore, 'expense');
            const q = query(
                expensesRef,
                where('userID', '==', user.uid),
                orderBy('date', 'desc')
            );

            const snapshot = await getDocs(q);
            console.log('Query response:', {
                empty: snapshot.empty,
                size: snapshot.size
            });

            const expensesData = await Promise.all(
                snapshot.docs.map(async (docSnapshot) => {
                    const data = docSnapshot.data();
                    console.log('Processing document:', docSnapshot.id);

                    // Safely handle date conversions
                    const safeToDate = (timestamp) => {
                        try {
                            return timestamp?.toDate() || new Date();
                        } catch (error) {
                            console.error('Date conversion error:', error);
                            return new Date();
                        }
                    };

                    // Safely get project name
                    let projectName = 'General Expense';
                    if (data.projectID) {
                        try {
                            const projectRef = doc(firestore, 'projects', data.projectID);
                            const projectDoc = await getDoc(projectRef);
                            if (projectDoc.exists()) {
                                projectName = projectDoc.data().name;
                            }
                        } catch (err) {
                            console.error('Error fetching project:', err);
                        }
                    }

                    // Create processed document with safe defaults
                    const processedDoc = {
                        id: docSnapshot.id,
                        date: safeToDate(data.date),
                        createdAt: safeToDate(data.createdAt),
                        updatedAt: data.updatedAt ? safeToDate(data.updatedAt) : null,
                        approvalDate: data.approvalDate ? safeToDate(data.approvalDate) : null,
                        amount: parseFloat(data.amount) || 0,
                        currency: data.currency || 'USD',
                        expenseType: data.expenseType || 'Other',
                        status: data.status || 'pending',
                        description: data.description || '',
                        projectName,
                        adminComments: data.adminComments || '',
                        receipts: Array.isArray(data.receipts) ? data.receipts : [],
                        // NEW FIELD:
                        paid: data.paid ?? false, // default false if missing
                    };

                    console.log('Processed document:', processedDoc);
                    return processedDoc;
                })
            );

            console.log('Final processed expenses:', expensesData);
            setExpenses(expensesData);
            setError(null);
        } catch (err) {
            console.error('Error in fetchExpenses:', err);
            setError('Failed to fetch expense history');
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value
        }));
        setCurrentPage(1);
    };

    const exportToCSV = () => {
        // Removed the 'Points' column
        const headers = ['Date', 'Type', 'Amount', 'Currency', 'Project', 'Status', 'Paid', 'Description'];
        const csvContent = [
            headers.join(','),
            ...filteredData.map((row) => [
                row.date.toLocaleDateString(),
                row.expenseType,
                row.amount.toFixed(2),
                row.currency,
                row.projectName,
                row.status,
                row.paid ? 'Yes' : 'No', // or 'Paid'/'Unpaid'
                // Notice we just skip points
                `"${row.description || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `expense_history_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // TABLE COLUMNS
    const columns = [
        {
            header: 'Date',
            accessorKey: 'date',
            cell: (info) => {
                try {
                    return info.getValue()?.toLocaleDateString() || 'N/A';
                } catch (error) {
                    console.error('Error formatting date:', error);
                    return 'Invalid Date';
                }
            },
        },
        {
            header: 'Type',
            accessorKey: 'expenseType',
            cell: (info) => info.getValue() || 'N/A',
        },
        {
            header: 'Amount',
            accessorKey: 'amount',
            cell: (info) => {
                try {
                    const amount = info.getValue();
                    const currency = info.row?.original?.currency || 'USD';
                    return `${amount?.toFixed(2) || '0.00'} ${currency}`;
                } catch (error) {
                    console.error('Error formatting amount:', error);
                    return '0.00';
                }
            },
        },
        {
            header: 'Project',
            accessorKey: 'projectName',
            cell: (info) => info.getValue() || 'N/A',
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (info) => {
                const status = info.getValue();
                return (
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                            status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                        {status || 'pending'}
                    </span>
                );
            },
        },
        // NEW COLUMN: "Paid"
        {
            header: 'Paid',
            accessorKey: 'paid',
            cell: (info) => {
                const isPaid = info.getValue();
                return isPaid ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Paid
                    </span>
                ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Unpaid
                    </span>
                );
            },
        },
    ];

    // FILTER AND SORT
    const filteredData = expenses.filter((entry) => {
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
                {console.log('Data being passed to Table:', {
                    paginatedData,
                    columns,
                    firstRow: paginatedData[0]
                })}

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
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage((prev) => prev + 1)}
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
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Date</p>
                                <p className="mt-1">
                                    {selectedEntry.date.toLocaleDateString()}
                                </p>
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
                                <p className="mt-1 text-gray-700">
                                    {selectedEntry.description}
                                </p>
                            </div>
                        )}

                        {selectedEntry.receipts && selectedEntry.receipts.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-2">
                                    Receipts
                                </p>
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
                                <p className="text-sm font-medium text-gray-500">
                                    Admin Comments
                                </p>
                                <p className="mt-1 text-gray-700">
                                    {selectedEntry.adminComments}
                                </p>
                            </div>
                        )}

                        {selectedEntry.status === 'rejected' && selectedEntry.rejectionReason && (
                            <div className="bg-red-50 p-4 rounded-md">
                                <p className="text-sm font-medium text-red-800">
                                    Rejection Reason
                                </p>
                                <p className="mt-1 text-red-700">
                                    {selectedEntry.rejectionReason}
                                </p>
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

                        {/* Optionally show the paid/unpaid status here if desired */}
                        <div>
                            <p className="text-sm font-medium text-gray-500">Payment Status</p>
                            <span
                                className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                    selectedEntry.paid
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                                {selectedEntry.paid ? 'Paid' : 'Unpaid'}
                            </span>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ExpenseHistoryPage;
