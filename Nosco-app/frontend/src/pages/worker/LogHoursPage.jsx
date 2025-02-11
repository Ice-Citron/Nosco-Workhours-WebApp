// src/pages/worker/LogHoursPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { firestore } from '../../firebase/firebase_config';
import { doc, getDoc } from 'firebase/firestore';
import LogHoursForm from '../../components/timesheets/LogHoursForm';
import WorkHoursSummary from '../../components/timesheets/WorkHoursSummary';
import Notification from '../../components/common/Notification';
import { timesheetService } from '../../services/timesheetService';

const LogHoursPage = () => {
  const { user } = useAuth();
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // 1) If user has "currentActiveProject" set, fetch that project
    const fetchProject = async () => {
      if (!user?.uid) return;
      try {
        if (user.currentActiveProject) {
          const projectRef = doc(firestore, 'projects', user.currentActiveProject);
          const projectSnap = await getDoc(projectRef);
          if (projectSnap.exists()) {
            setCurrentProject({
              id: projectSnap.id,
              ...projectSnap.data(),
            });
          } else {
            console.warn('No project found with ID:', user.currentActiveProject);
          }
        } else {
          // User doc doesn't have currentActiveProject
          setCurrentProject(null);
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setNotification({
          type: 'error',
          message: 'Failed to fetch active project',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [user]);

  const handleSubmit = async (formData) => {
    try {
      if (!user?.uid || !currentProject?.id) {
        throw new Error('Missing user or project info');
      }
      // 2) Prepare data for timesheet submission
      const workHoursData = {
        userID: user.uid,            // match Firestore field
        projectID: currentProject.id,
        date: formData.date,         // a JS Date
        regularHours: formData.regularHours,
        overtime15x: formData.overtime15x,
        overtime20x: formData.overtime20x,
        remarks: formData.remarks,
      };

      // 3) Submit via timesheetService
      await timesheetService.submitWorkHours(workHoursData);
      setNotification({
        type: 'success',
        message: 'Work hours submitted successfully.',
      });
    } catch (error) {
      console.error('Submit error:', error);
      setNotification({
        type: 'error',
        message: error.message || 'Failed to submit work hours',
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
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

      <h1 className="text-2xl font-bold mb-6">Log Work Hours</h1>

      {!currentProject ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-yellow-800">
            No active project assigned. Please contact your administrator.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-gray-50 p-4 rounded mb-6">
            <h2 className="font-medium mb-1">{currentProject.name}</h2>
            <p className="text-sm text-gray-600">{currentProject.description}</p>
          </div>

          <LogHoursForm onSubmit={handleSubmit} />

          {/* Show a recent summary if you like */}
          <div className="mt-8">
            <WorkHoursSummary />
          </div>
        </>
      )}
    </div>
  );
};

export default LogHoursPage;
