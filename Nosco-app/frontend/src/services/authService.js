// src/services/authService.js
import { auth, firestore } from '../firebase/firebase_config';
import firebase from 'firebase/app';

export const authService = {
  login: async (email, password) => {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  register: async (email, phoneNumber, password) => {
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      // Save additional user data to Firestore
      await firestore.collection('employees').doc(user.uid).set({
        email,
        phoneNumber,
        role: 'Employee', // Default role
        // Add other fields as necessary
      });
      // Send email verification
      await user.sendEmailVerification();
      return user;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  sendOTP: async (phoneNumber) => {
    try {
      const recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
      });
      const confirmationResult = await auth.signInWithPhoneNumber(phoneNumber, recaptchaVerifier);
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
      await auth.sendPasswordResetEmail(email);
      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  logout: async () => {
    try {
      await auth.signOut();
      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  },
};
