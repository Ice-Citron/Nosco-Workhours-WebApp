import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { submitFeedback } from '../../services/feedbackService';

const FeedbackForm = ({ onFeedbackSubmitted, isSubmitting: externalIsSubmitting }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null);

  const validateField = (name, value) => {
    if (name === 'subject') {
      if (!value) return 'Subject is required';
      if (value.length < 3) return 'Subject must be at least 3 characters';
      if (value.length > 100) return 'Subject must be less than 100 characters';
    }
    if (name === 'message') {
      if (!value) return 'Message is required';
      if (value.length < 10) return 'Message must be at least 10 characters';
      if (value.length > 1000) return 'Message must be less than 1000 characters';
    }
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {
      subject: validateField('subject', formData.subject),
      message: validateField('message', formData.message)
    };
    
    setErrors(newErrors);
    
    // Check if there are any errors
    if (Object.values(newErrors).some(error => error !== null)) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      await submitFeedback(user.uid, formData);
      setFormData({ subject: '', message: '' });
      setSubmitStatus('success');
      if (onFeedbackSubmitted) {
        await onFeedbackSubmitted();
      }
    } catch (error) {
      setSubmitStatus('error');
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus(null), 3000);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Submit Feedback</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-1">
            Subject
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            value={formData.subject}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.subject ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isSubmitting || externalIsSubmitting}
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-red-500">{errors.subject}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md h-32 ${
              errors.message ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isSubmitting || externalIsSubmitting}
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-500">{errors.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.message.length}/1000 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || externalIsSubmitting || Object.keys(errors).length > 0}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting || externalIsSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>

      {submitStatus === 'success' && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">Feedback submitted successfully!</p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">Failed to submit feedback. Please try again.</p>
        </div>
      )}
    </div>
  );
};

export default FeedbackForm;