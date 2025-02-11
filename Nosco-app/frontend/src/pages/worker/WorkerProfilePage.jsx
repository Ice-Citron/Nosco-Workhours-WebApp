// src/pages/worker/WorkerProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfilePicUpload from '../../components/profile/ProfilePicUpload';
import { getWorkerProfile, updateWorkerProfile } from '../../services/workerProfileService';

const WorkerProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Whether we're editing personal info fields
  const [isEditing, setIsEditing] = useState(false);

  // Local state for personal info & pay rates
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    position: '',
    department: '',
    // Pay rates
    baseRate: 0,
    dailyPerDiem: 0,
    currency: 'USD',
    profilePic: '',
  });

  // Track whether we’re still loading data from Firestore
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If not logged in, redirect
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    // If user object is loaded, fetch Firestore doc
    if (user) {
      loadUserData(user.uid);
    }
  }, [user, loading, navigate]);

  const loadUserData = async (uid) => {
    try {
      setFetching(true);
      setError('');
      const docData = await getWorkerProfile(uid);

      // Parse name into firstName/lastName
      const [first = '', second = ''] = (docData.name || '').split(' ');
      // Parse compensation
      const comp = docData.compensation || {};

      setProfileData({
        firstName: first,
        lastName: second,
        email: docData.email || '',
        phoneNumber: docData.phoneNumber || '',
        position: docData.position || '',
        department: docData.department || '',
        baseRate: comp.baseRate || 0,
        dailyPerDiem: comp.perDiem || 0,
        currency: comp.currency || 'USD',
        profilePic: docData.profilePic || '',
      });
    } catch (err) {
      console.error('Error loading worker profile:', err);
      setError('Failed to load profile data');
    } finally {
      setFetching(false);
    }
  };

  // Input change handler for text fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  // Toggle edit mode
  const handleEditProfile = () => {
    setIsEditing(true);
  };

  // Save changes to Firestore
  const handleSaveChanges = async () => {
    try {
      setFetching(true);
      setError('');

      // Reconstruct "name" from firstName + lastName
      const newName = `${profileData.firstName} ${profileData.lastName}`.trim();

      // Usually, we only let workers edit certain fields (like phoneNumber, maybe name).
      // We'll show an example that updates the "name" & "phoneNumber" in Firestore:
      await updateWorkerProfile(user.uid, {
        name: newName,
        phoneNumber: profileData.phoneNumber,
        // If you want them to be able to update the position/department,
        // you could add them here as well, but typically that's admin-only:
        // position: profileData.position
      });

      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile changes:', err);
      setError('Failed to save changes.');
    } finally {
      setFetching(false);
    }
  };

  // Fired after uploading a new pic
  const handleProfilePicUpdate = (newUrl) => {
    setProfileData((prev) => ({ ...prev, profilePic: newUrl }));
    // Then also update Firestore if you want that persisted:
    if (user?.uid) {
      updateWorkerProfile(user.uid, { profilePic: newUrl }).catch((err) => {
        console.error('Error updating profile pic in Firestore:', err);
      });
    }
  };

  if (loading || fetching) {
    return <div className="p-4 text-nosco-red">Loading profile...</div>;
  }

  if (!user) {
    return <div className="p-4">Please log in to view your profile.</div>;
  }

  // Now render the two main sections:
  return (
    <div className="container mx-auto px-4 py-4">
      {error && (
        <div className="mb-4 text-red-600">
          {error}
        </div>
      )}

      <h1 className="text-3xl font-bold text-nosco-red mb-8">My Profile</h1>

      {/* ---- Personal Info ---- */}
      <section className="bg-white shadow-lg rounded-lg p-8 mb-8">
        <h2 className="text-3xl font-semibold mb-6 text-nosco-red">
          Personal Information
        </h2>
        <div className="flex flex-col lg:flex-row">
          {/* Profile Pic */}
          <div className="lg:w-1/3 mb-6 lg:mb-0 flex flex-col items-center">
            <img
              src={profileData.profilePic || 'https://via.placeholder.com/150'}
              alt="Profile"
              className="w-48 h-48 rounded-full object-cover border-4 border-nosco-red mb-3"
            />
            <ProfilePicUpload onUploadSuccess={handleProfilePicUpdate} />
          </div>

          {/* Editable Fields */}
          <div className="lg:w-2/3 lg:pl-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full p-3 border rounded-md focus:ring-nosco-red focus:border-nosco-red"
                />
              </div>
              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full p-3 border rounded-md focus:ring-nosco-red focus:border-nosco-red"
                />
              </div>
              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Read-only)
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  disabled
                  className="w-full p-3 border rounded-md bg-gray-100"
                />
              </div>
              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={profileData.phoneNumber}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full p-3 border rounded-md focus:ring-nosco-red focus:border-nosco-red"
                />
              </div>
            </div>

            {/* Optionally show Position or Department if you like */}
            {/* position */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  name="position"
                  value={profileData.position}
                  onChange={handleInputChange}
                  disabled
                  className="w-full p-3 border rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={profileData.department}
                  disabled
                  className="w-full p-3 border rounded-md bg-gray-100"
                />
              </div>
            </div>

            {/* Save/Cancel Buttons */}
            <div className="mt-8">
              {isEditing ? (
                <button
                  onClick={handleSaveChanges}
                  className="bg-nosco-red text-white py-3 px-6 rounded-md hover:bg-nosco-red-dark transition duration-300"
                >
                  Save Changes
                </button>
              ) : (
                <button
                  onClick={handleEditProfile}
                  className="bg-nosco-red text-white py-3 px-6 rounded-md hover:bg-nosco-red-dark transition duration-300"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---- Pay Rates ---- */}
      <section className="bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-semibold mb-4">Pay Rates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Base Rate */}
          <div>
            <label className="block mb-2">Base Rate</label>
            <input
              type="number"
              name="baseRate"
              value={profileData.baseRate}
              disabled
              className="w-full p-2 border rounded bg-gray-100"
            />
          </div>
          {/* Daily Per Diem */}
          <div>
            <label className="block mb-2">Daily Per Diem</label>
            <input
              type="number"
              name="dailyPerDiem"
              value={profileData.dailyPerDiem}
              disabled
              className="w-full p-2 border rounded bg-gray-100"
            />
          </div>
          {/* Currency */}
          <div>
            <label className="block mb-2">Currency</label>
            <input
              type="text"
              name="currency"
              value={profileData.currency}
              disabled
              className="w-full p-2 border rounded bg-gray-100"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default WorkerProfilePage;
