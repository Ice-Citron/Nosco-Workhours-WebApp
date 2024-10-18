import React from 'react';

const DatePicker = ({ label, selected, onChange }) => {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="datePicker">
        {label}
      </label>
      <input
        type="date"
        id="datePicker"
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        value={selected}
        onChange={(e) => onChange(new Date(e.target.value))}
      />
    </div>
  );
};

export default DatePicker;