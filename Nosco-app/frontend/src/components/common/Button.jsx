import React from 'react';

const Button = ({ children, onClick, type = 'button', disabled = false, className = '' }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 bg-nosco-red text-white rounded hover:bg-nosco-red-dark focus:outline-none focus:ring-2 focus:ring-nosco-red focus:ring-opacity-50 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;