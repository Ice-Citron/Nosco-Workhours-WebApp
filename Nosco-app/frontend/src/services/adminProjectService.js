// src/services/adminProjectService.js

import { firestore } from '../firebase/firebase_config';
import {
  collection,
  query,
  where,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  Timestamp,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

// 1) Helper: get all admins
async function getAllAdmins() {
  const usersRef = collection(firestore, 'users');
  const q = query(usersRef, where('role', '==', 'admin'));
  const snapshot = await getDocs(q);
  const admins = [];
  snapshot.forEach((docSnap) => {
    admins.push({ id: docSnap.id, ...docSnap.data() });
  });
  return admins;
}

// 2) Helper: create notifications for all admins
async function notifyAdminsOfProjectEvent(eventType, projectId, projectName) {
  // fetch admin users
  const admins = await getAllAdmins();

  // decide the type/title/message based on the event
  let type = 'project_update';
  let title = 'Project Updated';
  let message = `Project ${projectName} has changed.`;

  switch (eventType) {
    case 'created':
      type = 'project_created';
      title = 'Project Created';
      message = `Project "${projectName}" was created.`;
      break;
    case 'started':
      type = 'project_started';
      title = 'Project Started';
      message = `Project "${projectName}" is now active.`;
      break;
    case 'ended':
      type = 'project_ended';
      title = 'Project Ended';
      message = `Project "${projectName}" has ended.`;
      break;
    case 'archived':
      type = 'project_archived';
      title = 'Project Archived';
      message = `Project "${projectName}" was archived.`;
      break;
    case 'unarchived':
      type = 'project_unarchived';
      title = 'Project Unarchived';
      message = `Project "${projectName}" was unarchived.`;
      break;
    default:
      break;
  }

  // for each admin, create one notification doc
  const notificationsRef = collection(firestore, 'notifications');
  for (const admin of admins) {
    const notifDoc = {
      type,                  // e.g. 'project_created'
      title,                 // e.g. 'Project Created'
      message,               // e.g. 'Project "Alpha" was created.'
      entityType: 'project',
      entityID: projectId,
      link: `/admin/projects/${projectId}`,
      userID: admin.id,      // each admin sees their own doc
      read: false,
      createdAt: serverTimestamp(),
    };

    await addDoc(notificationsRef, notifDoc);
  }
  // done
}

export const adminProjectService = {
  // Fetch all projects
  getProjects: async () => {
    try {
      const projectsRef = collection(firestore, 'projects');
      const projectsSnapshot = await getDocs(projectsRef);

      const projects = [];
      for (const docSnap of projectsSnapshot.docs) {
        const projectData = docSnap.data();

        // OPTIONAL: if you have a separate 'projectAssignments' collection
        // to count assigned workers, do that here. (Omitted for brevity.)

        projects.push({
          id: docSnap.id,
          ...projectData,
          // assignedWorkers: ...
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
        status: 'draft',
        createdAt: Timestamp.now(),
        startDate: Timestamp.fromDate(new Date(projectData.startDate)),
        endDate: Timestamp.fromDate(new Date(projectData.endDate)),
      };

      // add doc
      const docRef = await addDoc(collection(firestore, 'projects'), newProject);

      // 1) create "created" notification
      await notifyAdminsOfProjectEvent('created', docRef.id, newProject.name);

      return {
        id: docRef.id,
        ...newProject,
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
      const projSnap = await getDoc(projectRef);
      if (!projSnap.exists()) {
        throw new Error('Project not found');
      }
      const projData = projSnap.data();

      // update doc
      await updateDoc(projectRef, {
        status,
        updatedAt: Timestamp.now(),
      });

      // 2) create notification based on new status
      if (status === 'active') {
        await notifyAdminsOfProjectEvent('started', projectId, projData.name);
      } else if (status === 'ended') {
        await notifyAdminsOfProjectEvent('ended', projectId, projData.name);
      }
      // if 'draft' => we won't do anything special here
      // If you want a 'draft' notification, add a condition

    } catch (error) {
      console.error('Error updating project status:', error);
      throw error;
    }
  },

  // Get project details
  getProjectDetails: async (projectId) => {
    try {
      const projectRef = doc(firestore, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);

      if (!projectSnap.exists()) {
        throw new Error('Project not found');
      }

      return {
        id: projectSnap.id,
        ...projectSnap.data(),
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
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating project details:', error);
      throw error;
    }
  },

  // endProject
  endProject: async (projectId) => {
    try {
      const projectRef = doc(firestore, 'projects', projectId);
      const snap = await getDoc(projectRef);
      if (!snap.exists()) {
        throw new Error('Project not found');
      }
      const projectData = snap.data();

      await updateDoc(projectRef, {
        status: 'ended',
        endedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // 3) notify that project ended
      await notifyAdminsOfProjectEvent('ended', projectId, projectData.name);
    } catch (error) {
      console.error('Error ending project:', error);
      throw error;
    }
  },

  // archiveProject
  archiveProject: async (projectId) => {
    try {
      const projectRef = doc(firestore, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const currentStatus = projectDoc.data().status;
      const projectName = projectDoc.data().name || 'Unknown';

      await updateDoc(projectRef, {
        status: 'archived',
        previousStatus: currentStatus,
        archivedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // 4) notify archived
      await notifyAdminsOfProjectEvent('archived', projectId, projectName);
    } catch (error) {
      console.error('Error archiving project:', error);
      throw error;
    }
  },

  // unarchiveProject
  unarchiveProject: async (projectId) => {
    try {
      const projectRef = doc(firestore, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const data = projectDoc.data();
      const previousStatus = data.previousStatus || 'ended';
      const projectName = data.name || 'Unknown';

      await updateDoc(projectRef, {
        status: previousStatus,
        unarchiveDate: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // 5) notify unarchived
      await notifyAdminsOfProjectEvent('unarchived', projectId, projectName);
    } catch (error) {
      console.error('Error unarchiving project:', error);
      throw error;
    }
  },

  // deleteProject
  deleteProject: async (projectId) => {
    try {
      const projectRef = doc(firestore, 'projects', projectId);
      await deleteDoc(projectRef);
      // If you want a "deleted" notification, you can call
      // notifyAdminsOfProjectEvent('deleted', projectId, '???');
      // or do that above
    } catch (error) {
      console.error('Error deleting project:', error);
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
        assignedAt: Timestamp.now(),
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
        removedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error removing worker from project:', error);
      throw error;
    }
  },
};
