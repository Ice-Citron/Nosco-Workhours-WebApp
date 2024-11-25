import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { uploadProfilePicture, validateProfileImage } from '../../services/profileService';

const ProfilePicUpload = ({ onUploadSuccess }) => {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validation = validateProfileImage(file);
      if (!validation.isValid) {
        setError(validation.errors[0]);
        return;
      }
      setImage(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!image || !user?.uid) {
      setError('Please select an image and ensure you are logged in');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const downloadURL = await uploadProfilePicture(image, user.uid, user.profilePic);
      
      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(downloadURL);
      }

      // Reset state
      setImage(null);
      setError(null);
      
      // Clear the file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setError(error.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="text-center w-full">
      <label className="block mb-1">
        <span className="sr-only">Choose profile photo</span>
        <div className="flex justify-center items-center">
          <div className="overflow-hidden relative w-36">
            <button 
              className="bg-nosco-red text-white py-1 px-3 w-full rounded-full text-sm font-semibold hover:bg-nosco-red-dark transition duration-300 disabled:opacity-50"
              disabled={uploading}
            >
              Choose file
            </button>
            <input 
              type="file"
              className="absolute left-0 top-0 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
              onChange={handleChange}
              accept="image/*"
              disabled={uploading}
            />
          </div>
        </div>
      </label>
      
      <p className="text-sm text-gray-500 mt-1">
        {image ? image.name : "No file chosen"}
      </p>

      <button
        onClick={handleUpload}
        disabled={!image || uploading}
        className={`mt-2 py-2 px-4 rounded-md text-sm transition duration-300 ${
          !image || uploading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-nosco-red text-white hover:bg-nosco-red-dark'
        }`}
      >
        {uploading ? 'Uploading...' : 'Upload New Profile Picture'}
      </button>

      {error && (
        <p className="text-red-500 text-sm mt-2">
          {error}
        </p>
      )}
    </div>
  );
};

export default ProfilePicUpload;