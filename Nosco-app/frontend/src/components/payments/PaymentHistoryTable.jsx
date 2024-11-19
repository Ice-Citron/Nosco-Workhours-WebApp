import React from 'react';
import { MessageSquare, Calendar, Building, Check, User } from 'lucide-react';
import { format } from 'date-fns';

const PaymentHistoryTable = ({ payments, projects, expenses, onRowClick, loading }) => {
  // Helper function to safely format dates
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

  // Helper function to safely format timestamps
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    try {
      const dateObj = timestamp?.toDate?.() ? timestamp.toDate() : new Date(timestamp);
      return format(dateObj, 'MMM dd, yyyy HH:mm');
    } catch (error) {
      console.warn('Invalid timestamp:', timestamp);
      return '-';
    }
  };

  // Helper function to check if comments exist and extract them
  const getCommentDetails = (payment) => {
    // First check if comments exist as a map
    if (payment.comments && typeof payment.comments === 'object' && !Array.isArray(payment.comments)) {
      return payment.comments;
    }
    return null;
  };

  const columns = [
    {
      header: "Date",
      accessorKey: "date",
      cell: ({ getValue }) => {
        const date = getValue();
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>{formatDate(date)}</span>
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
      header: "Status",
      accessorKey: "status",
      cell: ({ getValue }) => {
        const status = getValue();
        
        const statusStyles = {
          completed: 'bg-green-100 text-green-800',
          pending: 'bg-yellow-100 text-yellow-800',
          processing: 'bg-blue-100 text-blue-800',
          failed: 'bg-red-100 text-red-800',
          default: 'bg-gray-100 text-gray-800'
        };

        return (
          <div className="flex flex-col gap-1">
            <span className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center ${
              statusStyles[status] || statusStyles.default
            }`}>
              {status === 'completed' ? <Check className="h-3 w-3 mr-1" /> : null}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        );
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
      header: "Comments",
      accessorKey: "comments",
      cell: ({ row }) => {
        const comment = getCommentDetails(row.original);
        if (!comment) return (
          <span className="text-gray-400 text-sm">No comments</span>
        );
        
        return (
          <div className="relative group">
            <div className="flex items-center gap-1 text-blue-600 cursor-pointer">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">From: {comment.userID}</span>
            </div>
            <div className="absolute z-10 invisible group-hover:visible bg-white border rounded-lg shadow-lg p-3 min-w-[300px] right-0 mt-1">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-3 w-3" />
                  <span>{comment.userID}</span>
                </div>
                <div className="text-sm font-medium">{comment.text}</div>
                <div className="text-xs text-gray-500">
                  {formatTimestamp(comment.createdAt)}
                </div>
              </div>
            </div>
          </div>
        );
      }
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

export default PaymentHistoryTable;