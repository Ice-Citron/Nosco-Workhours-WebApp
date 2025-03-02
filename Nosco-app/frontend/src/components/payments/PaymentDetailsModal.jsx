import React, { useState, useEffect } from 'react';
import { X, User, MessageSquare, Clock, ArrowRightCircle } from 'lucide-react';
import { format } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase_config';
import { useAuth } from '../../context/AuthContext';

const PaymentDetailsModal = ({
  payment,
  project,
  expenseDictionary,
  isOpen,
  onClose,
  onCommentAdd,
}) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [userNames, setUserNames] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if current user is admin
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user?.uid) return;
      
      try {
        const userRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };
    
    checkUserRole();
  }, [user]);
  
  // Fetch user names for all user IDs present in the payment data
  useEffect(() => {
    if (!payment) return;

    // Collect all user IDs that need to be resolved to names
    const userIdsToFetch = new Set();
    
    // Add createdBy if exists
    if (payment.createdBy) userIdsToFetch.add(payment.createdBy);
    
    // Add user ID from comments
    if (payment.comments?.userID) userIdsToFetch.add(payment.comments.userID);

    // Add admin IDs from processing history
    if (Array.isArray(payment.processingHistory)) {
      payment.processingHistory.forEach(item => {
        if (item.adminId) userIdsToFetch.add(item.adminId);
      });
    }

    // Fetch each user and update the names state
    const fetchUserNames = async () => {
      const newUserNames = { ...userNames };
      
      for (const userId of userIdsToFetch) {
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
  }, [payment]);
  
  if (!payment || !isOpen) return null;

  const formatDateTime = (val) => {
    if (!val) return '';
    const dateObj = val?.toDate?.() ? val.toDate() : new Date(val);
    return format(dateObj, 'MMM dd, yyyy HH:mm');
  };

  // Get user name from ID, fallback to ID if name not found
  const getUserName = (userId) => {
    return userNames[userId] || userId;
  };

  // Handle comment submit (only for admins)
  const handleCommentSubmit = () => {
    if (onCommentAdd && commentText.trim() && isAdmin) {
      onCommentAdd(commentText.trim());
      setCommentText('');
    }
  };

  // Handle background click
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackgroundClick}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Payment Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Basic Info Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <div className="text-sm text-gray-500">Date</div>
              <div className="mt-1 font-medium">{formatDateTime(payment.date)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Amount</div>
              <div className="mt-1 font-medium">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: payment.currency || 'USD',
                }).format(payment.amount || 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Type</div>
              <div className="mt-1 font-medium capitalize">
                {payment.paymentType
                  ? payment.paymentType
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase())
                      .trim()
                  : 'Unknown'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className="mt-1">
                <span
                  className={`px-2 py-1 rounded-full text-sm inline-block ${
                    payment.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : payment.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : payment.status === 'processing'
                      ? 'bg-blue-100 text-blue-800'
                      : payment.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Created By */}
          {payment.createdBy && (
            <div>
              <div className="text-sm text-gray-500">Created By</div>
              <div className="mt-1 font-medium">{getUserName(payment.createdBy)}</div>
            </div>
          )}

          {/* Project */}
          {project && (
            <div>
              <div className="text-sm text-gray-500">Project</div>
              <div className="mt-1 font-medium">{project.name}</div>
            </div>
          )}

          {/* Payment Method (if exists) */}
          {payment.paymentMethod && (
            <div>
              <div className="text-sm text-gray-500">Payment Method</div>
              <div className="mt-1 font-medium">{payment.paymentMethod}</div>
            </div>
          )}

          {/* Bank Account (if exists) */}
          {payment.bankAccount && (
            <div>
              <div className="text-sm text-gray-500">Bank Account</div>
              <div className="mt-1 font-medium">{payment.bankAccount}</div>
            </div>
          )}

          {/* Description */}
          {payment.description && (
            <div>
              <div className="text-sm text-gray-500">Description</div>
              <div className="mt-1 font-medium">{payment.description}</div>
            </div>
          )}

          {/* Reference Number */}
          {payment.referenceNumber && (
            <div>
              <div className="text-sm text-gray-500">Reference Number</div>
              <div className="mt-1 font-medium">{payment.referenceNumber}</div>
            </div>
          )}

          {/* Linked Expenses */}
          {Array.isArray(payment.relatedExpenseIDs) && payment.relatedExpenseIDs.length > 0 && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Linked Expenses</div>
              <ul className="list-disc list-inside space-y-1">
                {payment.relatedExpenseIDs.map((eid, idx) => {
                  // Check if we have the expense in the dictionary
                  const expense = expenseDictionary[eid];
                  
                  // If expense data is missing or has an error, show access restricted message
                  if (!expense || expense.error) {
                    return (
                      <li key={`expense-${eid || idx}`} className="text-sm text-orange-600">
                        {`"${eid}": Access restricted`}
                      </li>
                    );
                  }
                  
                  return (
                    <li key={`expense-${expense.id || idx}`} className="text-sm">
                      <span className="font-medium text-gray-700">
                        {expense.expenseType || 'Unknown'}:
                      </span>{' '}
                      {expense.amount !== null && expense.amount !== undefined
                        ? new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: expense.currency || 'USD',
                          }).format(expense.amount)
                        : 'Amount unavailable'}
                      {' - '}
                      <span className={
                        expense.status === 'approved' ? 'text-green-600' : 
                        expense.status === 'rejected' ? 'text-red-600' : 
                        expense.status === 'pending' ? 'text-yellow-600' : 'text-gray-600'
                      }>
                        {expense.status || 'Unknown'}
                      </span>
                      {expense.description && (
                        <span className="text-gray-500 ml-1">
                          - {expense.description.length > 30 
                              ? `${expense.description.substring(0, 30)}...` 
                              : expense.description}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Processing History */}
          {Array.isArray(payment.processingHistory) && payment.processingHistory.length > 0 && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Processing History</div>
              <div className="space-y-2">
                {payment.processingHistory.map((item, index) => (
                  <div key={`history-${index}`} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                    <ArrowRightCircle className="h-4 w-4 text-gray-600 mt-1" />
                    <div className="text-sm">
                      <div className="text-gray-800 font-medium">
                        Status: {item.status}
                      </div>
                      {item.paymentMethod && (
                        <div className="text-gray-600">
                          Method: {item.paymentMethod}
                        </div>
                      )}
                      {item.referenceNumber && (
                        <div className="text-gray-600">
                          Reference: {item.referenceNumber}
                        </div>
                      )}
                      <div className="text-gray-600">
                        {item.comment || '(No comment)'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDateTime(item.timestamp)} by {getUserName(item.adminId)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section (existing single comment) */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium">Admin Comments</h3>
            </div>

            {payment.comments ? (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">
                      {getUserName(payment.comments.userID)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(payment.comments.createdAt)}
                  </div>
                </div>

                <div className="text-gray-800 mt-2">{payment.comments.text}</div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No comments yet</div>
            )}

            {/* Only show comment input for admin users */}
            {onCommentAdd && isAdmin && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Admin Comment
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleCommentSubmit}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded"
                  >
                    Post
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;
