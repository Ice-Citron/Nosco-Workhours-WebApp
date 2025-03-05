import React, { useState, useEffect } from 'react';
import { adminPaymentService } from '../../../services/adminPaymentService';
import Table from '../../common/Table';
import ProcessPaymentModal from './ProcessPaymentModal';
import { firestore } from '../../../firebase/firebase_config';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext'; // Add this import

const ProcessingPaymentsSection = () => {
  const [payments, setPayments] = useState([]);
  const [usersMapping, setUsersMapping] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useAuth(); // Get the current user from auth context

  // Subscribe to payments with status "processing"
  useEffect(() => {
    const unsubscribe = adminPaymentService.subscribeToAllPayments(
      { status: 'processing' },
      (docs) => {
        setPayments(docs);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch all users from the "users" collection and build a mapping: userId -> user data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(firestore, 'users');
        const snapshot = await getDocs(usersRef);
        const mapping = {};
        snapshot.forEach((docSnap) => {
          mapping[docSnap.id] = docSnap.data();
        });
        setUsersMapping(mapping);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  // Define table columns, adding a "User" column at the very left
  const columns = [
    {
      header: 'User',
      accessorKey: 'userID',
      cell: ({ getValue }) => {
        const userID = getValue();
        const user = usersMapping[userID];
        return user ? user.name : userID;
      }
    },
    {
      header: 'Reference',
      accessorKey: 'referenceNumber'
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: ({ getValue }) =>
        `$${Number(getValue() || 0).toLocaleString()}`
    },
    {
      header: 'Payment Method',
      accessorKey: 'paymentMethod'
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <button
          className="text-blue-600 hover:text-blue-800"
          onClick={() => {
            setSelectedPayment(row.original);
            setModalOpen(true);
          }}
        >
          Finalize
        </button>
      )
    }
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Processing Payments</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : payments.length === 0 ? (
        <div>No payments in processing status.</div>
      ) : (
        <Table
          data={payments}
          columns={columns}
          emptyMessage="No processing payments found"
        />
      )}

  {selectedPayment && (
    <ProcessPaymentModal
      payment={selectedPayment}
      isOpen={modalOpen}
      onClose={() => {
        setModalOpen(false);
        setSelectedPayment(null);
      }}
      onStatusUpdate={async (paymentId, updateDetails) => {
        try {
          // Use the current admin's actual user ID
          await adminPaymentService.updatePaymentStatus(paymentId, {
            ...updateDetails,
            adminId: user.uid // Get the current admin's ID from auth context
          });
          console.log('Payment updated successfully');
        } catch (error) {
          console.error('Error updating payment status:', error);
        }
      }}
      onCommentAdd={(paymentId, comment) => {
        // Use the current admin's user ID here too
        adminPaymentService.addPaymentComment(paymentId, {
          text: comment,
          userID: user.uid // Get the admin's ID from auth context
        });
      }}
      adminId={user.uid} // Add this line to pass the admin ID to the modal
    />
  )}
    </div>
  );
};

export default ProcessingPaymentsSection;
