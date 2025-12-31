import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email input, 2: OTP verification, 3: New secret password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      if (response.data.success) {
        setOtpToken(response.data.token);
        setStep(2);
        toast.success('OTP sent to your email address');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error('Please enter the OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/verify-otp', {
        email,
        otp,
        token: otpToken
      });
      if (response.data.success) {
        setStep(3);
        toast.success('OTP verified successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      toast.error('Please enter a new secret password');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Secret password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/reset-password', {
        email,
        otp,
        token: otpToken,
        newPassword
      });
      if (response.data.success) {
        toast.success('Secret password reset successfully');
        navigate('/users');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset secret password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      if (response.data.success) {
        setOtpToken(response.data.token);
        toast.success('New OTP sent to your email');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header with back button */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">🔐 Reset Secret Password</h1>
          <p className="text-gray-600">
            {step === 1 && 'Verify your email to reset your secret password'}
            {step === 2 && 'Enter the OTP sent to your email'}
            {step === 3 && 'Set your new secret password'}
          </p>
          {user && (
            <p className="text-sm text-gray-500 mt-1">
              Logged in as: <span className="font-medium">{user.username}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
        >
          <span>←</span>
          <span className="hidden sm:inline">Back to Dashboard</span>
        </button>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <span className="text-xs text-gray-500 mt-2">Verify Email</span>
          </div>
          <div className={`h-1 w-16 ${
            step >= 2 ? 'bg-blue-600' : 'bg-gray-200'
          }`}></div>
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <span className="text-xs text-gray-500 mt-2">New Password</span>
          </div>
          <div className={`h-1 w-16 ${
            step >= 3 ? 'bg-blue-600' : 'bg-gray-200'
          }`}></div>
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
            <span className="text-xs text-gray-500 mt-2">Enter OTP</span>
          </div>
        </div>
      </div>

      {/* Main content card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-md mx-auto">
        {step === 1 && (
          <form className="space-y-6" onSubmit={handleSendOTP}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Registered Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your account email"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Enter the email associated with your account</p>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="space-y-6" onSubmit={handleVerifyOTP}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                placeholder="000000"
                maxLength="6"
                required
              />
              <p className="text-xs text-gray-500 mt-1 text-center">OTP sent to <span className="font-medium">{email}</span></p>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading}
                className="text-sm text-blue-600 hover:text-blue-800 underline disabled:text-blue-400"
              >
                Resend OTP
              </button>
              <br />
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Change Email
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form className="space-y-6" onSubmit={handleResetPassword}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Secret Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new secret password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Secret Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm new secret password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 transition-colors"
            >
              {isLoading ? 'Updating...' : '✓ Update Secret Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;