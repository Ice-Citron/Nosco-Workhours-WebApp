/* eslint-disable max-len, @typescript-eslint/no-explicit-any */
/**
 * adminProjectService.ts (Minimal)
 *
 * Keeps only:
 *   1) getProjects()
 *   2) updateProjectStatus()
 *
 * For your scheduled auto-start/end. 
 * Also references `notifyProjectLifecycleEventAll(...)` 
 * to notify both admins and workers about project changes.
 */

import * as admin from "firebase-admin";
import { Firestore } from "firebase-admin/firestore";
import { notifyProjectLifecycleEventAll } from "./adminNotificationService"; 

const db: Firestore = admin.firestore();

interface ProjectData {
  id?: string;
  name?: string;
  status?: string;   // "draft","active","ended","archived"
  startDate?: admin.firestore.Timestamp;
  endDate?: admin.firestore.Timestamp;
  createdAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
}

/**
 * getProjects():
 *  - Returns all docs from "projects"
 *  - Used by autoUpdateProjects to check if startDate/endDate has passed
 */
export const getProjects = async (): Promise<ProjectData[]> => {
  const snapshot = await db.collection("projects").get();
  const projects: ProjectData[] = [];
  snapshot.forEach(docSnap => {
    projects.push({ id: docSnap.id, ...docSnap.data() } as ProjectData);
  });
  return projects;
};

/**
 * updateProjectStatus():
 *  - Sets the project doc's status to "active" or "ended"
 *  - Calls `notifyProjectLifecycleEventAll(...)` so both admins & relevant workers 
 *    are notified of "started" or "ended" events.
 */
export const updateProjectStatus = async (
  projectId: string, 
  status: string
): Promise<void> => {
  const projectRef = db.collection("projects").doc(projectId);
  const snap = await projectRef.get();
  if (!snap.exists) throw new Error("Project not found");

  await projectRef.update({
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Let the notification service figure out 
  // how to notify both admins & workers:
  if (status === "active") {
    await notifyProjectLifecycleEventAll("started", projectId);
  } else if (status === "ended") {
    await notifyProjectLifecycleEventAll("ended", projectId);
  }
};

/**
 * Exported as an object for convenience if you prefer that style:
 */
export const adminProjectService = {
  getProjects,
  updateProjectStatus,
};
