// File: src/services/adminNotificationService.ts (for example)
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
