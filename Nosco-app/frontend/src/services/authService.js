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

  register: async (email, phoneNumber, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Save additional user data to Firestore
      await setDoc(doc(firestore, 'employees', user.uid), {
        email,
        phoneNumber,
        role: 'Employee', // Default role
        // Add other fields as necessary
      });
      // Send email verification
      await sendEmailVerification(user);
      return user;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  sendOTP: async (phoneNumber) => {
    try {
      const recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
      }, auth);
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      window.confirmationResult = confirmationResult; // Store globally for verification
    } catch (error) {
      throw new Error(error.message);
    }
  },

  verifyOTP: async (otp) => {
    try {
      const confirmationResult = window.confirmationResult;
      const result = await confirmationResult.confirm(otp);
      return result.user;
    } catch (error) {
      throw new Error('Invalid OTP');
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
    // Implement your password reset request logic here
    // For now, we'll just simulate a successful request
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating API call
    return true;
  } catch (error) {
    console.error('Error requesting password reset:', error);
    throw error;
  }
};