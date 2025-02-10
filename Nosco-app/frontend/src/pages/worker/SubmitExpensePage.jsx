import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { firestore } from '../../firebase/firebase_config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import SubmitExpenseForm from '../../components/expenses/SubmitExpenseForm';
import Notification from '../../components/common/Notification';

const SubmitExpensePage = () => {
  const { user } = useAuth();
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchCurrentProject = async () => {
      try {
        if (!user?.uid) return;

        const assignmentsRef = collection(firestore, 'projectAssignments');
        const q = query(
          assignmentsRef,
          where('userID', '==', user.uid),
          where('status', '==', 'active')
        );

        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const assignment = snapshot.docs[0].data();
          const projectRef = doc(firestore, 'projects', assignment.projectID);
          const projectDoc = await getDoc(projectRef);

          if (projectDoc.exists()) {
            setCurrentProject({
              id: projectDoc.id,
              ...projectDoc.data()
            });
          }
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setNotification({
          type: 'error',
          message: 'Failed to fetch project details'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentProject();
  }, [user]);

  const handleSubmitSuccess = () => {
    setNotification({
      type: 'success',
      message: 'Expense claim submitted successfully!'
    });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <h1 className="text-2xl font-bold mb-6">Submit Expense Claim</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <SubmitExpenseForm 
          currentProject={currentProject}
          onSubmitSuccess={handleSubmitSuccess}
        />
      </div>
    </div>
  );
};

export default SubmitExpensePage;