/* eslint-disable max-len, @typescript-eslint/no-explicit-any */

/**
 * adminProjectInvitationService.ts (Cloud Functions)
 *
 * Provides three main scheduled/utility functions:
 *   1) autoExpireOverdueInvitations() -> sets status="cancelled", cancelReason="expired"
 *   2) syncInvitationsWithProjectWorkers() -> keeps project.workers map in sync
 *   3) autoCancelEndedProjectInvitations() -> sets status="cancelled", cancelReason="project ended"
 *
 * All worker rejections remain status="rejected" with a worker-based declineReason.
 */

import * as admin from "firebase-admin";
const db = admin.firestore();

/**
 * Helper: fetch all admin users from "users" collection where role=="admin".
 */
async function getAllAdmins() {
  const snap = await db.collection("users").where("role", "==", "admin").get();
  if (snap.empty) return [];

  const admins: Array<{ id: string; [key: string]: any }> = [];
  snap.forEach(doc => {
    admins.push({ id: doc.id, ...doc.data() });
  });
  return admins;
}

/**
 * Helper: create a single notification doc in "notifications" collection.
 */
async function createNotification(notificationData: {
  userID: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityID?: string;
  link?: string;
}) {
  const docRef = await db.collection("notifications").add({
    ...notificationData,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Helper: notify ALL admins with a custom "type/title/message".
 */
async function notifyAllAdmins(notificationPartial: {
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityID?: string;
  link?: string;
}) {
  const admins = await getAllAdmins();
  for (const adminUser of admins) {
    await createNotification({
      userID: adminUser.id,
      ...notificationPartial,
    });
  }
}

/** 
 * Helper: remove the given userId from the project’s workers map if present. 
 */
async function removeWorkerFromProject(projectId: string, userId: string): Promise<void> {
  const projectRef = db.collection("projects").doc(projectId);
  const snapshot = await projectRef.get();
  if (!snapshot.exists) {
    console.warn(`[removeWorkerFromProject] Project ${projectId} not found; skipping remove.`);
    return;
  }

  const projectData = snapshot.data() || {};
  const workersMap: Record<string, any> = projectData.workers || {};

  if (workersMap[userId]) {
    delete workersMap[userId];
    await projectRef.update({ workers: workersMap });
    console.log(`[removeWorkerFromProject] Removed user ${userId} from project ${projectId}.`);
  }
}

/** 
 * Helper: add the given userId to the project’s workers map if not already present.
 */
async function addWorkerToProject(projectId: string, userId: string): Promise<void> {
  const projectRef = db.collection("projects").doc(projectId);
  const snapshot = await projectRef.get();
  if (!snapshot.exists) {
    console.warn(`[addWorkerToProject] Project ${projectId} not found; skipping add.`);
    return;
  }

  const projectData = snapshot.data() || {};
  const workersMap: Record<string, any> = projectData.workers || {};

  if (!workersMap[userId]) {
    workersMap[userId] = {
      status: "active",
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await projectRef.update({ workers: workersMap });
    console.log(`[addWorkerToProject] Added user ${userId} to project ${projectId}.`);
  }
}

/**
 * Retrieve basic info about the project & user to enrich admin notifications:
 *   - projectName
 *   - userName
 */
async function getProjectAndUserInfo(projectId: string, userId: string) {
  let projectName = "(unknown project)";
  let userName = "(unknown user)";

  // fetch project name
  try {
    const projectSnap = await db.collection("projects").doc(projectId).get();
    if (projectSnap.exists) {
      projectName = projectSnap.data()?.name || projectName;
    }
  } catch (err) {
    console.warn("Error fetching project name:", err);
  }

  // fetch user name
  try {
    const userSnap = await db.collection("users").doc(userId).get();
    if (userSnap.exists) {
      userName = userSnap.data()?.name || userName;
    }
  } catch (err) {
    console.warn("Error fetching user name:", err);
  }

  return { projectName, userName };
}

/**
 * 1) autoExpireOverdueInvitations():
 *    - For invitations with status='pending' & requiredResponseDate < now
 *    - Sets status='cancelled', cancelReason='expired'
 *    - Removes from project’s workers map
 *    - Notifies the worker + all admins
 */
export async function autoExpireOverdueInvitations(): Promise<void> {
  console.log("autoExpireOverdueInvitations: Starting...");

  const invitationsRef = db.collection("projectInvitations");
  const now = new Date();

  // We want invitations with status='pending' AND requiredResponseDate < now
  const snapshot = await invitationsRef
    .where("status", "==", "pending")
    .where("requiredResponseDate", "<", admin.firestore.Timestamp.fromDate(now))
    .get();

  if (snapshot.empty) {
    console.log("No overdue invitations found.");
    return;
  }

  console.log(`Found ${snapshot.size} overdue invitations -> auto-cancelling them.`);

  for (const docSnap of snapshot.docs) {
    const invRef = docSnap.ref;
    const invData = docSnap.data();
    const invitationId = docSnap.id;
    const projectId = invData.projectID;
    const userId = invData.userID;

    // Update invitation => status='cancelled', cancelReason='expired'
    await invRef.update({
      status: "cancelled",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      cancelReason: "expired",
    });

    // Remove from project doc
    await removeWorkerFromProject(projectId, userId);

    // Worker notification
    await createNotification({
      userID: userId,
      type: "project_invitation_cancelled",
      title: "Invitation Auto-Cancelled (Expired)",
      message: "Your invitation was cancelled because it exceeded the response deadline.",
      entityType: "project_invitation",
      entityID: invitationId,
      link: "/worker/project-invitations"
    });

    // Admin notifications
    const { projectName, userName } = await getProjectAndUserInfo(projectId, userId);
    const createdAt = invData.createdAt?.toDate
      ? invData.createdAt.toDate().toISOString().slice(0,19).replace("T"," ")
      : "(unknown)";
    const requiredDate = invData.requiredResponseDate?.toDate
      ? invData.requiredResponseDate.toDate().toISOString().slice(0,19).replace("T"," ")
      : "(unknown)";

    const adminMessage = 
      `Invitation #${invitationId} for user "${userName}" on project "${projectName}" was auto-cancelled (expired).\n` +
      `• Created At: ${createdAt}\n` +
      `• Required Response By: ${requiredDate}\n` +
      `• Final Status: cancelled ("expired")`;

    await notifyAllAdmins({
      type: "invitation_auto_expired",
      title: "Project Invitation Auto-Cancelled (Expiry)",
      message: adminMessage,
      entityType: "project_invitation",
      entityID: invitationId,
      link: "/admin/project-invitations"
    });
  }

  console.log("autoExpireOverdueInvitations: Done.");
}

/**
 * 2) syncInvitationsWithProjectWorkers():
 *    - For EVERY invitation doc, read { status, projectID, userID }.
 *    - If status=='accepted' => ensure that user is in project’s workers map.
 *    - Otherwise => ensure the user is removed from project’s workers map.
 *    - [Optional] create admin notifications if you want to log these sync actions.
 */
export async function syncInvitationsWithProjectWorkers(): Promise<void> {
  console.log("syncInvitationsWithProjectWorkers: Starting...");

  const invitationsSnap = await db.collection("projectInvitations").get();
  if (invitationsSnap.empty) {
    console.log("No invitations found. Done.");
    return;
  }

  let processedCount = 0;
  for (const docSnap of invitationsSnap.docs) {
    const invitationId = docSnap.id;
    const invData = docSnap.data();
    const projectId = invData.projectID;
    const userId = invData.userID;
    const status = invData.status || "pending";

    if (!projectId || !userId) {
      console.warn(`Invitation ${invitationId} missing projectID/userID. Skipping.`);
      continue;
    }

    const { projectName, userName } = await getProjectAndUserInfo(projectId, userId);

    if (status === "accepted") {
      await addWorkerToProject(projectId, userId);
      // Optionally notify admins
      await notifyAllAdmins({
        type: "invitation_sync_accepted",
        title: "Invitation Synced (Accepted)",
        message: `User "${userName}" is accepted on project "${projectName}", ensured in workers map.`,
        entityType: "project_invitation",
        entityID: invitationId,
        link: "/admin/project-invitations"
      });
    } else {
      // cancelled, pending, rejected => remove from project doc
      await removeWorkerFromProject(projectId, userId);

      await notifyAllAdmins({
        type: "invitation_sync_other",
        title: `Invitation Synced (${status})`,
        message: `User "${userName}" invitation is "${status}" => removed from project "${projectName}" if present.`,
        entityType: "project_invitation",
        entityID: invitationId,
        link: "/admin/project-invitations"
      });
    }

    processedCount++;
  }

  console.log(`syncInvitationsWithProjectWorkers: Completed. Processed ${processedCount} invitations.`);
}

/**
 * 3) autoCancelEndedProjectInvitations():
 *    - For each invitation with status "pending", if project is ended => set invitation.status="cancelled",
 *      cancelReason="project ended".
 *    - Remove user from project doc, notify worker & all admins with details.
 */
export async function autoCancelEndedProjectInvitations(): Promise<void> {
  console.log("autoCancelEndedProjectInvitations: Starting...");

  const snap = await db.collection("projectInvitations")
    .where("status", "==", "pending")
    .get();

  if (snap.empty) {
    console.log("autoCancelEndedProjectInvitations: No pending invitations found.");
    return;
  }

  let processedCount = 0;
  for (const docSnap of snap.docs) {
    const invData = docSnap.data();
    const invitationId = docSnap.id;
    const projectId = invData.projectID;
    const userId = invData.userID;

    if (!projectId) {
      console.warn(`autoCancelEndedProjectInvitations: Invitation ${invitationId} missing projectID; skipping.`);
      continue;
    }

    // check project
    const projectRef = db.collection("projects").doc(projectId);
    const projectSnap = await projectRef.get();
    if (!projectSnap.exists) {
      console.warn(`autoCancelEndedProjectInvitations: Project ${projectId} not found; skipping invitation ${invitationId}.`);
      continue;
    }

    const projectData = projectSnap.data();
    // If the project is ended => auto-cancel invitation
    if (projectData && projectData.status === "ended") {
      console.log(`autoCancelEndedProjectInvitations: Cancelling invitation ${invitationId} (project ended).`);

      await docSnap.ref.update({
        status: "cancelled",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        cancelReason: "project ended"
      });

      // remove from project doc if present
      await removeWorkerFromProject(projectId, userId);

      // notify worker
      await createNotification({
        userID: userId,
        type: "project_invitation_cancelled",
        title: "Project Invitation Cancelled",
        message: "Your invitation was cancelled because the project ended.",
        entityType: "project_invitation",
        entityID: invitationId,
        link: "/worker/project-invitations"
      });

      // notify admins
      const { projectName, userName } = await getProjectAndUserInfo(projectId, userId);
      const createdAt = invData.createdAt?.toDate
        ? invData.createdAt.toDate().toISOString().slice(0,19).replace("T"," ")
        : "(unknown)";
      const requiredDate = invData.requiredResponseDate?.toDate
        ? invData.requiredResponseDate.toDate().toISOString().slice(0,19).replace("T"," ")
        : "(unknown)";

      const adminMessage = 
        `Invitation #${invitationId} for user "${userName}" on project "${projectName}" was auto-cancelled because the project ended.\n` +
        `• Created At: ${createdAt}\n` +
        `• Required Response By: ${requiredDate}\n` +
        `• Final Status: cancelled ("project ended")`;

      await notifyAllAdmins({
        type: "invitation_auto_cancelled",
        title: "Project Invitation Cancelled (Project Ended)",
        message: adminMessage,
        entityType: "project_invitation",
        entityID: invitationId,
        link: "/admin/project-invitations"
      });

      processedCount++;
    } else {
      console.log(`autoCancelEndedProjectInvitations: Invitation ${invitationId} not cancelled (project status: ${projectData?.status}).`);
    }
  }

  console.log(`autoCancelEndedProjectInvitations: Completed. Processed ${processedCount} invitations.`);
}
