import React from 'react';

const Notification = ({ type, message }) => {
  const bgColor = type === 'success' ? 'bg-green-100' : 'bg-red-100';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';

  return (
    <div className={`${bgColor} ${textColor} px-4 py-3 rounded relative`} role="alert">
      <span className="block sm:inline">{message}</span>
    </div>
  );
};

export default Notification;