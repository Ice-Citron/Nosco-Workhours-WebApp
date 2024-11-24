// src/components/admin/payments/PaymentProcessingTable.jsx

import React from 'react';
import { Calendar, Building, Check, User } from 'lucide-react';
import { format } from 'date-fns';

const PaymentProcessingTable = ({ 
  payments, 
  projects, 
  onRowClick,
  onProcessPayment,
  loading 
}) => {
  const formatDate = (date) => {
    if (!date) return '-';
    try {
      const dateObj = date?.toDate?.() ? date.toDate() : new Date(date);
      return format(dateObj, 'MMM dd, yyyy');
    } catch (error) {
      console.warn('Invalid date:', date);
      return '-';
    }
  };

  const getActionButton = (payment) => {
    switch (payment.status) {
      case 'pending':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProcessPayment(payment);
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Process
          </button>
        );
      case 'processing':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
            Processing
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-1">
            <Check className="h-4 w-4" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  const columns = [
    {
      header: "Date",
      accessorKey: "date",
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span>{formatDate(getValue())}</span>
        </div>
      )
    },
    {
      header: "Worker",
      accessorKey: "userID",
      cell: ({ row }) => {
        const payment = row.original;
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <div>
              <div className="font-medium">{payment.userName || payment.userID}</div>
              <div className="text-xs text-gray-500">{payment.userEmail}</div>
            </div>
          </div>
        );
      }
    },
    {
      header: "Type",
      accessorKey: "paymentType",
      cell: ({ row }) => {
        const { paymentType, amount, currency } = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {paymentType
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim()}
            </span>
            <span className="text-sm text-gray-600">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency || 'USD'
              }).format(amount || 0)}
            </span>
          </div>
        );
      }
    },
    {
      header: "Project",
      accessorKey: "projectID",
      cell: ({ getValue }) => {
        const projectId = getValue();
        const project = projects[projectId];
        return project ? (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-gray-500" />
            <div>
              <div className="font-medium">{project.name}</div>
              <div className="text-xs text-gray-500">{projectId}</div>
            </div>
          </div>
        ) : '-';
      }
    },
    {
      header: "Reference",
      accessorKey: "referenceNumber",
      cell: ({ getValue }) => {
        const ref = getValue();
        return ref ? (
          <span className="text-sm">{ref}</span>
        ) : '-';
      }
    },
    {
      header: "Actions",
      accessorKey: "status",
      cell: ({ row }) => getActionButton(row.original)
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.accessorKey}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                  No payments found
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr
                  key={payment.id}
                  onClick={() => onRowClick(payment)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {columns.map((column) => (
                    <td key={column.accessorKey} className="px-6 py-4 whitespace-nowrap">
                      {column.cell({ getValue: () => payment[column.accessorKey], row: { original: payment } })}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentProcessingTable;