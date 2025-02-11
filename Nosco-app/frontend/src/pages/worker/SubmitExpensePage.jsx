// src/pages/worker/SubmitExpensePage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { firestore } from '../../firebase/firebase_config';
import { doc, getDoc } from 'firebase/firestore';
import SubmitExpenseForm from '../../components/expenses/SubmitExpenseForm';
import Notification from '../../components/common/Notification';

const SubmitExpensePage = () => {
  const { user } = useAuth();
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchActiveProject = async () => {
      try {
        if (user.currentActiveProject) {
          // 1) If user has an active project, fetch its doc
          const projectRef = doc(firestore, 'projects', user.currentActiveProject);
          const projectSnap = await getDoc(projectRef);
          if (projectSnap.exists()) {
            setCurrentProject({
              id: projectSnap.id,
              ...projectSnap.data(),
            });
          }
        } else {
          // 2) No active project => you can treat as "general expense" or just null
          setCurrentProject(null);
        }
      } catch (err) {
        console.error('Error fetching active project:', err);
        setNotification({
          type: 'error',
          message: 'Failed to fetch your active project details',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchActiveProject();
  }, [user]);

  const handleSubmitSuccess = () => {
    setNotification({
      type: 'success',
      message: 'Expense claim submitted successfully!',
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
