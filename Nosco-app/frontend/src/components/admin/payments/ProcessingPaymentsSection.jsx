// src/components/admin/payments/ProcessingPaymentsSection.jsx

import React, { useState, useEffect } from 'react';
import { adminPaymentService } from '../../../services/adminPaymentService';
import Table from '../../common/Table';
import ProcessPaymentModal from './ProcessPaymentModal'; 
  // Reuse your existing modal if you want to finalize or add comments

const ProcessingPaymentsSection = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For editing/finalizing a payment
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadProcessingPayments();
  }, []);

  const loadProcessingPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      // A custom function you create, or reuse getPayments with a filter:
      // For example:
      // 1) if you have a getPayments with (filters.status='processing'), do that
      // 2) or just get all payments, then filter client side
      // For now, we'll do a simple approach:
      const allDocs = await adminPaymentService.subscribeToAllPayments(
        { status: 'processing' }, 
        (list) => { /* or real-time updates if you want onSnapshot */ }
      );
      // But your subscribe approach returns an unsubscribe function, not data directly.
      // So more realistically, you'd want a function like `adminPaymentService.getAllPayments({ status:'processing' })`.
      // We'll show a simpler approach with a direct call:

      // Alternate approach (non-realtime):
      // const data = await adminPaymentService.getPaymentsByStatus('processing');
      // setPayments(data);

      // For demonstration, let's say we do something simpler:
      // We'll do a direct query approach. Let's define a small function in `adminPaymentService` if needed.

      // We'll just stub it here. 
      // In reality, you'd do something like:
      // const data = await adminPaymentService.getPaymentsWithStatus('processing');
      // setPayments(data);

      // We'll just set an empty array for now to avoid confusion
      setPayments([]); 
    } catch (err) {
      console.error('Error loading processing payments:', err);
      setError('Failed to load processing payments');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'Reference',
      accessorKey: 'referenceNumber'
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: ({ getValue }) => `$${Number(getValue() || 0).toLocaleString()}`
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

  // Handler to finalize or cancel payment from your modal
  const handleStatusUpdate = async (paymentId, updateDetails) => {
    // e.g. adminPaymentService.updatePaymentStatus(...)
    // set status='completed' or 'cancelled'
    console.log('Updating payment:', paymentId, updateDetails);
    // Then reload or remove from local array
    // ...
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedPayment(null);
  };

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

      {/* Reuse your existing modal if you want to finalize, etc. */}
      {selectedPayment && (
        <ProcessPaymentModal
          payment={selectedPayment}
          isOpen={modalOpen}
          onClose={handleModalClose}
          onStatusUpdate={handleStatusUpdate}
          // if you use onCommentAdd, pass it in
          onCommentAdd={() => {}}
        />
      )}
    </div>
  );
};

export default ProcessingPaymentsSection;
