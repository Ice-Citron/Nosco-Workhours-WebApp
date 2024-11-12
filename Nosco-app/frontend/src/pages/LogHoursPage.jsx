// src/pages/LogHoursPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { firestore } from '../firebase/firebase_config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import LogHoursForm from '../components/timesheets/LogHoursForm';
import WorkHoursSummary from '../components/timesheets/WorkHoursSummary';
import Notification from '../components/common/Notification';

const LogHoursPage = () => {
  const { user } = useAuth();
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchCurrentProject = async () => {
      try {
        console.log('Current user:', user); // Debug log
        if (user?.uid) {
          console.log('Fetching project for user ID:', user.uid); // Debug log
          
          // Get project assignment
          const assignmentsRef = collection(firestore, 'projectAssignments');
          const q = query(
            assignmentsRef,
            where('userID', '==', user.uid),
            where('status', '==', 'active')
          );
          
          const assignmentSnapshot = await getDocs(q);
          console.log('Assignment snapshot empty?', assignmentSnapshot.empty); // Debug log
          
          if (!assignmentSnapshot.empty) {
            const assignment = assignmentSnapshot.docs[0].data();
            console.log('Found assignment:', assignment); // Debug log
            
            // Rest of your code...
          }
        }
      } catch (err) {
        console.error('Detailed error:', err); // Debug log
        setNotification({
          type: 'error',
          message: 'Failed to fetch project details'
        });
      }
    };
  
    fetchCurrentProject();
  }, [user]);

  const handleSubmit = async (formData) => {
    try {
      if (!user?.uid || !currentProject?.id) {
        throw new Error('Missing user or project information');
      }

      // TODO: Implement work hours submission
      // Create workHours collection entry
      const workHoursData = {
        userId: user.uid,
        projectId: currentProject.id,
        date: formData.date,
        regularHours: parseFloat(formData.regularHours),
        overtime15x: parseFloat(formData.overtime15x || 0),
        overtime20x: parseFloat(formData.overtime20x || 0),
        remarks: formData.remarks,
        status: 'pending',
        createdAt: new Date()
      };

      console.log('Would submit:', workHoursData);
      
      setNotification({
        type: 'success',
        message: 'Work hours submitted successfully'
      });
    } catch (err) {
      console.error('Submit error:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to submit work hours'
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
            <h2 className="font-medium">Current Project</h2>
            <p>{currentProject.name}</p>
            <p className="text-sm text-gray-600">{currentProject.description}</p>
            <p className="text-sm text-gray-600">Location: {currentProject.location}</p>
          </div>
          
          <LogHoursForm 
            projects={[{
              value: currentProject.id,
              label: currentProject.name
            }]} 
            onSubmit={handleSubmit} 
          />
          
          <div className="mt-8">
            <WorkHoursSummary />
          </div>
        </>
      )}
    </div>
  );
};

export default LogHoursPage;