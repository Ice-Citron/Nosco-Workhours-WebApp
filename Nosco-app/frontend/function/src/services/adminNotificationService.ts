/* eslint-disable max-len, @typescript-eslint/no-explicit-any */
/**
 * adminNotificationService.ts
 *
 * Existing code for createNotification, fetchAllAdmins, notifyAllAdmins,
 * plus new helper methods to also notify project workers for start/end/archived/unarchived.
 */

import * as admin from 'firebase-admin';
const db = admin.firestore();

interface AdminNotification {
  userID: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityID?: string;
  link?: string;
}

/**
 * createNotification: write a single doc to 'notifications' collection
 */
export async function createNotification(n: AdminNotification): Promise<void> {
  await db.collection('notifications').add({
    ...n,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * fetchAllAdmins: returns an array of user docs whose role == 'admin'
 */
async function fetchAllAdmins(): Promise<{ id: string; name?: string; }[]> {
  const snapshot = await db
    .collection('users')
    .where('role', '==', 'admin')
    .get();

  const admins: { id: string; name?: string }[] = [];
  snapshot.forEach(docSnap => {
    admins.push({ id: docSnap.id, ...(docSnap.data() as any) });
  });
  return admins;
}

/**
 * notifyAllAdmins: for a given event, sends a *separate* notification doc 
 * to each admin’s userID in the system
 */
export async function notifyAllAdmins(
  type: string, 
  title: string, 
  message: string, 
  entityType: string, 
  entityID: string,
  link?: string
): Promise<void> {
  const admins = await fetchAllAdmins();
  for (const adminUser of admins) {
    const userID = adminUser.id;
    await createNotification({
      userID,
      type,
      title,
      message,
      entityType,
      entityID,
      link,
    });
  }
}

/** 
 * Minimal shape for a project doc
 * (so TypeScript knows about the 'name' & 'workers')
 */
interface ProjectDoc {
  name?: string;
  workers?: Record<string, any>; 
  // e.g. { "uid123": { status: "active", joinedAt: ... }, ... }
}

/**
 * fetchProjectDoc: reads the project doc from Firestore to get its name & workers map
 */
async function fetchProjectDoc(projectId: string): Promise<ProjectDoc | null> {
  const snap = await db.collection('projects').doc(projectId).get();
  if (!snap.exists) return null;
  return snap.data() as ProjectDoc;
}

/**
 * notifyProjectWorkers: for "started", "ended", "archived", or "unarchived",
 * we fetch the project doc, loop its 'workers' map, and create a notification
 * for each worker. 
 */
async function notifyProjectWorkers(
  eventType: string,
  projectId: string,
  projectName: string
): Promise<void> {
  const projectDoc = await fetchProjectDoc(projectId);
  if (!projectDoc) {
    console.warn(`[notifyProjectWorkers] Project doc ${projectId} not found.`);
    return;
  }

  const workersMap = projectDoc.workers || {};
  const workerIds = Object.keys(workersMap);
  if (workerIds.length === 0) {
    console.log(`[notifyProjectWorkers] No workers for project ${projectId}`);
    return;
  }

  // We'll link them to the worker's "projects" page by default
  let type = "project_update";
  let title = "Project Updated";
  let message = `Project "${projectName}" changed status.`;
  const link = "/worker/projects";

  switch (eventType) {
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
      // other events like "created" might not matter for workers
      return;
  }

  for (const workerUid of workerIds) {
    await createNotification({
      userID: workerUid,
      type,
      title,
      message,
      entityType: "project",
      entityID: projectId,
      link
    });
  }
}

/**
 * notifyProjectLifecycleEventAll: 
 *   1) Notifies all admins about the event 
 *   2) If event in ["started","ended","archived","unarchived"], also notifies project workers
 *
 * eventType examples: "created", "started", "ended", "archived", "unarchived"
 */
export async function notifyProjectLifecycleEventAll(
  eventType: string,
  projectId: string
): Promise<void> {
  const projectDoc = await fetchProjectDoc(projectId);
  const projectName = projectDoc?.name || "Unknown Project";

  // For admins, we do a switch to pick a type/title/message
  let type = "project_update";
  let title = "Project Updated";
  let message = `Project "${projectName}" changed status.`;
  const adminLink = `/admin/projects/${projectId}`;

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

  // 1) Notify all admins
  await notifyAllAdmins(
    type,
    title,
    message,
    "project",
    projectId,
    adminLink
  );

  // 2) If event is in the worker set, notify the project's workers
  const workerEvents = ["started", "ended", "archived", "unarchived"];
  if (workerEvents.includes(eventType)) {
    await notifyProjectWorkers(eventType, projectId, projectName);
  }
}
