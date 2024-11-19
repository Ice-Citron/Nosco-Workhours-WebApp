// src/services/notificationService.js
import { firestore as db } from '../firebase/firebase_config';
import { collection, query, where, orderBy, updateDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
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