import React from 'react';
import Table from '../../common/Table';
import { format } from 'date-fns';

const WorkHoursTable = ({ 
  workHours, 
  selectedIds, 
  onSelect, 
  onViewDetails,
  onApprove,
  onReject
}) => {
  const columns = [
    {
      accessorKey: 'select',
      header: (
        <input
          type="checkbox"
          checked={selectedIds.length === workHours.length && workHours.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              onSelect(workHours.map(wh => wh.id));
            } else {
              onSelect([]);
            }
          }}
          className="rounded border-gray-300 text-nosco-red focus:ring-nosco-red"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.original.id)}
          onChange={(e) => {
            if (e.target.checked) {
              onSelect([...selectedIds, row.original.id]);
            } else {
              onSelect(selectedIds.filter(id => id !== row.original.id));
            }
          }}
          className="rounded border-gray-300 text-nosco-red focus:ring-nosco-red"
        />
      )
    },
    {
      accessorKey: 'worker',
      header: 'WORKER',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.worker?.name}</div>
          <div className="text-sm text-gray-500">{row.original.worker?.department}</div>
        </div>
      )
    },
    {
      accessorKey: 'project',
      header: 'PROJECT',
      cell: ({ row }) => row.original.project?.name
    },
    {
      accessorKey: 'date',
      header: 'DATE',
      cell: ({ row }) => format(row.original.date.toDate(), 'MMM d, yyyy')
    },
    {
      accessorKey: 'hours',
      header: 'HOURS',
      cell: ({ row }) => {
        const totalHours = 
          (row.original.regularHours || 0) + 
          (row.original.overtime15x || 0) + 
          (row.original.overtime20x || 0);
        return totalHours.toFixed(1);
      }
    },
    {
      accessorKey: 'remarks',
      header: 'REMARKS',
      cell: ({ row }) => (
        <div className="max-w-xs truncate">{row.original.remarks || '-'}</div>
      )
    },
    {
      accessorKey: 'status',
      header: 'STATUS',
      cell: ({ row }) => (
        <span className={`font-medium ${
          row.original.status === 'approved' ? 'text-green-600' :
          row.original.status === 'rejected' ? 'text-red-600' :
          'text-yellow-600'
        }`}>
          {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
        </span>
      )
    },
    {
      accessorKey: 'actions',
      header: 'ACTIONS',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onApprove(row.original.id)}
            className="px-3 py-1 text-sm rounded bg-green-50 text-green-600 hover:bg-green-100 transition-colors duration-200"
          >
            Approve
          </button>
          <button
            onClick={() => onReject(row.original.id)}
            className="px-3 py-1 text-sm rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors duration-200"
          >
            Reject
          </button>
          <button
            onClick={() => onViewDetails(row.original)}
            className="px-3 py-1 text-sm rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
          >
            Details
          </button>
        </div>
      )
    }
  ];

  return <Table columns={columns} data={workHours} />;
};

export default WorkHoursTable;