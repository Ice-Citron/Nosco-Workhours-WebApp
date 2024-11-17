// src/components/common/DatePicker.jsx
import React from 'react';

const DatePicker = ({ label, selected, onChange, error, ...rest }) => {
  const handleChange = (e) => {
    // Pass the event value directly to the parent component
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="datePicker">
        {label}
      </label>
      <input
        type="date"
        id="datePicker"
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        value={selected || ''}
        onChange={handleChange}
        {...rest}
      />
      {error && <p className="text-red-500 text-xs italic">{error.message}</p>}
    </div>
  );
};

export default DatePicker;