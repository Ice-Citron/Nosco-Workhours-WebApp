import React from 'react';
import Table from '../common/Table';
import { MessageSquare } from 'lucide-react';

const PaymentHistoryTable = ({ payments, onRowClick, loading }) => {
  const columns = [
    {
      header: "Date",
      accessorKey: "date",
      cell: ({ getValue }) => {
        const date = getValue();
        return date?.toDate?.() 
          ? date.toDate().toLocaleDateString() 
          : new Date(date).toLocaleDateString();
      }
    },
    {
      header: "Type",
      accessorKey: "paymentType",
      cell: ({ getValue }) => {
        const type = getValue();
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1');
      }
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: ({ row }) => {
        const { amount, currency } = row;
        return `${currency} ${parseFloat(amount).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`;
      }
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ getValue }) => (
        <span className={`px-2 py-1 rounded-full text-sm ${
          getValue() === 'completed' ? 'bg-green-100 text-green-800' :
          getValue() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          getValue() === 'processing' ? 'bg-blue-100 text-blue-800' :
          getValue() === 'failed' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {getValue().charAt(0).toUpperCase() + getValue().slice(1)}
        </span>
      )
    },
    {
      header: "Description",
      accessorKey: "description"
    },
    {
      header: "",
      accessorKey: "comments",
      cell: ({ getValue }) => getValue()?.length > 0 && (
        <MessageSquare className="h-5 w-5 text-gray-500" />
      )
    }
  ];

  return (
    <Table
      data={payments}
      columns={columns}
      onRowClick={onRowClick}
      loading={loading}
      emptyMessage="No payments found"
    />
  );
};

export default PaymentHistoryTable;