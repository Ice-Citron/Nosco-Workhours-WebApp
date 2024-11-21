import { firestore as db } from '../firebase/firebase_config';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';

export const submitFeedback = async (userId, feedback) => {
  try {
    const feedbackRef = collection(db, 'feedback');
    const newFeedback = {
      userId,
      subject: feedback.subject,
      message: feedback.message,
      status: 'New',
      createdAt: new Date().toISOString(),
      adminResponse: null,
    };
    
    const docRef = await addDoc(feedbackRef, newFeedback);
    return { id: docRef.id, ...newFeedback };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};

export const getFeedbackHistory = async (userId) => {
  try {
    const feedbackRef = collection(db, 'feedback');
    const q = query(
      feedbackRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting feedback history:', error);
    throw error;
  }
};