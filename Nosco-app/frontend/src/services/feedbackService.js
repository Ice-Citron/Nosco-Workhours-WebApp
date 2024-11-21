import { firestore as db } from '../firebase/firebase_config';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  serverTimestamp,
  doc,
  updateDoc 
} from 'firebase/firestore';

// Field validation rules
const VALIDATION_RULES = {
  subject: {
    required: true,
    minLength: 3,
    maxLength: 100,
  },
  message: {
    required: true,
    minLength: 10,
    maxLength: 1000,
  }
};

// Validate feedback fields
const validateFeedback = (feedback) => {
  const errors = {};

  // Validate subject
  if (!feedback.subject) {
    errors.subject = 'Subject is required';
  } else if (feedback.subject.length < VALIDATION_RULES.subject.minLength) {
    errors.subject = `Subject must be at least ${VALIDATION_RULES.subject.minLength} characters`;
  } else if (feedback.subject.length > VALIDATION_RULES.subject.maxLength) {
    errors.subject = `Subject must be less than ${VALIDATION_RULES.subject.maxLength} characters`;
  }

  // Validate message
  if (!feedback.message) {
    errors.message = 'Message is required';
  } else if (feedback.message.length < VALIDATION_RULES.message.minLength) {
    errors.message = `Message must be at least ${VALIDATION_RULES.message.minLength} characters`;
  } else if (feedback.message.length > VALIDATION_RULES.message.maxLength) {
    errors.message = `Message must be less than ${VALIDATION_RULES.message.maxLength} characters`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const submitFeedback = async (userID, feedback) => {
  try {
    // Validate feedback
    const validation = validateFeedback(feedback);
    if (!validation.isValid) {
      throw new Error('Validation failed: ' + JSON.stringify(validation.errors));
    }

    const feedbackRef = collection(db, 'feedback');
    const newFeedback = {
      userID,
      subject: feedback.subject.trim(),
      message: feedback.message.trim(),
      status: 'New',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(feedbackRef, newFeedback);
    return { id: docRef.id, ...newFeedback };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw new Error(error.message || 'Failed to submit feedback');
  }
};

export const getFeedbackHistory = async (userID) => {
  try {
    const feedbackRef = collection(db, 'feedback');
    const q = query(
      feedbackRef,
      where('userID', '==', userID),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      responseAt: doc.data().responseAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting feedback history:', error);
    throw new Error('Failed to load feedback history');
  }
};

// Admin functions
export const updateFeedbackStatus = async (feedbackId, status, adminResponse) => {
  try {
    if (!['New', 'In Progress', 'Resolved'].includes(status)) {
      throw new Error('Invalid status');
    }

    const feedbackRef = doc(db, 'feedback', feedbackId);
    const updateData = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (adminResponse) {
      updateData.adminResponse = adminResponse.trim();
      updateData.responseAt = serverTimestamp();
    }

    await updateDoc(feedbackRef, updateData);
  } catch (error) {
    console.error('Error updating feedback:', error);
    throw new Error('Failed to update feedback');
  }
};