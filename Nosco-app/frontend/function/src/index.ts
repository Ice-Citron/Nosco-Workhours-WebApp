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
import { autoExpireOverdueInvitations, syncInvitationsWithProjectWorkers } from "./services/adminProjectInvitationService";


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