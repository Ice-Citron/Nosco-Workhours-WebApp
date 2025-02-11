import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import InputField from '../common/InputField';
import Button from '../common/Button';

// Helper to produce "YYYY-MM-DD" from a Date object
function formatDateToYMD(dateObj) {
  if (!(dateObj instanceof Date)) return '';
  // e.g. "2025-02-05T00:00:00.000Z" => slice(0,10) => "2025-02-05"
  return dateObj.toISOString().slice(0, 10);
}

// Helper to get day of week
function getDayOfWeek(dateObj) {
  if (!(dateObj instanceof Date)) return '';
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return days[dateObj.getDay()];
}

// Validate total hours ≤ 24
function validateTotalHours(reg, ot15, ot20) {
  const total = parseFloat(reg || 0) + parseFloat(ot15 || 0) + parseFloat(ot20 || 0);
  return total <= 24 || 'Total hours cannot exceed 24';
}

const LogHoursForm = ({
  activeProjectName = '',
  activeProjectDesc = '',
  onSubmit // parent function that returns a Promise (so we can wait for completion)
}) => {
  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const [selectedDate, setSelectedDate] = useState(new Date());

  const onFormSubmit = async (formValues) => {
    // 1) Build final data
    const data = {
      ...formValues,
      date: selectedDate, // pass the real Date object
      dayOfWeek: getDayOfWeek(selectedDate),
    };

    // 2) Call parent's onSubmit. If it's async, await it
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting work hours:', error);
      return; // don't reload if error
    }

    // 3) Reload the page so fields are cleared
    window.location.reload();
  };

  // Convert our stored Date to "YYYY-MM-DD" for the <input type="date">
  const dateString = formatDateToYMD(selectedDate);

  // Parse user date input ("YYYY-MM-DD") back into a JS Date
  const handleDateChange = (e) => {
    const [yyyy, mm, dd] = e.target.value.split('-');
    const realDate = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    setSelectedDate(realDate);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Display project info (read-only) */}
      {activeProjectName && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{activeProjectName}</h2>
          {activeProjectDesc && (
            <p className="text-sm text-gray-600">{activeProjectDesc}</p>
          )}
        </div>
      )}

      {/* Native HTML date input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date
        </label>
        <input
          type="date"
          value={dateString}          // "2025-02-05"
          onChange={handleDateChange} // parse back into a Date
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
      </div>

      <div className="text-sm text-gray-600">
        Day of Week: {getDayOfWeek(selectedDate)}
      </div>

      {/* Regular Hours */}
      <InputField
        label="Regular Hours (t1.0)"
        type="number"
        step="0.5"
        {...register('regularHours', {
          required: 'Regular hours are required',
          min: { value: 0, message: 'Hours cannot be negative' },
          validate: (val) => validateTotalHours(val, 0, 0),
        })}
        error={errors.regularHours}
      />

      {/* Overtime 1.5x */}
      <InputField
        label="Overtime 1.5x Hours (t1.5)"
        type="number"
        step="0.5"
        {...register('overtime15x', {
          min: { value: 0, message: 'Hours cannot be negative' },
          validate: (val) => validateTotalHours(0, val, 0),
        })}
        error={errors.overtime15x}
      />

      {/* Overtime 2.0x */}
      <InputField
        label="Overtime 2.0x Hours (t2.0)"
        type="number"
        step="0.5"
        {...register('overtime20x', {
          min: { value: 0, message: 'Hours cannot be negative' },
          validate: (val) => validateTotalHours(0, 0, val),
        })}
        error={errors.overtime20x}
      />

      {/* Remarks */}
      <InputField
        label="Remarks"
        as="textarea"
        {...register('remarks')}
      />

      <Button type="submit">
        Submit Work Hours
      </Button>
    </form>
  );
};

export default LogHoursForm;
