import React from 'react';

const InputField = ({ label, name, type = 'text', value, onChange, required = false, className = '' }) => {
  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-nosco-red focus:border-nosco-red"
      />
    </div>
  );
};

export default InputField;