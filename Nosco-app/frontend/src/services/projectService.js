// src/services/projectService.js
import { firestore } from '../firebase/firebase_config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export const projectService = {
  async getCurrentUserProject(userId) {
    try {
      console.log('Fetching project for userId:', userId); // Debug log
      
      // Get the project assignment
      const assignmentsRef = collection(firestore, 'projectAssignments');
      const q = query(
        assignmentsRef,
        where('userID', '==', userId), // Changed from userId to userID to match your schema
        where('status', '==', 'active')
      );
      
      const assignmentSnapshot = await getDocs(q);
      console.log('Assignment snapshot:', !assignmentSnapshot.empty); // Debug log
      
      if (assignmentSnapshot.empty) {
        return null;
      }

      const assignment = assignmentSnapshot.docs[0].data();
      console.log('Assignment data:', assignment); // Debug log
      
      // Get the project details using the projectID from assignment
      const projectRef = doc(firestore, 'projects', assignment.projectID);
      const projectSnapshot = await getDoc(projectRef);
      
      if (!projectSnapshot.exists()) {
        return null;
      }

      const projectData = projectSnapshot.data();
      console.log('Project data:', projectData); // Debug log

      return {
        ...projectData,
        id: projectSnapshot.id,
        assignment: {
          ...assignment,
          id: assignmentSnapshot.docs[0].id
        }
      };
    } catch (error) {
      console.error('Error in getCurrentUserProject:', error);
      throw error;
    }
  }
};