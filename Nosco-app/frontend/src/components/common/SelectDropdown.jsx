// src/components/common/SelectDropdown.jsx

import React, { forwardRef } from 'react';

const SelectDropdown = forwardRef(({ label, options = [], error, ...rest }, ref) => {
  return (
    <div className="mb-4">
      {label && (
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="select"
        >
          {label}
        </label>
      )}

      <select
        id="select"
        ref={ref}  // attach forwardRef
        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        {...rest}  // spread any other props (e.g. name, onChange)
      >
        <option value="">Select an option</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && <p className="text-red-500 text-xs italic">{error.message}</p>}
    </div>
  );
});

export default SelectDropdown;
