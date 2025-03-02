import React, { useState, useEffect } from 'react';
import { MessageSquare, Calendar, Building, Check, User } from 'lucide-react';
import { format } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase_config';

const PaymentHistoryTable = ({ payments, projects, expenses, onRowClick, loading }) => {
  const [userNames, setUserNames] = useState({});
  
  // Fetch user names for all user IDs in comments
  useEffect(() => {
    if (!payments || payments.length === 0) return;
    
    const fetchUserNames = async () => {
      // Collect all unique user IDs from payment comments
      const userIds = new Set();
      
      payments.forEach(payment => {
        if (payment.comments?.userID) {
          userIds.add(payment.comments.userID);
        }
      });
      
      // Skip if we don't have any user IDs to fetch
      if (userIds.size === 0) return;
      
      // Create a new object to store fetched names
      const newUserNames = { ...userNames };
      
      // Fetch user details for each ID
      for (const userId of userIds) {
        // Skip if we already have this user's name
        if (newUserNames[userId]) continue;
        
        try {
          const userRef = doc(firestore, 'users', userId);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            newUserNames[userId] = userData.name || 'Unknown User';
          } else {
            newUserNames[userId] = 'Unknown User';
          }
        } catch (error) {
          console.warn(`Could not fetch user details for ${userId}:`, error);
          newUserNames[userId] = 'Unknown User';
        }
      }
      
      setUserNames(newUserNames);
    };
    
    fetchUserNames();
  }, [payments]);

  // Helper: Get user name from ID, fallback to ID if name not found
  const getUserName = (userId) => {
    return userNames[userId] || userId;
  };
  
  // Helper: format date
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

  // Helper: format timestamp
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

  // Helper: read single comment object
  const getCommentDetails = (payment) => {
    if (
      payment.comments &&
      typeof payment.comments === 'object' &&
      !Array.isArray(payment.comments)
    ) {
      return payment.comments;
    }
    return null;
  };

  const columns = [
    {
      header: 'Date',
      accessorKey: 'date',
      cell: ({ getValue }) => {
        const date = getValue();
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>{formatDate(date)}</span>
          </div>
        );
      },
    },
    {
      header: 'Type',
      accessorKey: 'paymentType',
      cell: ({ row }) => {
        const { paymentType, amount, currency } = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {paymentType
                ? paymentType
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())
                    .trim()
                : 'Unknown Type'}
            </span>
            <span className="text-sm text-gray-600">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency || 'USD',
              }).format(amount || 0)}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Project',
      accessorKey: 'projectID',
      cell: ({ getValue }) => {
        const projectId = getValue();
        if (!projectId) return '-';
        const project = projects[projectId];
        return project ? (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-gray-500" />
            <div>
              <div className="font-medium">{project.name}</div>
              <div className="text-xs text-gray-500">{projectId}</div>
            </div>
          </div>
        ) : (
          '-'
        );
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => {
        const status = getValue();

        const statusStyles = {
          completed: 'bg-green-100 text-green-800',
          pending: 'bg-yellow-100 text-yellow-800',
          processing: 'bg-blue-100 text-blue-800',
          failed: 'bg-red-100 text-red-800',
          default: 'bg-gray-100 text-gray-800',
        };

        return (
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center ${
              statusStyles[status] || statusStyles.default
            }`}
          >
            {status === 'completed' && <Check className="h-3 w-3 mr-1" />}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      header: 'Reference',
      accessorKey: 'referenceNumber',
      cell: ({ getValue }) => {
        const ref = getValue();
        return ref ? <span className="text-sm">{ref}</span> : '-';
      },
    },
    {
      header: 'Comments',
      accessorKey: 'comments',
      cell: ({ row }) => {
        const payment = row.original;
        const comment = getCommentDetails(payment);
        if (!comment) {
          return <span className="text-gray-400 text-sm">No comments</span>;
        }
        
        // Get the user's display name using the helper function
        const userName = getUserName(comment.userID);
        
        return (
          <div className="relative group">
            <div className="flex items-center gap-1 text-blue-600 cursor-pointer">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">From: {userName}</span>
            </div>
            {/* Hover tooltip */}
            <div className="absolute z-10 invisible group-hover:visible bg-white border rounded-lg shadow-lg p-3 min-w-[300px] right-0 mt-1">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-3 w-3" />
                  <span>{userName}</span>
                </div>
                <div className="text-sm font-medium">{comment.text}</div>
                <div className="text-xs text-gray-500">
                  {formatTimestamp(comment.createdAt)}
                </div>
              </div>
            </div>
          </div>
        );
      },
    },
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
                <td
                  colSpan={columns.length}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
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
                    <td
                      key={column.accessorKey}
                      className="px-6 py-4 whitespace-nowrap"
                    >
                      {column.cell({
                        getValue: () => payment[column.accessorKey],
                        row: { original: payment },
                      })}
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
