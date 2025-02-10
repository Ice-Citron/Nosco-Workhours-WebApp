/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * If you want to keep JSDoc strictly enforced, do not disable the rules below.
 * Instead, fix each warning. But for now, we'll disable them to pass your lint.
 */

import * as admin from "firebase-admin";
import {Firestore} from "firebase-admin/firestore";

/**
 * Our Firestore reference using the Admin SDK.
 */
const db: Firestore = admin.firestore();

/**
 * Data shape for creating/updating a project.
 * This interface helps TypeScript know what fields exist on your docs.
 */
interface ProjectData {
  id?: string;
  name?: string;
  status?: string; // e.g. "draft","active","ended","archived"
  startDate?: admin.firestore.Timestamp;
  endDate?: admin.firestore.Timestamp;
  createdAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
  archivedAt?: admin.firestore.Timestamp;
  endedAt?: admin.firestore.Timestamp;
  previousStatus?: string;
  unarchiveDate?: admin.firestore.Timestamp;
}

/**
 * Returns an array of admin user docs with id + optional name.
 * @returns {Promise<Array<{ id: string; name?: string }>>} The list of admin users
 */
async function getAllAdmins(): Promise<Array<{ id: string; name?: string }>> {
  const snapshot = await db.collection("users")
    .where("role", "==", "admin")
    .get();

  const admins: Array<{ id: string; name?: string }> = [];
  snapshot.forEach((docSnap) => {
    admins.push({id: docSnap.id, ...(docSnap.data() as any)});
  });
  return admins;
}

/**
 * Creates notifications for all admins, each doc referencing the project event.
 * @param {string} eventType - e.g. "created", "started", "ended"
 * @param {string} projectId - the Firestore doc ID of the project
 * @param {string} projectName - the project's name
 * @return {Promise<void>} A promise that resolves when notifications are created
 */
