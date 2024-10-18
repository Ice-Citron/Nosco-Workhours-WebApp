import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import DatePicker from '../common/DatePicker';
import SelectDropdown from '../common/SelectDropdown';
import InputField from '../common/InputField';
import Button from '../common/Button';

const LogHoursForm = ({ projects, onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProject, setSelectedProject] = useState('');

  const getDayOfWeek = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const validateTotalHours = (regularHours, overtime15x, overtime20x) => {
    const total = parseFloat(regularHours || 0) + parseFloat(overtime15x || 0) + parseFloat(overtime20x || 0);
    return total <= 24 || 'Total hours cannot exceed 24';
  };

  const onFormSubmit = (data) => {
    const formData = {
      ...data,
      date: selectedDate,
      project: selectedProject,
      dayOfWeek: getDayOfWeek(selectedDate)
    };
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <SelectDropdown
        label="Project"
        options={projects}
        value={selectedProject}
        onChange={(e) => setSelectedProject(e.target.value)}
        error={errors.project}
      />
      <DatePicker
        label="Date"
        selected={selectedDate.toISOString().split('T')[0]}
        onChange={setSelectedDate}
      />
      <div className="text-sm text-gray-600">
        Day of Week: {getDayOfWeek(selectedDate)}
      </div>
      <InputField
        label="Regular Hours (t1.0)"
        type="number"
        step="0.5"
        {...register('regularHours', {
          required: 'Regular hours are required',
          min: { value: 0, message: 'Hours cannot be negative' },
          validate: (value) => validateTotalHours(value, 0, 0)
        })}
        error={errors.regularHours}
      />
      <InputField
        label="Overtime 1.5x Hours (t1.5)"
        type="number"
        step="0.5"
        {...register('overtime15x', {
          min: { value: 0, message: 'Hours cannot be negative' },
          validate: (value) => validateTotalHours(0, value, 0)
        })}
        error={errors.overtime15x}
      />
      <InputField
        label="Overtime 2.0x Hours (t2.0)"
        type="number"
        step="0.5"
        {...register('overtime20x', {
          min: { value: 0, message: 'Hours cannot be negative' },
          validate: (value) => validateTotalHours(0, 0, value)
        })}
        error={errors.overtime20x}
      />
      <InputField
        label="Remarks"
        as="textarea"
        {...register('remarks')}
      />
      <Button type="submit">Submit Work Hours</Button>
    </form>
  );
};

export default LogHoursForm;