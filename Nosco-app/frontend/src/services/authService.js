// src/services/authService.js
import { auth, firestore } from '../firebase/firebase_config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export const authService = {
  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  },
};

export const requestPasswordReset = async (emailOrUsername) => {
  try {
    // If you only accept emails:
    await sendPasswordResetEmail(auth, emailOrUsername);
    return true;
  } catch (error) {
    console.error('Error requesting password reset:', error);
    throw new Error(error.message || 'An error occurred. Please try again.');
  }
};