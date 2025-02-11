/* eslint-disable max-len, @typescript-eslint/no-explicit-any */

/**
 * adminProjectInvitationService.ts (Cloud Functions)
 *
 * Provides two main scheduled/utility functions:
 *   1) autoExpireOverdueInvitations()
 *   2) syncInvitationsWithProjectWorkers()
 *
 * You can call each separately in your index.ts:
 *
 *   export const autoExpireInvitations = functions.pubsub.schedule(...).onRun(...);
 *   export const syncInvitations = functions.pubsub.schedule(...).onRun(...);
 */

import * as admin from "firebase-admin";

const db = admin.firestore();

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
 * We’ll set something like { status: "active", joinedAt: new Date() } for that worker, 
 * but adjust the shape as your schema dictates.
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
 * 1) autoExpireOverdueInvitations():
 *    - Query all invitation docs with status='pending'
 *    - If requiredResponseDate < now => set status='rejected', declineReason='expired'
 *    - Also remove that user from project doc’s workers map.
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

  console.log(`Found ${snapshot.size} overdue invitations -> rejecting them.`);

  for (const docSnap of snapshot.docs) {
    const invRef = docSnap.ref;
    const invData = docSnap.data();
    const projectId = invData.projectID;
    const userId = invData.userID;

    // Mark the invitation as 'rejected'
    await invRef.update({
      status: "rejected",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      declineReason: "expired",
    });

    // Also remove from project doc
    await removeWorkerFromProject(projectId, userId);
  }

  console.log("autoExpireOverdueInvitations: Done.");
}

/**
 * 2) syncInvitationsWithProjectWorkers():
 *    - For EVERY invitation doc, read { status, projectID, userID }.
 *    - If status=='accepted' => ensure that user is in project’s workers map.
 *    - Otherwise => ensure the user is removed from the project’s workers map.
 *
 * Call this daily or after major changes. Or if you want partial updates, 
 * you can do smaller queries. But this is the brute‐force approach.
 */
export async function syncInvitationsWithProjectWorkers(): Promise<void> {
  console.log("syncInvitationsWithProjectWorkers: Starting...");

  const invitationsRef = db.collection("projectInvitations");
  const allInvitationsSnap = await invitationsRef.get();
  if (allInvitationsSnap.empty) {
    console.log("No invitations found. Done.");
    return;
  }

  let processedCount = 0;
  for (const docSnap of allInvitationsSnap.docs) {
    const invData = docSnap.data();
    const projectId = invData.projectID;
    const userId = invData.userID;
    const status = invData.status;

    if (!projectId || !userId) {
      console.warn(
        `Invitation ${docSnap.id} missing projectID/userID fields. Skipping.`
      );
      continue;
    }

    if (status === "accepted") {
      // Ensure user is in project doc
      await addWorkerToProject(projectId, userId);
    } else {
      // pending, cancelled, rejected, etc => remove
      await removeWorkerFromProject(projectId, userId);
    }

    processedCount++;
  }

  console.log(
    `syncInvitationsWithProjectWorkers: Completed. Processed ${processedCount} invitation docs.`
  );
}

/**
 * Auto-cancels invitations for which the associated project is already ended.
 * For each invitation with status "pending", it reads the project.
 * If the project’s status is "ended", then the invitation is updated:
 *   - status is set to "cancelled"
 *   - updatedAt is set to the current server timestamp
 *   - cancelReason is set to "project expired"
 */
export async function autoCancelEndedProjectInvitations(): Promise<void> {
  console.log("autoCancelEndedProjectInvitations: Starting...");

  const invitationsRef = db.collection("projectInvitations");
  // Query invitations with status "pending" (i.e. ongoing invitations)
  const snapshot = await invitationsRef.where("status", "==", "pending").get();

  if (snapshot.empty) {
    console.log("autoCancelEndedProjectInvitations: No pending invitations found.");
    return;
  }

  let processedCount = 0;
  for (const docSnap of snapshot.docs) {
    const invData = docSnap.data();
    const projectId = invData.projectID;
    const userId = invData.userID;

    if (!projectId) {
      console.warn(`autoCancelEndedProjectInvitations: Invitation ${docSnap.id} missing projectID; skipping.`);
      continue;
    }

    // Get the project document
    const projectRef = db.collection("projects").doc(projectId);
    const projectSnap = await projectRef.get();
    if (!projectSnap.exists) {
      console.warn(`autoCancelEndedProjectInvitations: Project ${projectId} not found; skipping invitation ${docSnap.id}.`);
      continue;
    }

    const projectData = projectSnap.data();
    // Check if the project is ended
    if (projectData && projectData.status === "ended") {
      console.log(`autoCancelEndedProjectInvitations: Cancelling invitation ${docSnap.id} because project ${projectId} is ended.`);
      await docSnap.ref.update({
        status: "cancelled",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        cancelReason: "project expired"
      });
      processedCount++;
    } else {
      console.log(`autoCancelEndedProjectInvitations: Invitation ${docSnap.id} not cancelled (project status: ${projectData?.status}).`);
    }
  }

  console.log(`autoCancelEndedProjectInvitations: Completed. Processed ${processedCount} invitations.`);
}
