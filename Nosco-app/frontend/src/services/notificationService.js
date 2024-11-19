// services/notificationService.js
import { firestore as db } from '../firebase/firebase_config';
import { 
 collection, query, where, orderBy, getDocs,
 updateDoc, doc, writeBatch, Timestamp, addDoc 
} from 'firebase/firestore';
import { NOTIFICATION_TYPES, ENTITY_TYPES } from '../utils/constants';


export const getNotificationsQuery = (userID) => {
 return query(
   collection(db, 'notifications'),
   where('userID', '==', userID),
   orderBy('createdAt', 'desc')
 );
};

export const getUnreadNotificationsQuery = (userID) => {
 return query(
   collection(db, 'notifications'),
   where('userID', '==', userID),
   where('read', '==', false),
   orderBy('createdAt', 'desc')
 );
};

export const markAsRead = async (notificationID) => {
 const notificationRef = doc(db, 'notifications', notificationID);
 await updateDoc(notificationRef, { read: true });
};

export const markAllAsRead = async (userID) => {
 const batch = writeBatch(db);
 const q = query(
   collection(db, 'notifications'),
   where('userID', '==', userID),
   where('read', '==', false)
 );
 const snapshot = await getDocs(q);
 
 snapshot.docs.forEach((doc) => {
   batch.update(doc.ref, { read: true });
 });
 
 await batch.commit();
};

export const createNotification = async (notificationData) => {
 const notification = {
   ...notificationData,
   createdAt: Timestamp.now(),
   read: false
 };
 
 await addDoc(collection(db, 'notifications'), notification);
};

export const getNotificationsByType = async (userID, type) => {
 const q = query(
   collection(db, 'notifications'),
   where('userID', '==', userID),
   where('type', '==', type),
   orderBy('createdAt', 'desc')
 );
 
 return getDocs(q);
};