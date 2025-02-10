import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

import { adminProjectService } from './services/adminProjectService';

export const autoUpdateProjects = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('Asia/Singapore')
  .onRun(async () => {
    console.log('Running autoUpdateProjects...');
    // Example: all 'draft' or 'active' projects, auto start or end if needed
    const projects = await adminProjectService.getProjects();
    const now = new Date();

    for (const p of projects) {
      if (p.status === 'draft' && p.startDate?.toDate() <= now) {
        await adminProjectService.updateProjectStatus(p.id as string, 'active');
      }
      if (p.status === 'active' && p.endDate?.toDate() <= now) {
        await adminProjectService.updateProjectStatus(p.id as string, 'ended');
      }
    }
    return null;
  });
