import React, { useState, useEffect } from 'react';
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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Timer countdown effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

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
        setTimeLeft(120);
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
        setTimeLeft(120);
        toast.success('New OTP sent to your email');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <span className="inline-block text-[#FF2E46] text-xs font-bold uppercase tracking-widest bg-[#FFE8EB] px-2.5 py-0.5 rounded-md mb-2 border border-[#FF2E46]/20">
            HOST SECURITY
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C2C2C] tracking-tight">Reset Secret Key</h1>
          <p className="text-[#666666] text-sm mt-1">
            {step === 1 && 'Verify your account email to initiate secret key recovery'}
            {step === 2 && 'Enter the 6-digit OTP code sent to your email'}
            {step === 3 && 'Define your new HOST administrative secret password'}
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 bg-white border border-[#E0E2E5] hover:bg-[#F0F2F5] text-[#2C2C2C] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">Dashboard</span>
        </button>
      </div>

      {/* Progress indicator */}
      <div className="mb-6 bg-white p-4 rounded-xl border border-[#E0E2E5] shadow-xs">
        <div className="flex items-center justify-center space-x-3 sm:space-x-6">
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold ${
              step >= 1 ? 'bg-[#FF2E46] text-white shadow-xs' : 'bg-[#F0F2F5] text-[#666666]'
            }`}>
              1
            </div>
            <span className="text-[11px] font-bold uppercase text-[#666666] mt-1">Email</span>
          </div>
          <div className={`h-0.5 w-12 sm:w-20 ${step >= 2 ? 'bg-[#FF2E46]' : 'bg-[#E0E2E5]'}`}></div>
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold ${
              step >= 2 ? 'bg-[#FF2E46] text-white shadow-xs' : 'bg-[#F0F2F5] text-[#666666]'
            }`}>
              2
            </div>
            <span className="text-[11px] font-bold uppercase text-[#666666] mt-1">Verify OTP</span>
          </div>
          <div className={`h-0.5 w-12 sm:w-20 ${step >= 3 ? 'bg-[#FF2E46]' : 'bg-[#E0E2E5]'}`}></div>
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold ${
              step >= 3 ? 'bg-[#FF2E46] text-white shadow-xs' : 'bg-[#F0F2F5] text-[#666666]'
            }`}>
              3
            </div>
            <span className="text-[11px] font-bold uppercase text-[#666666] mt-1">New Key</span>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl shadow-xs border border-[#E0E2E5] p-6 sm:p-7">
        {step === 1 && (
          <form className="space-y-4" onSubmit={handleSendOTP}>
            <div>
              <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">Registered Email <span className="text-[#FF2E46]">*</span></label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                placeholder="name@deep-infotech.com"
                required
                autoFocus
              />
              <p className="text-xs text-[#666666] mt-1">We will send a 6-digit verification code to this address</p>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#FF2E46] hover:bg-[#E02038] text-white font-semibold rounded-lg shadow-xs focus:outline-none disabled:opacity-50 transition-colors text-xs uppercase tracking-wider"
            >
              {isLoading ? 'Sending OTP Code...' : 'Send OTP Code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="space-y-4" onSubmit={handleVerifyOTP}>
            <div>
              <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">Enter 6-Digit OTP <span className="text-[#FF2E46]">*</span></label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-center text-xl font-bold tracking-widest text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
              />
              <p className="text-xs text-[#666666] mt-2 text-center">
                OTP sent to <span className="font-bold text-[#2C2C2C]">{email}</span>
              </p>
              {timeLeft > 0 && (
                <p className="text-xs text-[#FF2E46] mt-1 text-center font-semibold">
                  Expires in: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </p>
              )}
              {timeLeft === 0 && (
                <p className="text-xs text-[#FF2E46] mt-1 text-center font-semibold">
                  OTP expired. Please request a new code.
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || timeLeft === 0}
              className="w-full py-2.5 px-4 bg-[#FF2E46] hover:bg-[#E02038] text-white font-semibold rounded-lg shadow-xs disabled:opacity-50 transition-colors text-xs uppercase tracking-wider"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading}
                className="text-[#FF2E46] hover:underline font-semibold"
              >
                Resend OTP
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[#666666] hover:text-[#2C2C2C] underline"
              >
                Change Email
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form className="space-y-4" onSubmit={handleResetPassword}>
            <div>
              <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">New Secret Password <span className="text-[#FF2E46]">*</span></label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-12 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  placeholder="Minimum 6 characters"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-[#666666] hover:text-[#2C2C2C] font-semibold"
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">Confirm New Secret Password <span className="text-[#FF2E46]">*</span></label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-12 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  placeholder="Re-enter new secret password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-[#666666] hover:text-[#2C2C2C] font-semibold"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#FF2E46] hover:bg-[#E02038] text-white font-semibold rounded-lg shadow-xs disabled:opacity-50 transition-colors text-xs uppercase tracking-wider"
            >
              {isLoading ? 'Updating...' : 'Update Secret Key'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;