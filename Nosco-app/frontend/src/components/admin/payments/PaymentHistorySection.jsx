// src/components/admin/payments/PaymentHistorySection.jsx
import React, { useState, useEffect } from 'react';
import Table from '../../common/Table';
import Button from '../../common/Button';
import PaymentFilterModal from './PaymentFilterModal';
import PaymentDetailsModal from './PaymentDetailsModal';
import { Clock, DollarSign, FileText, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';
import { adminPaymentService } from '../../../services/adminPaymentService';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebase_config';

const PaymentHistorySection = () => {
  const [payments, setPayments] = useState([]);
  const [usersMapping, setUsersMapping] = useState({});
  const [loading, setLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [filters, setFilters] = useState({});

  // Fetch payment history (completed and failed)
  useEffect(() => {
    const loadPaymentsHistory = async () => {
      try {
        setLoading(true);
        const history = await adminPaymentService.getPaymentsHistory();
        setPayments(history);
      } catch (error) {
        console.error('Error loading payment history:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPaymentsHistory();
  }, [filters]);

  // Fetch users and build mapping: userID -> user data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(firestore, 'users');
        const snapshot = await getDocs(usersRef);
        const mapping = {};
        snapshot.forEach((docSnap) => {
          mapping[docSnap.id] = docSnap.data();
        });
        setUsersMapping(mapping);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  const openPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setIsDetailsModalOpen(true);
  };

  // Define table columns. The first column shows the user name.
  const columns = [
    {
      header: "User",
      accessorKey: "userID",
      cell: ({ getValue }) => {
        const userID = getValue();
        const user = usersMapping[userID];
        return user ? user.name : userID;
      }
    },
    {
      header: "Payment Date",
      accessorKey: "updatedAt",
      cell: ({ getValue }) => {
        const date = getValue();
        return (
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-gray-500 mr-2" />
            <span>{format(date, 'MMM dd, yyyy')}</span>
          </div>
        );
      }
    },
    {
      header: "Total Amount",
      accessorKey: "amount",
      cell: ({ getValue }) => (
        <div className="flex items-center">
          <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
          <span>${Number(getValue()).toLocaleString()}</span>
        </div>
      )
    },
    {
      header: "Reference",
      accessorKey: "referenceNumber",
      cell: ({ getValue }) => (
        <div className="flex items-center">
          <FileText className="h-4 w-4 text-gray-500 mr-2" />
          <span className="text-sm font-mono">{getValue()}</span>
        </div>
      )
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ getValue }) => (
        <span className="px-2 py-1 rounded-full text-sm bg-green-100 text-green-800">
          {getValue()}
        </span>
      )
    },
    {
      header: "",
      id: "actions",
      cell: ({ row }) => (
        <button 
          onClick={() => openPaymentDetails(row.original)}
          className="text-nosco-red hover:text-nosco-red-dark"
        >
          View Details
        </button>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Found {payments.length} payments
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button
            onClick={() => {
              // Implement export functionality as needed
            }}
            className="flex items-center gap-2 bg-gray-500"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Table
        data={payments}
        columns={columns}
        emptyMessage="No payment history found"
        loading={loading}
      />

      <PaymentFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={setFilters}
        currentFilters={filters}
      />

      <PaymentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
        usersMapping={usersMapping}
      />
    </div>
  );
};

export default PaymentHistorySection;
