// src/components/common/InputField.jsx
import React, { forwardRef } from 'react';

const InputField = forwardRef(({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  required = false, 
  className = '',
  error,
  ...props 
}, ref) => {
  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        ref={ref}
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-nosco-red focus:border-nosco-red`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error.message}</p>
      )}
    </div>
  );
});

// Add a display name for better debugging
InputField.displayName = 'InputField';

export default InputField;