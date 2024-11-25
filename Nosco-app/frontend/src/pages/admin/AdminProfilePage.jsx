import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfilePicUpload from '../../components/profile/ProfilePicUpload';
import { useAuth } from '../../context/AuthContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, firestore } from '../../firebase/firebase_config';
import { doc, getDoc, collection, query, orderBy, limit, getDocs, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';

const AdminProfilePage = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const { user, loading } = useAuth();
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showQRCode, setShowQRCode] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: '',
    permissions: [],
    lastLogin: null,
    createdAt: null,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (user) {
      fetchUserData();
      fetchRecentActivity();
    }
  }, [user, loading, navigate]);

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const nameParts = userData.name?.split(' ') || ['', ''];
        setProfileData({
          firstName: nameParts[0],
          lastName: nameParts[1] || '',
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
          role: userData.role || 'admin',
          permissions: userData.permissions || [],
          lastLogin: userData.lastLogin?.toDate() || null,
          createdAt: userData.createdAt?.toDate() || null,
        });
        setIs2FAEnabled(userData.is2FAEnabled || false);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load profile data');
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const activityRef = collection(firestore, 'users', user.uid, 'activity');
      const q = query(activityRef, orderBy('timestamp', 'desc'), limit(5));
      const querySnapshot = await getDocs(q);
      const activities = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      setRecentActivity(activities);
    } catch (err) {
      console.error('Error fetching activity:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveChanges = async () => {
    try {
      await updateDoc(doc(firestore, 'users', user.uid), {
        name: `${profileData.firstName} ${profileData.lastName}`,
        phoneNumber: profileData.phoneNumber,
        // Don't update sensitive fields like role and permissions here
      });
      setIsEditing(false);
      setError('');
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    }
  };

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetEmailSent(true);
      setError('');
    } catch (err) {
      setError('Failed to send password reset email');
      console.error('Password reset error:', err);
    }
  };

  const toggle2FA = async () => {
    try {
      if (!is2FAEnabled) {
        setShowQRCode(true);
        // Here you would typically generate and show a QR code for 2FA setup
      } else {
        // Disable 2FA logic
        await updateDoc(doc(firestore, 'users', user.uid), {
          is2FAEnabled: false
        });
        setIs2FAEnabled(false);
      }
    } catch (err) {
      setError('Failed to update 2FA settings');
      console.error('2FA toggle error:', err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to view your profile.</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto px-4 py-2">
        <h1 className="text-3xl font-bold text-nosco-red mb-8">Admin Profile</h1>

        {/* Profile Picture and Personal Information Section */}
        <section className="bg-white shadow-lg rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-semibold mb-6 text-nosco-red">Personal Information</h2>
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-1/3 mb-6 lg:mb-0 flex flex-col items-center">
              <img
                src={user?.profilePic || "https://via.placeholder.com/150"}
                alt="Profile"
                className="w-48 h-48 rounded-full object-cover border-4 border-nosco-red mb-3"
              />
              <ProfilePicUpload onUploadSuccess={(url) => console.log("New profile pic:", url)} />
            </div>
            <div className="lg:w-2/3 lg:pl-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Existing personal info fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-md focus:ring-nosco-red focus:border-nosco-red"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-md focus:ring-nosco-red focus:border-nosco-red"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (Read-only)</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    disabled
                    className="w-full p-3 border rounded-md bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
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

        {/* Role and Permissions Section */}
        <section className="bg-white shadow-lg rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Role & Permissions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input
                type="text"
                value={profileData.role}
                disabled
                className="w-full p-3 border rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
              <div className="p-3 border rounded-md bg-gray-100">
                {profileData.permissions.map((permission, index) => (
                  <span 
                    key={index}
                    className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Account Information Section */}
        <section className="bg-white shadow-lg rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
              <input
                type="text"
                value={profileData.lastLogin ? format(profileData.lastLogin, 'PPpp') : 'N/A'}
                disabled
                className="w-full p-3 border rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Created</label>
              <input
                type="text"
                value={profileData.createdAt ? format(profileData.createdAt, 'PPpp') : 'N/A'}
                disabled
                className="w-full p-3 border rounded-md bg-gray-100"
              />
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="bg-white shadow-lg rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Security</h2>
          
          {/* 2FA Toggle */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Two-Factor Authentication</h3>
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {is2FAEnabled ? 'Two-factor authentication is enabled' : 'Enable two-factor authentication for additional security'}
              </p>
              <button
                onClick={toggle2FA}
                className={`px-4 py-2 rounded-md ${
                  is2FAEnabled 
                    ? 'bg-gray-500 hover:bg-gray-600' 
                    : 'bg-green-500 hover:bg-green-600'
                } text-white transition duration-300`}
              >
                {is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </button>
            </div>
            {showQRCode && (
              <div className="mt-4 p-4 border rounded-md">
                {/* QR Code would be displayed here */}
                <p className="text-gray-600">Scan this QR code with your authenticator app</p>
              </div>
            )}
          </div>

          {/* Password Reset */}
          <div>
            <h3 className="text-lg font-medium mb-2">Password Reset</h3>
            {error && (
              <div className="mb-4 text-red-500">
                {error}
              </div>
            )}
            {resetEmailSent ? (
              <div className="mb-4 text-green-500">
                Password reset email has been sent to your email address.
              </div>
            ) : (
              <button
                onClick={handlePasswordReset}
                className="bg-nosco-red text-white py-2 px-4 rounded hover:bg-nosco-red-dark transition duration-300"
              >
                Send Password Reset Email
              </button>
            )}
          </div>
        </section>

        {/* Recent Activity Section (continued) */}
        <section className="bg-white shadow-lg rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500">
                            {activity.timestamp ? format(activity.timestamp, 'PPpp') : 'N/A'}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            activity.type === 'success' ? 'bg-green-100 text-green-800' :
                            activity.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            activity.type === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.type}
                          </span>
                        </div>
                        {activity.details && (
                          <p className="mt-1 text-sm text-gray-500">
                            {activity.details}
                          </p>
                        )}
                      </div>
                      {activity.metadata && (
                        <div className="ml-4">
                          <button
                            onClick={() => console.log('View details:', activity.metadata)}
                            className="text-sm text-nosco-red hover:text-nosco-red-dark"
                          >
                            View Details
                          </button>
                        </div>
                      )}
                    </div>
                    {activity.location && (
                      <div className="mt-1 text-sm text-gray-500">
                        Location: {activity.location}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent activity to display
              </div>
            )}
            {recentActivity.length > 0 && (
              <div className="mt-4 text-right">
                <button
                  onClick={() => navigate('/admin/activity-log')}
                  className="text-nosco-red hover:text-nosco-red-dark text-sm font-medium"
                >
                  View Full Activity Log →
                </button>
              </div>
            )}
          </section>

          {/* Error handling */}
          {error && (
            <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
              <strong className="font-bold">Error! </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
        </main>
      </div>
    );
};

export default AdminProfilePage;