import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { paymentService } from '../services/paymentService';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import SelectDropdown from '../components/common/SelectDropdown';
import { MessageSquare } from 'lucide-react';
import { PAYMENT_TYPES, PAYMENT_STATUSES } from '../utils/constants';

const PaymentHistoryPage = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [newComment, setNewComment] = useState('');

  const columns = [
    {
      header: "Date",
      accessorKey: "date",
      cell: ({ getValue }) => new Date(getValue()).toLocaleDateString()
    },
    {
      header: "Type",
      accessorKey: "paymentType"
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: ({ row }) => `${row.currency} ${row.amount.toLocaleString()}`
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ getValue }) => (
        <span className={`px-2 py-1 rounded-full text-sm ${
          getValue() === 'completed' ? 'bg-green-100 text-green-800' :
          getValue() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {getValue()}
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

  useEffect(() => {
    fetchPayments();
  }, [filterStatus, filterType]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const filters = {
        status: filterStatus !== 'all' ? filterStatus : null,
        paymentType: filterType !== 'all' ? filterType : null
      };
      const data = await paymentService.fetchUserPayments(user.uid, filters);
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      // You might want to show an error notification here
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (payment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const comment = {
        text: newComment,
        userID: user.uid,
        createdAt: new Date()
      };

      await paymentService.addPaymentComment(selectedPayment.id, comment);
      setNewComment('');
      await fetchPayments(); // Refresh payments to show new comment
    } catch (error) {
      console.error('Error adding comment:', error);
      // You might want to show an error notification here
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    ...Object.values(PAYMENT_STATUSES).map(status => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1)
    }))
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    ...Object.values(PAYMENT_TYPES).map(type => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1)
    }))
  ];

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Payment History</h2>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="w-48">
              <SelectDropdown
                label="Status"
                options={statusOptions}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              />
            </div>
            <div className="w-48">
              <SelectDropdown
                label="Payment Type"
                options={typeOptions}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <Table
            data={payments}
            columns={columns}
            emptyMessage="No payments found"
          />
        </div>
      </div>

      {/* Payment Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Payment Details"
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p>{new Date(selectedPayment.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p>{`${selectedPayment.currency} ${selectedPayment.amount.toLocaleString()}`}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p>{selectedPayment.paymentType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p>{selectedPayment.status}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p>{selectedPayment.description}</p>
            </div>

            {/* Comments Section */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Comments</h3>
              <div className="space-y-2">
                {selectedPayment.comments?.map((comment, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded">
                    <p>{comment.text}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
                <div className="mt-4">
                  <textarea
                    className="w-full p-2 border rounded-md"
                    placeholder="Add a comment..."
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button
                    onClick={handleAddComment}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentHistoryPage;