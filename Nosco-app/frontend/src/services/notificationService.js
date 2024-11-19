// src/services/notificationService.js
import { db } from '../firebase/firebaseConfig';
import { collection, query, where, orderBy, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';

export const getNotificationsQuery = (userId) => {
  return query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
};

export const markAsRead = async (notificationId) => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, { read: true });
};

export const markAllAsRead = async (userId) => {
  const batch = writeBatch(db);
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );
  const snapshot = await getDocs(q);
  
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { read: true });
  });
  
  await batch.commit();
};