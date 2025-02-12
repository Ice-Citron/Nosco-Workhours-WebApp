/* eslint-disable max-len */
/**
 * We can disable max-len if we find 80 chars too restrictive.
 * Or we can wrap lines below 80 chars manually.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

import {adminProjectService} from "./services/adminProjectService";
import { autoRefreshIfNeeded } from "./services/adminSettingsService";
import { autoCancelEndedProjectInvitations, autoExpireOverdueInvitations, syncInvitationsWithProjectWorkers } from "./services/adminProjectInvitationService";


/**
 * Interface for project data, so TS knows about the shape
 */
interface ProjectData {
  id?: string;
  name?: string;
  status?: string; // "draft","active","ended","archived"
  startDate?: admin.firestore.Timestamp;
  endDate?: admin.firestore.Timestamp;
  // Add other fields if needed
}

export const autoUpdateProjects = functions.pubsub
  .schedule("0 2 * * *") // runs daily at 2 AM
  .timeZone("Asia/Singapore")
  .onRun(async () => {
    console.log("Running autoUpdateProjects...");
    const now = new Date();

    const projects: ProjectData[] = await adminProjectService.getProjects();

    for (const p of projects) {
      if (p.status === "draft" && p.startDate && p.startDate.toDate() <= now) {
        if (p.id) {
          await adminProjectService.updateProjectStatus(p.id, "active");
          console.log(`Auto-started project: ${p.id}`);
        }
      }
      if (p.status === "active" && p.endDate && p.endDate.toDate() <= now) {
        if (p.id) {
          await adminProjectService.updateProjectStatus(p.id, "ended");
          console.log(`Auto-ended project: ${p.id}`);
        }
      }
    }

    return null;
  });

/**
 * A scheduled function to check if currency rates need refreshing.
 * 
 * Runs daily at 3 AM for example
 */
export const autoRefreshExchangeRates = functions.pubsub
  .schedule("0 3 * * *")
  .timeZone("Asia/Singapore")
  .onRun(async () => {
    console.log("Running autoRefreshExchangeRates...");
    await autoRefreshIfNeeded(); // will only fetch if diffDays >= refreshPeriodDays
    return null;
  });

// Run daily at 4 AM
export const autoExpireInvitations = functions.pubsub
  .schedule("0 4 * * *")
  .timeZone("Asia/Singapore")
  .onRun(async () => {
    await autoExpireOverdueInvitations();
    return null;
  });

// Run daily at 5 AM
export const doSyncInvitations = functions.pubsub
  .schedule("0 5 * * *")
  .timeZone("Asia/Singapore")
  .onRun(async () => {
    await syncInvitationsWithProjectWorkers();
    return null;
  });

export const autoCancelEndedInvitations = functions.pubsub
  .schedule("0 6 * * *") // runs daily at 6 AM (adjust as needed)
  .timeZone("Asia/Singapore")
  .onRun(async () => {
    await autoCancelEndedProjectInvitations();
    return null;
  });

export const cleanupOldNotifications = functions.pubsub
  .schedule("0 7 * * *") // runs every day at 7 AM, for example
  .timeZone("Asia/Singapore")
  .onRun(async () => {
    console.log("Running cleanupOldNotifications...");

    const now = Date.now();
    // 14 days in milliseconds
    const cutoff = now - (14 * 24 * 60 * 60 * 1000);

    // We'll query notifications where createdAt < cutoff
    // (Assuming createdAt is a Firestore timestamp)
    const cutoffTimestamp = admin.firestore.Timestamp.fromMillis(cutoff);

    const notificationsRef = admin.firestore().collection("notifications");
    const oldSnap = await notificationsRef
      .where("createdAt", "<", cutoffTimestamp)
      .get();

    if (oldSnap.empty) {
      console.log("No old notifications to delete.");
      return;
    }

    let deleteCount = 0;
    // batch or sequentially delete
    const batch = admin.firestore().batch();
    oldSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
      deleteCount++;
    });
    await batch.commit();

    console.log(`cleanupOldNotifications: Deleted ${deleteCount} old notifications.`);
  });

/**
 * 
cd function   # or wherever your package.json for Cloud Functions is
npm run build
cd ..
firebase deploy --only "functions:functions"
 */