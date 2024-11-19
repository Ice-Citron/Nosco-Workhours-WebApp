// src/services/adminRewardService.js
import { firestore } from '../firebase/firebase_config';
import { 
  doc, 
  collection, 
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';

export const adminRewardService = {
  async addUserPoints(userID, points, reason, metadata = {}) {
    try {
      await runTransaction(firestore, async (transaction) => {
        const rewardsRef = doc(firestore, 'rewards', userID);
        const rewardDoc = await transaction.get(rewardsRef);
        
        const currentPoints = rewardDoc.exists() ? 
          rewardDoc.data().totalPoints : 0;
        const newTotal = currentPoints + points;

        // Update rewards document
        transaction.set(rewardsRef, {
          userID,
          totalPoints: newTotal,
          lastUpdated: serverTimestamp(),
          createdAt: rewardDoc.exists() ? 
            rewardDoc.data().createdAt : 
            serverTimestamp()
        }, { merge: true });

        // Create history entry
        const historyRef = doc(collection(firestore, 'rewardHistory'));
        transaction.set(historyRef, {
          userID,
          change: points,
          balance: newTotal,
          reason,
          ...metadata,
          createdAt: serverTimestamp()
        });
      });

      return true;
    } catch (error) {
      console.error('Error adding points:', error);
      return false;
    }
  }
};