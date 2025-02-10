import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/paymentService';
import { expenseService } from '../../services/expenseService';
import PaymentHistoryTable from '../../components/payments/PaymentHistoryTable';
import PaymentDetailsModal from '../../components/payments/PaymentDetailsModal';
import PaymentTypeFilter from '../../components/payments/PaymentTypeFilter';
import SelectDropdown from '../../components/common/SelectDropdown';
import { PAYMENT_STATUSES } from '../../utils/constants';
import { collection, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase_config';

const PaymentHistoryPage = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState({});
  const [expenses, setExpenses] = useState({});
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    ...Object.values(PAYMENT_STATUSES).map(status => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1)
    }))
  ];

  // Function to fetch project details
  const fetchProjectDetails = async (projectId) => {
    if (!projectId) return null;
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

  // Function to fetch expense details with better error handling
  const fetchExpenseDetails = async (expenseId) => {
    if (!expenseId) return null;
    try {
      const expense = await expenseService.getExpenseById(expenseId);
      return expense;
    } catch (error) {
      // Log the error but don't let it break the app
      console.warn(`Could not fetch expense ${expenseId}:`, error.message);
      return {
        id: expenseId,
        status: 'Unknown',
        amount: 0,
        error: 'Could not load expense details'
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
          // Collect unique project and expense IDs
          const projectIds = [...new Set(newPayments.map(p => p.projectID).filter(Boolean))];
          const expenseIds = [...new Set(newPayments
            .filter(p => p.relatedExpenseID)
            .map(p => p.relatedExpenseID)
          )];

          // Fetch project details
          const projectDetails = {};
          await Promise.all(
            projectIds.map(async (id) => {
              try {
                const project = await fetchProjectDetails(id);
                if (project) projectDetails[id] = project;
              } catch (error) {
                console.warn(`Failed to fetch project ${id}:`, error);
              }
            })
          );

          // Fetch expense details with error handling
          const expenseDetails = {};
          await Promise.all(
            expenseIds.map(async (id) => {
              try {
                const expense = await fetchExpenseDetails(id);
                if (expense) expenseDetails[id] = expense;
              } catch (error) {
                console.warn(`Failed to fetch expense ${id}:`, error);
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
  }, [user?.uid, filterStatus, filterType]);

  const handleRowClick = async (payment) => {
    try {
      const paymentDetails = await paymentService.getPaymentDetails(payment.id);
      
      // Fetch related project and expense if they haven't been fetched yet
      if (paymentDetails.projectID && !projects[paymentDetails.projectID]) {
        try {
          const project = await fetchProjectDetails(paymentDetails.projectID);
          if (project) {
            setProjects(prev => ({ ...prev, [paymentDetails.projectID]: project }));
          }
        } catch (error) {
          console.warn('Error fetching project details:', error);
        }
      }

      if (paymentDetails.relatedExpenseID && !expenses[paymentDetails.relatedExpenseID]) {
        try {
          const expense = await fetchExpenseDetails(paymentDetails.relatedExpenseID);
          if (expense) {
            setExpenses(prev => ({ ...prev, [paymentDetails.relatedExpenseID]: expense }));
          }
        } catch (error) {
          console.warn('Error fetching expense details:', error);
        }
      }

      setSelectedPayment(paymentDetails);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching payment details:', error);
    }
  };

  const handleAddComment = async (commentText) => {
    if (!commentText.trim() || !selectedPayment) return;

    try {
      await paymentService.addPaymentComment(selectedPayment.id, {
        text: commentText,
        userID: user.uid,
        createdAt: new Date()
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
        project={selectedPayment ? projects[selectedPayment.projectID] : null}
        expense={selectedPayment ? expenses[selectedPayment.relatedExpenseID] : null}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCommentAdd={handleAddComment}
      />
    </div>
  );
};

export default PaymentHistoryPage;