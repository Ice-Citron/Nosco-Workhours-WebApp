import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticatedHeader from '../components/common/AuthenticatedHeader';
import AuthenticatedFooter from '../components/common/AuthenticatedFooter';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showArchivedAccounts, setShowArchivedAccounts] = useState(false);

  // Placeholder data - replace with actual data fetching logic
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '123-456-7890',
    address: '123 Main St, Anytown, USA',
    basePay: 50000,
    dailyPerDiem: 50,
    hourlyWage: 25,
    overtimeWage: 37.5,
    activeBankAccounts: [
      { id: 1, bankName: 'Bank A', accountNumber: '**** 1234' },
      { id: 2, bankName: 'Bank B', accountNumber: '**** 5678' },
    ],
    archivedBankAccounts: [
      { id: 3, bankName: 'Bank C', accountNumber: '**** 9012' },
    ],
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveChanges = () => {
    // Implement save changes logic here
    setIsEditing(false);
  };

  const handleAddBankAccount = () => {
    // Implement add bank account logic here
  };

  const handleArchiveBankAccount = (accountId) => {
    // Implement archive bank account logic here
  };

  const handleUnarchiveBankAccount = (accountId) => {
    // Implement unarchive bank account logic here
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    // Implement change password logic here
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AuthenticatedHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-nosco-red mb-8">Profile</h1>

        {/* Profile Picture */}
        <div className="mb-8">
          <img
            src="https://via.placeholder.com/150"
            alt="Profile"
            className="w-32 h-32 rounded-full mx-auto mb-4"
          />
          <button className="bg-nosco-red text-white py-2 px-4 rounded hover:bg-nosco-red-dark transition duration-300">
            Change Profile Picture
          </button>
        </div>

        {/* Personal Information Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={profileData.firstName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={profileData.lastName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-2">Email (Read-only)</label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                disabled
                className="w-full p-2 border rounded bg-gray-100"
              />
            </div>
            <div>
              <label className="block mb-2">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={profileData.phoneNumber}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={profileData.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          {isEditing ? (
            <button
              onClick={handleSaveChanges}
              className="mt-4 bg-nosco-red text-white py-2 px-4 rounded hover:bg-nosco-red-dark transition duration-300"
            >
              Save Changes
            </button>
          ) : (
            <button
              onClick={handleEditProfile}
              className="mt-4 bg-nosco-red text-white py-2 px-4 rounded hover:bg-nosco-red-dark transition duration-300"
            >
              Edit Profile
            </button>
          )}
        </section>

        {/* Pay Rates Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Pay Rates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Base Pay</label>
              <input
                type="number"
                name="basePay"
                value={profileData.basePay}
                disabled
                className="w-full p-2 border rounded bg-gray-100"
              />
            </div>
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
            <div>
              <label className="block mb-2">Hourly Wage</label>
              <input
                type="number"
                name="hourlyWage"
                value={profileData.hourlyWage}
                disabled
                className="w-full p-2 border rounded bg-gray-100"
              />
            </div>
            <div>
              <label className="block mb-2">Overtime Wage</label>
              <input
                type="number"
                name="overtimeWage"
                value={profileData.overtimeWage}
                disabled
                className="w-full p-2 border rounded bg-gray-100"
              />
            </div>
          </div>
        </section>

        {/* Bank Accounts Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Bank Accounts</h2>
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Active Accounts</h3>
            {profileData.activeBankAccounts.map((account) => (
              <div key={account.id} className="flex justify-between items-center mb-2">
                <span>{account.bankName} - {account.accountNumber}</span>
                <button
                  onClick={() => handleArchiveBankAccount(account.id)}
                  className="bg-yellow-500 text-white py-1 px-2 rounded hover:bg-yellow-600 transition duration-300"
                >
                  Archive
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleAddBankAccount}
            className="bg-nosco-red text-white py-2 px-4 rounded hover:bg-nosco-red-dark transition duration-300"
          >
            Add New Bank Account
          </button>
          <div className="mt-4">
            <button
              onClick={() => setShowArchivedAccounts(!showArchivedAccounts)}
              className="text-nosco-red hover:underline"
            >
              {showArchivedAccounts ? 'Hide' : 'Show'} Archived Accounts
            </button>
            {showArchivedAccounts && (
              <div className="mt-2">
                <h3 className="text-xl font-semibold mb-2">Archived Accounts</h3>
                {profileData.archivedBankAccounts.map((account) => (
                  <div key={account.id} className="flex justify-between items-center mb-2">
                    <span>{account.bankName} - {account.accountNumber}</span>
                    <button
                      onClick={() => handleUnarchiveBankAccount(account.id)}
                      className="bg-green-500 text-white py-1 px-2 rounded hover:bg-green-600 transition duration-300"
                    >
                      Unarchive
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Password Change Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword}>
            <div className="mb-4">
              <label className="block mb-2">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Confirm New Password</label>
              <input
                type="password"
                name="confirmNewPassword"
                value={passwordData.confirmNewPassword}
                onChange={handlePasswordChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-nosco-red text-white py-2 px-4 rounded hover:bg-nosco-red-dark transition duration-300"
            >
              Change Password
            </button>
          </form>
        </section>
      </main>
      <AuthenticatedFooter />
    </div>
  );
};

export default ProfilePage;