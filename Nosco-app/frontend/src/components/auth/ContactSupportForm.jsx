import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendSupportInquiry } from '../../services/supportService';
import Button from '../common/Button';
import InputField from '../common/InputField';
import Notification from '../common/Notification';

const ContactSupportForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendSupportInquiry(formData);
      setNotification({ type: 'success', message: 'Your inquiry has been sent successfully.' });
      setTimeout(() => navigate('/'), 3000); // Redirect to home after 3 seconds
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to send inquiry. Please try again.' });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputField
        label="Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <InputField
        label="Email Address"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <InputField
        label="Phone Number (optional)"
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={handleChange}
      />
      <InputField
        label="Subject"
        name="subject"
        value={formData.subject}
        onChange={handleChange}
        required
      />
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
        <textarea
          id="message"
          name="message"
          rows="4"
          value={formData.message}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-nosco-red focus:ring-nosco-red sm:text-sm"
        ></textarea>
      </div>
      <div className="flex justify-between">
        <Button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Submit'}
        </Button>
        <Button type="button" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>
      {notification && (
        <Notification type={notification.type} message={notification.message} />
      )}
    </form>
  );
};

export default ContactSupportForm;