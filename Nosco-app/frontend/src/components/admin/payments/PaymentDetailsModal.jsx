// src/components/admin/payments/PaymentDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import { format } from 'date-fns';
import { Clock, DollarSign, FileText, User } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebase_config';

const PaymentDetailsModal = ({ isOpen, onClose, payment, usersMapping }) => {
  const [adminNames, setAdminNames] = useState({});
  
  // Fetch admin names when the payment changes
  useEffect(() => {
    if (!payment) return;
    
    const fetchAdminNames = async () => {
      // Collect admin IDs from processing history
      const adminIds = new Set();
      
      // Add commenter if present
      if (payment.comments?.userID) {
        adminIds.add(payment.comments.userID);
      }
      
      // Add admin IDs from processing history
      if (Array.isArray(payment.processingHistory)) {
        payment.processingHistory.forEach(entry => {
          if (entry.adminId) {
            adminIds.add(entry.adminId);
          }
        });
      }
      
      // Skip if there are no admin IDs to fetch
      if (adminIds.size === 0) return;
      
      // Create a new object to store fetched names
      const newAdminNames = { ...adminNames };
      
      // Fetch user details for each admin ID
      for (const adminId of adminIds) {
        // Skip if we already have this admin's name
        if (newAdminNames[adminId] || (usersMapping && usersMapping[adminId])) continue;
        
        try {
          const userRef = doc(firestore, 'users', adminId);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            newAdminNames[adminId] = userData.name || 'Unknown Admin';
          } else {
            newAdminNames[adminId] = 'Unknown Admin';
          }
        } catch (error) {
          console.warn(`Could not fetch admin details for ${adminId}:`, error);
          newAdminNames[adminId] = 'Unknown Admin';
        }
      }
      
      setAdminNames(newAdminNames);
    };
    
    fetchAdminNames();
  }, [payment, usersMapping]);
  
  if (!payment) return null;

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      const dateObj = date?.toDate ? date.toDate() : new Date(date);
      return format(dateObj, 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return '-';
    }
  };

  // Helper function to get user/admin name from ID
  const getNameFromId = (userId) => {
    // First check usersMapping (passed from parent)
    if (usersMapping && usersMapping[userId]) {
      return usersMapping[userId].name;
    }
    
    // Then check our fetched admin names
    if (adminNames[userId]) {
      return adminNames[userId];
    }
    
    // Default to the ID if no name is found
    return userId;
  };
  
  // Retrieve user name using the payment's userID
  const userName = payment.userID ? getNameFromId(payment.userID) : 'Unknown User';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Details">
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">User</div>
            <div className="font-medium">{userName}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Payment Date</div>
            <div className="font-medium">{formatDate(payment.updatedAt)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Amount</div>
            <div className="font-medium">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: payment.currency || 'USD'
              }).format(payment.amount || 0)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Reference</div>
            <div className="font-medium">{payment.referenceNumber}</div>
          </div>
          <div className="col-span-2">
            <div className="text-sm text-gray-500">Description</div>
            <div className="font-medium">{payment.description}</div>
          </div>
          <div className="col-span-2">
            <div className="text-sm text-gray-500">Payment Method</div>
            <div className="font-medium">{payment.paymentMethod || 'N/A'}</div>
          </div>
          <div className="col-span-2">
            <div className="text-sm text-gray-500">Status</div>
            <div className="font-medium capitalize">{payment.status}</div>
          </div>
          <div className="col-span-2">
            <div className="text-sm text-gray-500">Comments</div>
            {payment.comments ? (
              <div className="bg-gray-50 p-3 rounded mt-1">
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <User className="h-3.5 w-3.5 mr-1" />
                  <span>{getNameFromId(payment.comments.userID)}</span>
                  <span className="mx-1">•</span>
                  <span>{formatDate(payment.comments.createdAt)}</span>
                </div>
                <div className="text-gray-800">{payment.comments.text}</div>
              </div>
            ) : (
              <div className="font-medium text-gray-500">No comments</div>
            )}
          </div>
          {payment.processingHistory && payment.processingHistory.length > 0 && (
            <div className="col-span-2">
              <div className="text-sm text-gray-500 mb-2">Processing History</div>
              <div className="space-y-3">
                {payment.processingHistory.map((entry, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <User className="h-3.5 w-3.5 mr-1" />
                      <span>{getNameFromId(entry.adminId)}</span>
                      <span className="mx-1">•</span>
                      <span>{formatDate(entry.timestamp)}</span>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        entry.status === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : entry.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : entry.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                    <div className="text-gray-800">{entry.comment}</div>
                    {entry.paymentMethod && (
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Method:</span> {entry.paymentMethod}
                        {entry.referenceNumber && (
                          <>
                            <span className="mx-1">•</span>
                            <span className="font-medium">Ref:</span> {entry.referenceNumber}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PaymentDetailsModal;
