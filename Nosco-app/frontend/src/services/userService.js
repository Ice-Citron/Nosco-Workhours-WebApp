// src/services/userService.js
import { firestore } from '../firebase/firebase_config';

export const userService = {
  fetchUserData: async (userId) => {
    try {
      const userDoc = await firestore.collection('employees').doc(userId).get();
      if (userDoc.exists) {
        return userDoc.data();
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      throw new Error(error.message);
    }
  },

  updateUserProfile: async (userId, updatedData) => {
    try {
      await firestore.collection('employees').doc(userId).update(updatedData);
    } catch (error) {
      throw new Error(error.message);
    }
  },

  subscribeToNotifications: (userId, callback) => {
    const unsubscribe = firestore
      .collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        callback(notifications);
      });
    return unsubscribe;
  },
};
