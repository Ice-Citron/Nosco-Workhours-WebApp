import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Table from '../../common/Table';
import Button from '../../common/Button';
import Card from '../../common/Card';
import PaymentFilterModal from './PaymentFilterModal';
import PaymentDetailsModal from './PaymentDetailsModal'; // Add this import
import { Clock, DollarSign, User, FileText, Filter, Download } from 'lucide-react';
import { adminWorkHoursService } from '../../../services/adminWorkHoursService';

const PaymentHistorySection = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all',
    projectId: '',
  });

  useEffect(() => {
    loadPayments();
  }, [filters]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const paidHours = await adminWorkHoursService.getPaidWorkHours(filters);
      setPayments(paidHours);
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const openPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setIsDetailsModalOpen(true);
  };

  const columns = [
    {
      header: "Payment Date",
      accessorKey: "paymentDate",
      cell: ({ getValue }) => {
        const date = getValue();
        return (
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-gray-500 mr-2" />
            <span>{format(date.toDate(), 'MMM dd, yyyy')}</span>
          </div>
        );
      }
    },
    {
      header: "Total Amount",
      accessorKey: "totalAmount",
      cell: ({ getValue }) => (
        <div className="flex items-center">
          <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
          <span>${getValue().toLocaleString()}</span>
        </div>
      )
    },
    {
      header: "Reference",
      accessorKey: "reference",
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
          Completed
        </span>
      )
    },
    {
      header: "Work Hours",
      accessorKey: "workHours",
      cell: ({ getValue }) => {
        const hours = getValue();
        const total = hours.reduce((acc, h) => acc + 
          (h.regularHours || 0) + 
          (h.overtime15x || 0) + 
          (h.overtime20x || 0), 0);
        return (
          <div className="text-sm">
            {total.toFixed(1)} hours
          </div>
        );
      }
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
            onClick={() => {/* Implement export */}}
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
      />
    </div>
  );
};

export default PaymentHistorySection;