/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * adminProjectService.ts
 *
 * A server-side version of your project logic using the Admin SDK.
 * You asked to “notify all admins whenever a project is started/ended/archived”.
 * So we do that via the `notifyAdminsOfProjectEvent()` helper below.
 */

import * as admin from "firebase-admin";
import { Firestore } from "firebase-admin/firestore";

const db: Firestore = admin.firestore();

interface ProjectData {
  id?: string;
  name?: string;
  status?: string; // "draft","active","ended","archived"
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
 * Helper to get all admins from 'users' collection whose role=='admin'
 */
async function getAllAdmins(): Promise<Array<{ id: string; name?: string }>> {
  const snapshot = await db.collection("users")
    .where("role", "==", "admin")
    .get();

  const admins: Array<{ id: string; name?: string }> = [];
  snapshot.forEach((docSnap) => {
    admins.push({ id: docSnap.id, ...(docSnap.data() as any) });
  });
  return admins;
}

/**
 * notifyAdminsOfProjectEvent:
 *  - For each admin, create a notification doc about a project event
 *  - e.g. "project_started", "project_ended", "project_archived"
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

  for (const adminUser of admins) {
    await db.collection("notifications").add({
      type,
      title,
      message,
      entityType: "project",
      entityID: projectId,
      link: `/admin/projects/${projectId}`,
      userID: adminUser.id,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

/**
 * The adminProjectService object with your standard methods.
 */
export const adminProjectService = {
  /**
   * Return all projects from 'projects' collection
   */
  async getProjects(): Promise<ProjectData[]> {
    try {
      const snapshot = await db.collection("projects").get();
      const projects: ProjectData[] = [];
      snapshot.forEach((docSnap) => {
        projects.push({ id: docSnap.id, ...docSnap.data() } as ProjectData);
      });
      return projects;
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  },

  /**
   * Create new project with status='draft', notify admin=created
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
      return { id: docRef.id, ...newProject };
    } catch (err) {
      console.error("Error creating project:", err);
      throw err;
    }
  },

  /**
   * Update project status
   * If "active" => event='started', if "ended" => event='ended', etc.
   */
  async updateProjectStatus(projectId: string, status: string): Promise<void> {
    try {
      const projectRef = db.collection("projects").doc(projectId);
      const snap = await projectRef.get();
      if (!snap.exists) throw new Error("Project not found");
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
   * Get project doc by ID
   */
  async getProjectDetails(projectId: string): Promise<ProjectData> {
    try {
      const ref = db.collection("projects").doc(projectId);
      const snap = await ref.get();
      if (!snap.exists) {
        throw new Error("Project not found");
      }
      return { id: snap.id, ...(snap.data() as ProjectData) };
    } catch (err) {
      console.error("Error fetching project details:", err);
      throw err;
    }
  },

  /**
   * Partially update project doc fields
   */
  async updateProject(projectId: string, data: Partial<ProjectData>): Promise<void> {
    try {
      const ref = db.collection("projects").doc(projectId);
      await ref.update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error("Error updating project details:", err);
      throw err;
    }
  },

  /**
   * set project to "ended", notify=ended
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
   * archive project => status='archived', notify=archived
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
   * unarchive => revert to previousStatus, notify=unarchived
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
   * Delete doc entirely (no event to admins for this unless you want to add it).
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
   * Optionally assign a worker => "projectAssignments" doc
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
      console.error("Error assigning worker:", err);
      throw err;
    }
  },

  /**
   * Remove worker => set "removed" in projectAssignments
   */
  async removeWorkerFromProject(assignmentId: string): Promise<void> {
    try {
      const ref = db.collection("projectAssignments").doc(assignmentId);
      await ref.update({
        status: "removed",
        removedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error("Error removing worker:", err);
      throw err;
    }
  },
};
