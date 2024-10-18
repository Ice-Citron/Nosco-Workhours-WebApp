import React from 'react';
import LogHoursForm from '../components/timesheets/LogHoursForm';

const LogHoursPage = () => {
  // This would typically come from an API call or context
  const mockProjects = [
    { value: 'project1', label: 'Project 1' },
    { value: 'project2', label: 'Project 2' },
    { value: 'project3', label: 'Project 3' },
  ];

  const handleSubmit = (formData) => {
    // Here you would typically send the data to your backend
    console.log('Submitted work hours:', formData);
    // TODO: Add API call to submit work hours
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Log Work Hours</h1>
      <LogHoursForm projects={mockProjects} onSubmit={handleSubmit} />
    </div>
  );
};

export default LogHoursPage;