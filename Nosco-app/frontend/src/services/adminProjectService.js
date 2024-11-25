// src/services/adminProjectService.js
import { firestore } from '../firebase/firebase_config';
import { 
  collection, 
  query,
  getDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  Timestamp,
  where,
  deleteDoc,
} from 'firebase/firestore';

export const adminProjectService = {
  // Fetch all projects
  getProjects: async () => {
    try {
      const projectsRef = collection(firestore, 'projects');
      const projectsSnapshot = await getDocs(projectsRef);
      
      const projects = [];
      for (const doc of projectsSnapshot.docs) {
        const projectData = doc.data();
        
        // Get assigned workers count
        const assignmentsRef = collection(firestore, 'projectAssignments');
        const q = query(assignmentsRef, where('projectId', '==', doc.id));
        const assignmentsSnapshot = await getDocs(q);
        
        projects.push({
          id: doc.id,
          ...projectData,
          assignedWorkers: assignmentsSnapshot.docs.map(doc => doc.data())
        });
      }
      
      return projects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  // Create new project
  createProject: async (projectData) => {
    try {
      const newProject = {
        ...projectData,
        status: 'active',
        createdAt: Timestamp.now(),
        startDate: Timestamp.fromDate(new Date(projectData.startDate)),
        endDate: Timestamp.fromDate(new Date(projectData.endDate))
      };

      const docRef = await addDoc(collection(firestore, 'projects'), newProject);
      return {
        id: docRef.id,
        ...newProject
      };
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  // Update project status
  updateProjectStatus: async (projectId, status) => {
    try {
      const projectRef = doc(firestore, 'projects', projectId);
      await updateDoc(projectRef, {
        status: status,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating project status:', error);
      throw error;
    }
  },

  // Get project details including assigned workers
  getProjectDetails: async (projectId) => {
    try {
      const projectRef = doc(firestore, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) {
        throw new Error('Project not found');
      }

      return {
        id: projectSnap.id,
        ...projectSnap.data()
      };
    } catch (error) {
      console.error('Error fetching project details:', error);
      throw error;
    }
  },

  // Update project details
  updateProject: async (projectId, data) => {
    try {
      const projectRef = doc(firestore, 'projects', projectId);
      await updateDoc(projectRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating project details:', error);
      throw error;
    }
  },

  // Assign worker to project
  assignWorkerToProject: async (projectId, workerId) => {
    try {
      const newAssignment = {
        projectId,
        workerId,
        status: 'active',
        assignedAt: Timestamp.now()
      };

      await addDoc(collection(firestore, 'projectAssignments'), newAssignment);
    } catch (error) {
      console.error('Error assigning worker to project:', error);
      throw error;
    }
  },

  // Remove worker from project
  removeWorkerFromProject: async (assignmentId) => {
    try {
      const assignmentRef = doc(firestore, 'projectAssignments', assignmentId);
      await updateDoc(assignmentRef, {
        status: 'removed',
        removedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error removing worker from project:', error);
      throw error;
    }
  },

  // Add to adminProjectService.js
  endProject: async (projectId) => {
    try {
      const projectRef = doc(firestore, 'projects', projectId);
      await updateDoc(projectRef, {
        status: 'ended',
        endedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error ending project:', error);
      throw error;
    }
  },

  unarchiveProject: async (projectId) => {
    try {
      const projectRef = doc(firestore, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }
  
      // Get the previous status before it was archived (or default to 'ended')
      const previousStatus = projectDoc.data().previousStatus || 'ended';
  
      await updateDoc(projectRef, {
        status: previousStatus,
        unarchiveDate: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error unarchiving project:', error);
      throw error;
    }
  },
  
  // Modify the archiveProject function to store the previous status
  archiveProject: async (projectId) => {
    try {
      const projectRef = doc(firestore, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }
  
      // Store the current status before archiving
      const currentStatus = projectDoc.data().status;
  
      await updateDoc(projectRef, {
        status: 'archived',
        previousStatus: currentStatus,
        archivedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error archiving project:', error);
      throw error;
    }
  },

  deleteProject: async (projectId) => {
    try {
      const projectRef = doc(firestore, 'projects', projectId);
      await deleteDoc(projectRef);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },
};