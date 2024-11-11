import React, { useState, useEffect } from 'react';
import { storage, firestore } from '../../firebase/firebase_config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

const ProfilePicUpload = ({ onUploadSuccess }) => {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const { user, loading, updateUserProfilePic } = useAuth();

  useEffect(() => {
    console.log("AuthContext user:", user);
    console.log("AuthContext loading:", loading);
  }, [user, loading]);

  const handleChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!image) return;
    if (!user) {
      setError('Please log in to upload a profile picture.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      // Delete old profile picture if it exists
      if (user.profilePic && user.profilePic.startsWith('https://firebasestorage.googleapis.com')) {
        const oldImageRef = ref(storage, user.profilePic);
        try {
          await deleteObject(oldImageRef);
          console.log('Old profile picture deleted');
        } catch (deleteError) {
          console.error('Error deleting old profile picture:', deleteError);
          // Continue with upload even if delete fails
        }
      }
  
      // Upload new image
      const storageRef = ref(storage, `profilePics/${user.uid}/${image.name}`);
      const uploadResult = await uploadBytes(storageRef, image);
      const downloadURL = await getDownloadURL(uploadResult.ref);
  
      // Update user document in Firestore
      await updateUserProfilePic(downloadURL);
  
      onUploadSuccess(downloadURL);
      alert('Profile picture uploaded successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setError(`Failed to upload profile picture: ${error.message}`);
    }
    setUploading(false);
    setImage(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="text-center w-full">
      <label className="block mb-1">
        <span className="sr-only">Choose profile photo</span>
        <div className="flex justify-center items-center">
          <div className="overflow-hidden relative w-36">
            <button className="bg-nosco-red text-white py-1 px-3 w-full rounded-full text-sm font-semibold hover:bg-nosco-red-dark transition duration-300">
              Choose file
            </button>
            <input 
              type="file" 
              className="absolute left-0 top-0 opacity-0 w-full h-full cursor-pointer"
              onChange={handleChange}
              accept="image/*"
            />
          </div>
        </div>
      </label>
      <p className="text-sm text-gray-500 mt-0">
        {image ? image.name : "No file chosen"}
      </p>
      <button
        onClick={handleUpload}
        disabled={!image || uploading}
        className="mt-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md text-sm hover:bg-gray-300 transition duration-300 disabled:bg-gray-100 disabled:text-gray-400"
      >
        {uploading ? 'Uploading...' : 'Upload New Profile Picture'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default ProfilePicUpload;