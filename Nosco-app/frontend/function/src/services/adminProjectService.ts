// function/src/services/adminProjectService.ts

import * as admin from 'firebase-admin';
import { DocumentData, DocumentReference } from 'firebase-admin/firestore';

// Initialize references
const db = admin.firestore();

/**
 * Helper #1: fetch all admins from /users with role = 'admin'
 */
async function getAllAdmins(): Promise<Array<{ id: string; name?: string }>> {
  const snapshot = await db.collection('users')
    .where('role', '==', 'admin')
    .get();

  const admins: Array<{ id: string; name?: string }> = [];
  snapshot.forEach((docSnap) => {
    admins.push({ id: docSnap.id, ...(docSnap.data() as any) });
  });
  return admins;
}

/**
 * Helper #2: create notifications for all admins,
 * one doc per admin, matching your existing format.
 */
async function notifyAdminsOfProjectEvent(
  eventType: string,
  projectId: string,
  projectName: string,
) {
  // Grab all admins
  const admins = await getAllAdmins();

  let type = 'project_update';
  let title = 'Project Updated';
  let message = `Project "${projectName}" changed status.`;

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

  for (const adminObj of admins) {
    const notificationDoc = {
      type,                  // e.g. 'project_created'
      title,                 // e.g. 'Project Created'
      message,               // e.g. 'Project "Alpha" was created.'
      entityType: 'project',
      entityID: projectId,
      link: `/admin/projects/${projectId}`,
      userID: adminObj.id,   // each admin doc
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('notifications').add(notificationDoc);
  }
}

/**
 * Data shape for creating/updating a project.
 * (Optional interface if you want strong typing.)
 */
interface ProjectData {
  name: string;
  customer?: string;
  department?: string;
  location?: string;
  description?: string;
  status?: string;  // 'draft','active','ended','archived'
  startDate?: admin.firestore.Timestamp;
  endDate?: admin.firestore.Timestamp;
  createdAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
  archivedAt?: admin.firestore.Timestamp;
  endedAt?: admin.firestore.Timestamp;
  previousStatus?: string;
  unarchiveDate?: admin.firestore.Timestamp;
}

export const adminProjectService = {
  /**
   * getProjects: fetch all projects from 'projects' collection
   */
  getProjects: async (): Promise<ProjectData[]> => {
    try {
      const snapshot = await db.collection('projects').get();
      const projects: ProjectData[] = [];

      snapshot.forEach((docSnap) => {
        projects.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as any);
      });

      return projects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  /**
   * createProject: add a new doc with status='draft', plus notifications
   */
  createProject: async (projectData: ProjectData) => {
    try {
      const newProject = {
        ...projectData,
        status: 'draft',
        createdAt: admin.firestore.Timestamp.now(),
        startDate: projectData.startDate || admin.firestore.Timestamp.now(),
        endDate: projectData.endDate || admin.firestore.Timestamp.now(),
      };

      // Create doc
      const docRef = await db.collection('projects').add(newProject);

      // Notify admins
      await notifyAdminsOfProjectEvent('created', docRef.id, newProject.name);

      return { id: docRef.id, ...newProject };
    } catch (err) {
      console.error('Error creating project:', err);
      throw err;
    }
  },

  /**
   * updateProjectStatus: set status field + optionally notify
   * If status='active' => "started"; if 'ended' => "ended"
   */
  updateProjectStatus: async (projectId: string, status: string) => {
    try {
      const projectRef = db.collection('projects').doc(projectId);
      const snap = await projectRef.get();
      if (!snap.exists) {
        throw new Error('Project not found');
      }
      const projData = snap.data() as ProjectData;

      await projectRef.update({
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Possibly create notifications
      if (status === 'active') {
        await notifyAdminsOfProjectEvent('started', projectId, projData.name);
      } else if (status === 'ended') {
        await notifyAdminsOfProjectEvent('ended', projectId, projData.name);
      }
      // etc.
    } catch (err) {
      console.error('Error updating project status:', err);
      throw err;
    }
  },

  /**
   * getProjectDetails: returns a single doc with assigned ID
   */
  getProjectDetails: async (projectId: string): Promise<any> => {
    try {
      const projectRef = db.collection('projects').doc(projectId);
      const snap = await projectRef.get();
      if (!snap.exists) {
        throw new Error('Project not found');
      }
      return { id: snap.id, ...snap.data() };
    } catch (err) {
      console.error('Error fetching project details:', err);
      throw err;
    }
  },

  /**
   * updateProject: partial update of doc fields
   */
  updateProject: async (projectId: string, data: Partial<ProjectData>) => {
    try {
      const projectRef = db.collection('projects').doc(projectId);
      await projectRef.update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error('Error updating project details:', err);
      throw err;
    }
  },

  /**
   * endProject: sets project to 'ended', notifies
   */
  endProject: async (projectId: string) => {
    try {
      const ref = db.collection('projects').doc(projectId);
      const snap = await ref.get();
      if (!snap.exists) throw new Error('Project not found');

      const projectData = snap.data() as ProjectData;
      await ref.update({
        status: 'ended',
        endedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await notifyAdminsOfProjectEvent('ended', projectId, projectData.name);
    } catch (err) {
      console.error('Error ending project:', err);
      throw err;
    }
  },

  /**
   * archiveProject: sets status='archived', stores previousStatus, notifies
   */
  archiveProject: async (projectId: string) => {
    try {
      const ref = db.collection('projects').doc(projectId);
      const snap = await ref.get();
      if (!snap.exists) throw new Error('Project not found');

      const data = snap.data() as ProjectData;
      const currentStatus = data.status || 'draft';

      await ref.update({
        status: 'archived',
        previousStatus: currentStatus,
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await notifyAdminsOfProjectEvent('archived', projectId, data.name);
    } catch (err) {
      console.error('Error archiving project:', err);
      throw err;
    }
  },

  /**
   * unarchiveProject: revert to previousStatus, notifies 'unarchived'
   */
  unarchiveProject: async (projectId: string) => {
    try {
      const ref = db.collection('projects').doc(projectId);
      const snap = await ref.get();
      if (!snap.exists) throw new Error('Project not found');

      const data = snap.data() as ProjectData;
      const previousStatus = data.previousStatus || 'ended';

      await ref.update({
        status: previousStatus,
        unarchiveDate: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await notifyAdminsOfProjectEvent('unarchived', projectId, data.name || 'Unknown');
    } catch (err) {
      console.error('Error unarchiving project:', err);
      throw err;
    }
  },

  /**
   * deleteProject
   */
  deleteProject: async (projectId: string) => {
    try {
      await db.collection('projects').doc(projectId).delete();
      // optional: notify 'deleted' if you want
    } catch (err) {
      console.error('Error deleting project:', err);
      throw err;
    }
  },

  /**
   * (Optional) Additional methods for worker assignment, etc.
   */
  assignWorkerToProject: async (projectId: string, workerId: string) => {
    try {
      const assignment = {
        projectId,
        workerId,
        status: 'active',
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await db.collection('projectAssignments').add(assignment);
    } catch (err) {
      console.error('Error assigning worker:', err);
      throw err;
    }
  },

  removeWorkerFromProject: async (assignmentId: string) => {
    try {
      const ref = db.collection('projectAssignments').doc(assignmentId);
      await ref.update({
        status: 'removed',
        removedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error('Error removing worker from project:', err);
      throw err;
    }
  },
};
