// src/components/auth/LoginForm.jsx
import React, { useState, useContext } from 'react';
import { authService } from '../../services/authService';
import { AuthContext } from '../../context/AuthContext';
import Modal from '../common/Modal';
import InputField from '../common/InputField';
import Button from '../common/Button';
import Notification from '../common/Notification';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { setCurrentUser } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await authService.login(email, password);
      if (user) {
        if (!user.emailVerified) {
          setError('Please verify your email before logging in.');
          return;
        }
        // If phone number exists, send OTP
        if (user.phoneNumber) {
          await authService.sendOTP(user.phoneNumber);
          setShowOtp(true);
        } else {
          setCurrentUser(user);
          // Redirect to dashboard
          window.location.href = '/dashboard';
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOtpVerify = async () => {
    setError('');
    try {
      const user = await authService.verifyOTP(otp);
      if (user) {
        setCurrentUser(user);
        // Redirect to dashboard
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Login</h2>
        <InputField
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <InputField
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit">Login</Button>
        {error && <Notification message={error} type="error" />}
        {success && <Notification message={success} type="success" />}
      </form>

      {showOtp && (
        <Modal title="OTP Verification">
          <InputField
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <Button onClick={handleOtpVerify}>Verify OTP</Button>
          {error && <Notification message={error} type="error" />}
        </Modal>
      )}

      <div id="recaptcha-container"></div>
    </>
  );
};

export default LoginForm;
