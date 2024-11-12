// src/components/timesheets/WorkHoursContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const WorkHoursContext = createContext();

export const WorkHoursProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentProject, setCurrentProject] = useState(null);
  const [workHours, setWorkHours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProject = async () => {
      if (user?.uid) {
        // TODO: Fetch current project assignment from Firebase
        setLoading(false);
      }
    };

    fetchUserProject();
  }, [user]);

  const submitWorkHours = async (hoursData) => {
    try {
      // TODO: Submit work hours to Firebase
      return { success: true };
    } catch (error) {
      console.error('Error submitting work hours:', error);
      return { success: false, error: error.message };
    }
  };

  return (
    <WorkHoursContext.Provider value={{
      currentProject,
      workHours,
      loading,
      submitWorkHours
    }}>
      {children}
    </WorkHoursContext.Provider>
  );
};

export const useWorkHours = () => useContext(WorkHoursContext);