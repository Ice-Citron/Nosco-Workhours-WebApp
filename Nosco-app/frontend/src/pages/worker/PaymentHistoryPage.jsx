import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/paymentService';
import { expenseService } from '../../services/expenseService';
import PaymentHistoryTable from '../../components/payments/PaymentHistoryTable';
import PaymentDetailsModal from '../../components/payments/PaymentDetailsModal';
import PaymentTypeFilter from '../../components/payments/PaymentTypeFilter';
import SelectDropdown from '../../components/common/SelectDropdown';
import { PAYMENT_STATUSES } from '../../utils/constants';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase_config';

const PaymentHistoryPage = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState({});
  const [expenses, setExpenses] = useState({});
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Build status options from PAYMENT_STATUSES
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    ...Object.values(PAYMENT_STATUSES).map((status) => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1),
    })),
  ];

  // Fetch a single project's details
  const fetchProjectDetails = async (projectId) => {
    if (!projectId) return null; // skip if empty or null
    try {
      const projectRef = doc(firestore, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      if (projectDoc.exists()) {
        return { id: projectDoc.id, ...projectDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching project:', error);
      return null;
    }
  };

  // Fetch a single expense's details
  const fetchExpenseDetails = async (expenseId) => {
    if (!expenseId) return null;
    try {
      return await expenseService.getExpenseById(expenseId);
    } catch (error) {
      console.warn(`Could not fetch expense ${expenseId}:`, error.message);
      return {
        id: expenseId,
        status: 'Unknown',
        amount: 0,
        error: 'Could not load expense details',
      };
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = paymentService.subscribeToUserPayments(
      user.uid,
      { status: filterStatus, paymentType: filterType },
      async (newPayments) => {
        try {
          const projectIds = new Set();
          const expenseIds = new Set();

          for (const p of newPayments) {
            // Accumulate project IDs if present (and not empty string)
            if (p.projectID) {
              projectIds.add(p.projectID);
            }
            // Collect from relatedExpenseIDs array
            if (Array.isArray(p.relatedExpenseIDs)) {
              p.relatedExpenseIDs.forEach((eid) => expenseIds.add(eid));
            }
          }

          // Fetch project details
          const projectDetails = { ...projects };
          await Promise.all(
            [...projectIds].map(async (id) => {
              if (!projectDetails[id]) {
                const project = await fetchProjectDetails(id);
                if (project) projectDetails[id] = project;
              }
            })
          );

          // Fetch expense details
          const expenseDetails = { ...expenses };
          await Promise.all(
            [...expenseIds].map(async (id) => {
              if (!expenseDetails[id]) {
                const exp = await fetchExpenseDetails(id);
                if (exp) expenseDetails[id] = exp;
              }
            })
          );

          setProjects(projectDetails);
          setExpenses(expenseDetails);
          setPayments(newPayments);
        } catch (error) {
          console.error('Error processing payments:', error);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, filterStatus, filterType]);

  // On row click => fetch full payment details again + show modal
  const handleRowClick = async (payment) => {
    try {
      const paymentDetails = await paymentService.getPaymentDetails(payment.id);

      // If the payment has a project
      if (paymentDetails.projectID && !projects[paymentDetails.projectID]) {
        const proj = await fetchProjectDetails(paymentDetails.projectID);
        if (proj) {
          setProjects((prev) => ({ ...prev, [paymentDetails.projectID]: proj }));
        }
      }

      // If the payment has multiple expense references
      if (Array.isArray(paymentDetails.relatedExpenseIDs)) {
        for (const eid of paymentDetails.relatedExpenseIDs) {
          if (!expenses[eid]) {
            const exp = await fetchExpenseDetails(eid);
            if (exp) {
              setExpenses((prev) => ({ ...prev, [eid]: exp }));
            }
          }
        }
      }

      setSelectedPayment(paymentDetails);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching payment details:', error);
    }
  };

  // Add a comment to the payment
  const handleAddComment = async (commentText) => {
    if (!commentText.trim() || !selectedPayment) return;

    try {
      await paymentService.addPaymentComment(selectedPayment.id, {
        text: commentText,
        userID: user.uid,
        createdAt: new Date(),
      });

      const updatedPayment = await paymentService.getPaymentDetails(selectedPayment.id);
      setSelectedPayment(updatedPayment);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Payment History</h2>
        </div>

        <div className="p-6">
          {/* Filters: Status + Payment Type */}
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
              <PaymentTypeFilter
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              />
            </div>
          </div>

          <PaymentHistoryTable
            payments={payments}
            projects={projects}
            expenses={expenses}
            onRowClick={handleRowClick}
            loading={loading}
          />
        </div>
      </div>

      <PaymentDetailsModal
        payment={selectedPayment}
        project={
          selectedPayment && selectedPayment.projectID
            ? projects[selectedPayment.projectID]
            : null
        }
        expenseDictionary={expenses} // pass all expenses here
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCommentAdd={handleAddComment}
      />
    </div>
  );
};

export default PaymentHistoryPage;
