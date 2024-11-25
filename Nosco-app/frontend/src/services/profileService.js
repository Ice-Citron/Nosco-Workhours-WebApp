// src/services/profileService.js

import { storage, firestore } from '../firebase/firebase_config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

/**
 * Updates a user's profile picture
 * @param {string} userId - The user's ID
 * @param {string} downloadURL - The URL of the uploaded image
 * @returns {Promise<boolean>} - Returns true if successful
 */
export const updateUserProfilePic = async (userId, downloadURL) => {
  try {
    if (!userId) throw new Error('No user ID provided');

    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      profilePic: downloadURL,
      updatedAt: new Date()
    });

    return true;
  } catch (error) {
    console.error('Error updating profile picture:', error);
    throw error;
  }
};

/**
 * Uploads a profile picture to Firebase Storage
 * @param {File} file - The image file to upload
 * @param {string} userId - The user's ID
 * @param {string} oldProfilePicUrl - The URL of the old profile picture (optional)
 * @returns {Promise<string>} - Returns the download URL of the uploaded image
 */
export const uploadProfilePicture = async (file, userId, oldProfilePicUrl = null) => {
  try {
    // Validate file
    if (!file) throw new Error('No file provided');
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size should be less than 5MB');
    }

    // Delete old profile picture if it exists
    if (oldProfilePicUrl && oldProfilePicUrl.includes('firebase')) {
      try {
        const oldImageRef = ref(storage, oldProfilePicUrl);
        await deleteObject(oldImageRef);
      } catch (deleteError) {
        console.warn('Error deleting old profile picture:', deleteError);
        // Continue with upload even if delete fails
      }
    }

    // Upload new image
    const storageRef = ref(storage, `profilePics/${userId}/${Date.now()}_${file.name}`);
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);

    // Update user profile with new URL
    await updateUserProfilePic(userId, downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('Error in uploadProfilePicture:', error);
    throw error;
  }
};

/**
 * Validates an image file
 * @param {File} file - The file to validate
 * @returns {Object} - Returns validation result
 */
export const validateProfileImage = (file) => {
  const errors = [];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!file) {
    errors.push('No file selected');
  } else {
    if (!file.type.startsWith('image/')) {
      errors.push('File must be an image');
    }
    if (file.size > maxSize) {
      errors.push('File size must be less than 5MB');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};