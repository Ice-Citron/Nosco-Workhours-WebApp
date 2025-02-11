// src/pages/admin/AdminProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfilePicUpload from '../../components/profile/ProfilePicUpload';
import { useAuth } from '../../context/AuthContext';
import { firestore } from '../../firebase/firebase_config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';

const AdminProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    docId: '',         // Firestore doc ID
    createdAt: null,   // Firestore Timestamp -> JS date
    profilePic: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      fetchAdminData(user.uid);
    }
  }, [user, loading, navigate]);

  const fetchAdminData = async (uid) => {
    try {
      const ref = doc(firestore, 'users', uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setError('User doc not found.');
        return;
      }
      const data = snap.data();
      // Parse name
      const [first = '', second = ''] = (data.name || '').split(' ');
      setProfileData({
        firstName: first,
        lastName: second,
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        docId: snap.id,
        createdAt: data.createdAt?.toDate() || null,
        profilePic: data.profilePic || ''
      });
    } catch (err) {
      console.error('Error fetching admin doc:', err);
      setError('Failed to load admin data.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
  };

  const handleSave = async () => {
    try {
      // Reconstruct name
      const newName = `${profileData.firstName} ${profileData.lastName}`.trim();

      await updateDoc(doc(firestore, 'users', user.uid), {
        name: newName,
        phoneNumber: profileData.phoneNumber
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating admin doc:', err);
      setError('Failed to update profile info.');
    }
  };

  const handleProfilePicUpdate = async (newUrl) => {
    setProfileData((prev) => ({ ...prev, profilePic: newUrl }));
    // Persist to Firestore:
    if (user?.uid) {
      try {
        await updateDoc(doc(firestore, 'users', user.uid), {
          profilePic: newUrl
        });
      } catch (err) {
        console.error('Error updating profile pic:', err);
      }
    }
  };

  if (loading) {
    return <div className="p-4 text-nosco-red">Loading admin profile...</div>;
  }
  if (!user) {
    return <div className="p-4">Please log in to view your profile.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {error && <div className="text-red-600 mb-4">{error}</div>}

      <h1 className="text-3xl font-bold text-nosco-red mb-6">Admin Profile</h1>

      {/* Personal Info */}
      <section className="bg-white shadow-md rounded p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Personal Information</h2>
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-1/3 flex flex-col items-center">
            <img
              src={profileData.profilePic || 'https://via.placeholder.com/150'}
              alt="Profile"
              className="w-48 h-48 rounded-full object-cover border-4 border-nosco-red mb-3"
            />
            <ProfilePicUpload onUploadSuccess={handleProfilePicUpdate} />
          </div>
          <div className="lg:w-2/3 lg:pl-6 mt-6 lg:mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full p-2 border rounded focus:ring-nosco-red focus:border-nosco-red"
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
                  className="w-full p-2 border rounded focus:ring-nosco-red focus:border-nosco-red"
                />
              </div>
              {/* Email (read only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Read-Only)
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full p-2 border rounded bg-gray-100"
                />
              </div>
              {/* Phone */}
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
                  className="w-full p-2 border rounded focus:ring-nosco-red focus:border-nosco-red"
                />
              </div>
            </div>

            <div className="mt-6">
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="bg-nosco-red text-white py-2 px-4 rounded hover:bg-nosco-red-dark transition"
                >
                  Save Changes
                </button>
              ) : (
                <button
                  onClick={handleEdit}
                  className="bg-nosco-red text-white py-2 px-4 rounded hover:bg-nosco-red-dark transition"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Account Information (docId + createdAt) */}
      <section className="bg-white shadow-md rounded p-6">
        <h2 className="text-2xl font-semibold mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Firestore doc ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account ID
            </label>
            <input
              type="text"
              value={profileData.docId}
              disabled
              className="w-full p-2 border rounded bg-gray-100"
            />
          </div>
          {/* Created Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Created
            </label>
            <input
              type="text"
              value={
                profileData.createdAt
                  ? format(profileData.createdAt, 'PPpp')
                  : 'N/A'
              }
              disabled
              className="w-full p-2 border rounded bg-gray-100"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminProfilePage;
