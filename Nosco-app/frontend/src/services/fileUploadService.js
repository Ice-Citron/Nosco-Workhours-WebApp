import { storage } from '../firebase/firebase_config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const fileUploadService = {
  uploadPaymentProof: async (file, paymentId) => {
    try {
      // Create a reference to the payment proof
      const fileRef = ref(storage, `payment-proofs/${paymentId}/${file.name}`);
      
      // Upload file
      await uploadBytes(fileRef, file);
      
      // Get download URL
      const downloadUrl = await getDownloadURL(fileRef);
      
      return {
        name: file.name,
        url: downloadUrl,
        uploadedAt: new Date()
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Upload multiple files
  uploadPaymentProofs: async (files, paymentId) => {
    try {
      const uploads = files.map(file => 
        fileUploadService.uploadPaymentProof(file, paymentId)
      );
      
      return await Promise.all(uploads);
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  }
};