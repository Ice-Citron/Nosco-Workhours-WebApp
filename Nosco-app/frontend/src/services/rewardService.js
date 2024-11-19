import { firestore } from '../firebase/firebase_config';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    getDocs, 
    addDoc, 
    updateDoc,
    setDoc,  // Added this
    doc,
    limit,
    getDoc,
    serverTimestamp 
  } from 'firebase/firestore';

export const rewardService = {
  // Get user's current reward points
  async getUserPoints(userID) {
    const docRef = doc(firestore, 'rewards', userID);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  // Get top rankings with optional limit
  async getRankings(limitCount = 10) {
    const rankingsQuery = query(
      collection(firestore, 'rewards'),
      orderBy('totalPoints', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(rankingsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Get point history for a user
  async getPointsHistory(userID, limitCount = 20) {
    const historyQuery = query(
      collection(firestore, 'rewardHistory'),
      where('userID', '==', userID),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(historyQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Add points to user's balance
  async addPoints(userID, points, reason, relatedEntityId = null, relatedEntityType = null) {
    const userRef = doc(firestore, 'rewards', userID);
    const userDoc = await getDoc(userRef);
    
    const currentPoints = userDoc.exists() ? userDoc.data().totalPoints : 0;
    const newTotal = currentPoints + points;

    // Update or create user's reward document
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        totalPoints: newTotal,
        lastUpdated: serverTimestamp()
      });
    } else {
      await setDoc(userRef, {
        userID,
        totalPoints: points,
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    }

    // Add history entry
    await addDoc(collection(firestore, 'rewardHistory'), {
      userID,
      change: points,
      reason,
      relatedEntityId,
      relatedEntityType,
      balance: newTotal,
      createdAt: serverTimestamp()
    });

    return newTotal;
  }
};