import React, { useMemo } from 'react';
import { MessageSquare, Receipt, Calendar, Building } from 'lucide-react';
import { format } from 'date-fns';

const PaymentHistoryTable = ({ payments, projects, expenses, onRowClick, loading }) => {
  const columns = useMemo(() => [
    {
      header: "Date",
      accessorKey: "date",
      cell: ({ getValue }) => {
        const date = getValue();
        if (!date) return '-';
        const dateObj = date?.toDate?.() ? date.toDate() : new Date(date);
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>{format(dateObj, 'MMM dd, yyyy')}</span>
          </div>
        );
      }
    },
    {
      header: "Type",
      accessorKey: "paymentType",
      cell: ({ getValue, row }) => {
        const type = getValue();
        const relatedExpense = row.original.relatedExpenseID && 
          expenses[row.original.relatedExpenseID];
        
        return (
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-gray-500" />
            <div>
              <div className="font-medium">
                {type
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .trim()}
              </div>
              {relatedExpense && (
                <div className="text-xs text-gray-500">
                  Expense ID: {row.original.relatedExpenseID}
                </div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: ({ getValue, row }) => {
        const amount = getValue();
        const currency = row.original.currency || 'USD';
        return (
          <div className="font-medium">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency
            }).format(amount || 0)}
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
        const status = getValue() || '';
        const statusStyles = {
          completed: 'bg-green-100 text-green-800',
          pending: 'bg-yellow-100 text-yellow-800',
          processing: 'bg-blue-100 text-blue-800',
          failed: 'bg-red-100 text-red-800',
          default: 'bg-gray-100 text-gray-800'
        };

        return (
          <span className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center ${
            statusStyles[status] || statusStyles.default
          }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      }
    },
    {
      header: "Comments",
      accessorKey: "comments",
      cell: ({ getValue }) => {
        const comments = getValue() || [];
        return comments.length > 0 ? (
          <div className="relative group">
            <div className="flex items-center gap-1 cursor-pointer">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">{comments.length}</span>
            </div>
            <div className="absolute z-10 invisible group-hover:visible bg-white border rounded-lg shadow-lg p-3 min-w-[300px] right-0 mt-1">
              <div className="max-h-[200px] overflow-y-auto space-y-2">
                {comments.map((comment, index) => (
                  <div key={index} className="text-sm border-b last:border-0 pb-2">
                    <div className="font-medium break-words">{comment.text}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {format(
                        comment.createdAt?.toDate?.() 
                          ? comment.createdAt.toDate() 
                          : new Date(comment.createdAt),
                        'MMM dd, yyyy HH:mm'
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null;
      }
    }
  ], [projects, expenses]);

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
              payments.map((payment, index) => (
                <tr
                  key={payment.id || index}
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