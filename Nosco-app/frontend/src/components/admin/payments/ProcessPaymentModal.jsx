import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import { X, AlertCircle, CheckCircle, Clock, MessageSquare, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebase_config';

const ProcessPaymentModal = ({ 
  payment, 
  isOpen, 
  onClose, 
  onStatusUpdate,
  onCommentAdd 
}) => {
  const [paymentMethod, setPaymentMethod] = useState(payment?.paymentMethod || '');
  const [referenceNumber, setReferenceNumber] = useState(payment?.referenceNumber || '');
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [userBankAccounts, setUserBankAccounts] = useState([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // Fetch user bank accounts when payment changes
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!payment?.userID) return;

      setLoadingUserDetails(true);
      try {
        const userRef = doc(firestore, 'users', payment.userID);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserDetails(userData);
          
          // Extract bank accounts from user data
          // Assuming bank accounts are stored in user document as an array of objects
          // with structure like: { id: string, accountName: string, accountNumber: string, bankName: string }
          const bankAccounts = userData.bankAccounts || [];
          setUserBankAccounts(bankAccounts);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoadingUserDetails(false);
      }
    };

    fetchUserDetails();
  }, [payment]);

  // Update local state if payment changes
  useEffect(() => {
    if (payment) {
      setPaymentMethod(payment.paymentMethod || '');
      setReferenceNumber(payment.referenceNumber || '');
      setSelectedBankAccount(''); // Reset selected bank account
    }
  }, [payment]);

  // Update comment when bank account is selected
  useEffect(() => {
    if (selectedBankAccount && newStatus) {
      const selectedAccount = userBankAccounts.find(acc => acc.id === selectedBankAccount);
      if (selectedAccount) {
        const bankAccountInfo = `${selectedAccount.bankName} (${selectedAccount.accountNumber})`;
        const bankComment = `Sent to ${bankAccountInfo}`;
        
        // Update comment to include bank account info
        // If there's already content in the comment, append to it
        if (comment && !comment.includes(bankAccountInfo)) {
          setComment(`${bankComment} // Admin comment: ${comment}`);
        } else {
          setComment(`${bankComment} // Admin comment: `);
        }
      }
    }
  }, [selectedBankAccount, newStatus, userBankAccounts]);

  if (!payment) return null;

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      const dateObj = date?.toDate?.() ? date.toDate() : new Date(date);
      return format(dateObj, 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return '-';
    }
  };

  const getAvailableStatuses = () => {
    switch (payment.status) {
      case 'pending':
        return ['processing'];
      case 'processing':
        return ['completed', 'failed'];
      default:
        return [];
    }
  };

  const getCommentTemplate = (status) => {
    const selectedAccount = userBankAccounts.find(acc => acc.id === selectedBankAccount);
    const bankInfo = selectedAccount 
      ? `Sent to ${selectedAccount.bankName} (${selectedAccount.accountNumber})`
      : '';
    
    switch (status) {
      case 'processing':
        return `${bankInfo ? `${bankInfo} // ` : ''}Payment being processed via ${paymentMethod}. Reference: ${referenceNumber}. `;
      case 'completed':
        return `${bankInfo ? `${bankInfo} // ` : ''}Payment completed. Final reference: ${referenceNumber}. `;
      case 'failed':
        return `${bankInfo ? `${bankInfo} // ` : ''}Payment failed. Reason: `;
      default:
        return bankInfo ? `${bankInfo} // ` : '';
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setLoading(true);
    try {
      await onStatusUpdate(payment.id, {
        newStatus,
        paymentMethod,
        referenceNumber,
        comment,
        selectedBankAccount: selectedBankAccount || null
      });
      onClose();
    } catch (error) {
      console.error('Error updating payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status) => {
    setNewStatus(status);
    setComment(getCommentTemplate(status));
  };

  const handleBankAccountChange = (accountId) => {
    setSelectedBankAccount(accountId);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Process Payment">
      <div className="p-6">
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm text-gray-500">Worker</label>
              <p className="font-medium">
                {userDetails?.name || payment.userName || payment.userID}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Amount</label>
              <p className="font-medium">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: payment.currency || 'USD'
                }).format(payment.amount || 0)}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Payment Type</label>
              <p className="font-medium">
                {payment.paymentType
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, (str) => str.toUpperCase())
                  .trim()}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Current Status</label>
              <p className="font-medium capitalize">{payment.status}</p>
            </div>
          </div>

          {/* Processing Form */}
          {payment.status !== 'completed' && (
            <form onSubmit={handleStatusUpdate} className="space-y-4 border-t pt-4">
              {/* Bank Account Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Bank Account
                </label>
                {loadingUserDetails ? (
                  <p className="text-sm text-gray-500">Loading bank accounts...</p>
                ) : userBankAccounts.length === 0 ? (
                  <p className="text-sm text-yellow-500">No bank accounts found for this user</p>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={selectedBankAccount}
                      onChange={(e) => handleBankAccountChange(e.target.value)}
                      className="w-full p-2 border rounded-md focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select a bank account</option>
                      {/* Sort accounts to put default first */}
                      {[...userBankAccounts]
                        .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
                        .map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.bankName}: {account.accountNumber} {account.isDefault ? '(Default)' : ''}
                          </option>
                        ))}
                    </select>
                    
                    {selectedBankAccount && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start">
                        <CreditCard className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                        <div>
                          {(() => {
                            const selectedAccount = userBankAccounts.find(acc => acc.id === selectedBankAccount);
                            return (
                              <>
                                <p className="text-sm font-medium text-blue-700">
                                  {selectedAccount?.bankName} 
                                  {selectedAccount?.isDefault && 
                                    <span className="ml-2 px-2 py-0.5 bg-blue-200 text-blue-800 text-xs rounded-full">Default</span>
                                  }
                                </p>
                                <p className="text-sm text-blue-600">
                                  Account: {selectedAccount?.accountNumber}
                                </p>
                                <p className="text-xs text-blue-500 mt-1">
                                  This bank account will be referenced in the payment comment
                                </p>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                  className="w-full p-2 border rounded-md focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Payment Method</option>
                  <option value="bankTransfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  required
                  className="w-full p-2 border rounded-md focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter reference number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Update Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  required
                  className="w-full p-2 border rounded-md focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select New Status</option>
                  {getAvailableStatuses().map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comment
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  rows={3}
                  className="w-full p-2 border rounded-md focus:ring-1 focus:ring-blue-500"
                  placeholder="Add processing details or notes..."
                />
              </div>
              <button
                type="submit"
                disabled={loading || !newStatus || !comment.trim()}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300"
              >
                {loading ? 'Updating...' : 'Update Payment Status'}
              </button>
            </form>
          )}

          {/* Processing History */}
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium">Processing History</h3>
            </div>
            <div className="space-y-4">
              {payment.processingHistory && payment.processingHistory.length > 0 ? (
                payment.processingHistory.map((entry, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium">{entry.adminId}</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          entry.status === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : entry.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : entry.status === 'comment'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {entry.status}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>
                    <p className="text-gray-700">{entry.comment}</p>
                    {entry.paymentMethod && (
                      <p className="text-sm text-gray-500 mt-1">
                        Method: {entry.paymentMethod}, Ref: {entry.referenceNumber}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No processing history yet</p>
              )}
            </div>
          </div>

          {/* Standalone Comment Section */}
          {payment.status !== 'completed' && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium mb-4">Add Comment</h3>
              <div className="space-y-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-1 focus:ring-blue-500"
                  placeholder="Add a comment without changing status..."
                  rows={3}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (comment.trim()) {
                      onCommentAdd(payment.id, comment);
                      setComment('');
                    }
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Add Comment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ProcessPaymentModal;