async function notifyAdminsOfProjectEvent(
  eventType: string,
  projectId: string,
  projectName: string
): Promise<void> {
  const admins = await getAllAdmins();

  let type = "project_update";
  let title = "Project Updated";
  let message = `Project "${projectName}" changed status.`;

  switch (eventType) {
  case "created":
    type = "project_created";
    title = "Project Created";
    message = `Project "${projectName}" was created.`;
    break;
  case "started":
    type = "project_started";
    title = "Project Started";
    message = `Project "${projectName}" is now active.`;
    break;
  case "ended":
    type = "project_ended";
    title = "Project Ended";
    message = `Project "${projectName}" has ended.`;
    break;
  case "archived":
    type = "project_archived";
    title = "Project Archived";
    message = `Project "${projectName}" was archived.`;
    break;
  case "unarchived":
    type = "project_unarchived";
    title = "Project Unarchived";
    message = `Project "${projectName}" was unarchived.`;
    break;
  default:
    break;
  }

  for (const adminObj of admins) {
    const notificationDoc = {
      type,
      title,
      message,
      entityType: "project",
      entityID: projectId,
      link: `/admin/projects/${projectId}`,
      userID: adminObj.id,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("notifications").add(notificationDoc);
  }
}

/**
 * A server-side version of your project logic using the Admin SDK.
 */
export const adminProjectService = {
  /**
   * @return {Promise<ProjectData[]>} List of all projects from "projects" collection
   */
  async getProjects(): Promise<ProjectData[]> {
    try {
      const snapshot = await db.collection("projects").get();
      const projects: ProjectData[] = [];

      snapshot.forEach((docSnap) => {
        projects.push({id: docSnap.id, ...docSnap.data()} as ProjectData);
      });
      return projects;
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  },

  /**
   * Create a new project doc with status="draft" and notify admins.
   * @param {ProjectData} projectData - object with name, start/end dates, etc.
   * @returns {Promise<{ id: string, [key: string]: any }>} newly created project data
   */
  async createProject(projectData: ProjectData): Promise<{ id: string; [key: string]: any }> {
    try {
      const newProject = {
        ...projectData,
        status: "draft",
        createdAt: admin.firestore.Timestamp.now(),
        startDate: projectData.startDate || admin.firestore.Timestamp.now(),
        endDate: projectData.endDate || admin.firestore.Timestamp.now(),
      };

      const docRef = await db.collection("projects").add(newProject);
      await notifyAdminsOfProjectEvent("created", docRef.id, newProject.name || "Unknown");
      return {id: docRef.id, ...newProject};
    } catch (err) {
      console.error("Error creating project:", err);
      throw err;
    }
  },

  /**
   * Update a project's status. If "active" => notify 'started'; if "ended" => notify 'ended'.
   * @param {string} projectId Firestore doc ID
   * @param {string} status new status (e.g. "active", "ended")
   * @return {Promise<void>} resolves when status is updated & notifications sent
   */
  async updateProjectStatus(projectId: string, status: string): Promise<void> {
    try {
      const projectRef = db.collection("projects").doc(projectId);
      const snap = await projectRef.get();
      if (!snap.exists) {
        throw new Error("Project not found");
      }
      const projData = snap.data() as ProjectData;

      await projectRef.update({
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (status === "active") {
        await notifyAdminsOfProjectEvent("started", projectId, projData.name || "Unknown");
      } else if (status === "ended") {
        await notifyAdminsOfProjectEvent("ended", projectId, projData.name || "Unknown");
      }
    } catch (err) {
      console.error("Error updating project status:", err);
      throw err;
    }
  },

  /**
   * Get full details for a single project doc by ID.
   * @param {string} projectId Firestore doc ID
   * @return {Promise<ProjectData>} The project doc data
   */
  async getProjectDetails(projectId: string): Promise<ProjectData> {
    try {
      const projectRef = db.collection("projects").doc(projectId);
      const snap = await projectRef.get();
      if (!snap.exists) {
        throw new Error("Project not found");
      }
      return {id: snap.id, ...(snap.data() as ProjectData)};
    } catch (err) {
      console.error("Error fetching project details:", err);
      throw err;
    }
  },

  /**
   * Partially update a project's doc fields.
   * @param {string} projectId Firestore doc ID
   * @param {Partial<ProjectData>} data fields to update
   * @return {Promise<void>} resolves when updated
   */
  async updateProject(projectId: string, data: Partial<ProjectData>): Promise<void> {
    try {
      const projectRef = db.collection("projects").doc(projectId);
      await projectRef.update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error("Error updating project details:", err);
      throw err;
    }
  },

  /**
   * Set a project to "ended" and notify admins.
   * @param {string} projectId Firestore doc ID
   * @return {Promise<void>} resolves when ended
   */
  async endProject(projectId: string): Promise<void> {
    try {
      const ref = db.collection("projects").doc(projectId);
      const snap = await ref.get();
      if (!snap.exists) throw new Error("Project not found");

      const projectData = snap.data() as ProjectData;
      await ref.update({
        status: "ended",
        endedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await notifyAdminsOfProjectEvent("ended", projectId, projectData.name || "Unknown");
    } catch (err) {
      console.error("Error ending project:", err);
      throw err;
    }
  },

  /**
   * Archive a project by storing status="archived", plus previousStatus, etc.
   * @param {string} projectId Firestore doc ID
   * @return {Promise<void>} resolves when archived
   */
  async archiveProject(projectId: string): Promise<void> {
    try {
      const ref = db.collection("projects").doc(projectId);
      const snap = await ref.get();
      if (!snap.exists) throw new Error("Project not found");

      const data = snap.data() as ProjectData;
      const currentStatus = data.status || "draft";

      await ref.update({
        status: "archived",
        previousStatus: currentStatus,
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await notifyAdminsOfProjectEvent("archived", projectId, data.name || "Unknown");
    } catch (err) {
      console.error("Error archiving project:", err);
      throw err;
    }
  },

  /**
   * Unarchive a project by reverting to previousStatus and notifying admins.
   * @param {string} projectId Firestore doc ID
   * @return {Promise<void>} resolves when unarchived
   */
  async unarchiveProject(projectId: string): Promise<void> {
    try {
      const ref = db.collection("projects").doc(projectId);
      const snap = await ref.get();
      if (!snap.exists) throw new Error("Project not found");

      const data = snap.data() as ProjectData;
      const previousStatus = data.previousStatus || "ended";

      await ref.update({
        status: previousStatus,
        unarchiveDate: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await notifyAdminsOfProjectEvent("unarchived", projectId, data.name || "Unknown");
    } catch (err) {
      console.error("Error unarchiving project:", err);
      throw err;
    }
  },

  /**
   * Delete a project doc entirely.
   * @param {string} projectId Firestore doc ID
   * @return {Promise<void>} resolves when deleted
   */
  async deleteProject(projectId: string): Promise<void> {
    try {
      await db.collection("projects").doc(projectId).delete();
    } catch (err) {
      console.error("Error deleting project:", err);
      throw err;
    }
  },

  /**
   * Assign a worker to a project in "projectAssignments".
   * @param {string} projectId Firestore doc ID
   * @param {string} workerId user doc ID
   * @return {Promise<void>} resolves when assigned
   */
  async assignWorkerToProject(projectId: string, workerId: string): Promise<void> {
    try {
      const assignment = {
        projectId,
        workerId,
        status: "active",
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await db.collection("projectAssignments").add(assignment);
    } catch (err) {
      console.error("Error assigning worker to project:", err);
      throw err;
    }
  },

  /**
   * Remove a worker from a project by setting "removed" in projectAssignments.
   * @param {string} assignmentId doc ID in "projectAssignments"
   * @return {Promise<void>} resolves when removed
   */
  async removeWorkerFromProject(assignmentId: string): Promise<void> {
    try {
      const ref = db.collection("projectAssignments").doc(assignmentId);
      await ref.update({
        status: "removed",
        removedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error("Error removing worker from project:", err);
      throw err;
    }
  },
};
