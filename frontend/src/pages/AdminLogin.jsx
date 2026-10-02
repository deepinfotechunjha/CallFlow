import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState('secret'); // secret, email, otp, update
  const [secret, setSecret] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryType, setRecoveryType] = useState(''); // 'username' or 'password'
  const [timer, setTimer] = useState(120); // 2 minutes
  const [timerActive, setTimerActive] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    let interval;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setTimerActive(false);
      toast.error('OTP expired. Please request a new one.');
      setForgotStep('secret');
      resetForgotForm();
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  const resetForgotForm = () => {
    setSecret('');
    setEmail('');
    setOtp('');
    setOtpToken('');
    setNewUsername('');
    setNewPassword('');
    setRecoveryType('');
    setTimer(120);
    setTimerActive(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await apiClient.post('/auth/special-admin-login', {
        username,
        password
      });
      
      if (response.data.success) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.user));
        toast.success('Login successful!');
        navigate('/secreturl/manage');
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecretVerify = async () => {
    if (!secret.trim()) {
      toast.error('Please enter the secret');
      return;
    }
    
    try {
      const response = await apiClient.post('/auth/special-admin-verify-secret', { secret });
      if (response.data.success) {
        setForgotStep('email');
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Invalid secret');
    }
  };

  const handleRequestOTP = async () => {
    if (!email.trim()) {
      toast.error('Please enter email');
      return;
    }
    
    setIsSendingOTP(true);
    try {
      const response = await apiClient.post('/auth/special-admin-request-otp', {
        email,
        secret
      });
      
      if (response.data.success) {
        setOtpToken(response.data.token);
        setForgotStep('otp');
        setTimer(120);
        setTimerActive(true);
        toast.success('OTP sent to your email');
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to send OTP');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      toast.error('Please enter OTP');
      return;
    }
    
    try {
      const response = await apiClient.post('/auth/special-admin-verify-otp', {
        email,
        otp,
        token: otpToken
      });
      
      if (response.data.success) {
        setTimerActive(false);
        setForgotStep('update');
        toast.success('OTP verified successfully');
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Invalid OTP');
    }
  };

  const handleUpdateCredentials = async () => {
    if (recoveryType === 'username' && !newUsername.trim()) {
      toast.error('Please enter new username');
      return;
    }
    
    if (recoveryType === 'password' && !newPassword.trim()) {
      toast.error('Please enter new password');
      return;
    }
    
    try {
      const response = await apiClient.post('/auth/special-admin-update-credentials', {
        email,
        otp,
        token: otpToken,
        newUsername: recoveryType === 'username' ? newUsername : undefined,
        newPassword: recoveryType === 'password' ? newPassword : undefined
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        setShowForgotModal(false);
        resetForgotForm();
        setForgotStep('secret');
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to update credentials');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8F9FA] p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-xs border border-[#E0E2E5]">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#2C2C2C] text-white rounded-lg flex items-center justify-center text-xl font-extrabold mx-auto mb-3 shadow-xs">
            DI
          </div>
          <span className="inline-block text-[#FF2E46] text-xs font-bold uppercase tracking-widest bg-[#FFE8EB] px-2.5 py-0.5 rounded-md mb-2 border border-[#FF2E46]/20">
            RESTRICTED ACCESS
          </span>
          <h1 className="text-2xl font-extrabold text-[#2C2C2C] tracking-tight">Admin Portal</h1>
          <p className="mt-1 text-xs text-[#666666]">Special System Administrator Authentication</p>
        </div>
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">Admin Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
              required
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-white bg-[#2C2C2C] hover:bg-[#1A1A1A] rounded-lg shadow-xs disabled:opacity-50 transition-colors mt-2"
          >
            {isLoading ? 'Authorizing...' : 'Sign in to Console'}
          </button>
        </form>
        
        <div className="text-center mt-6 pt-4 border-t border-[#E0E2E5]">
          <button
            onClick={() => setShowForgotModal(true)}
            className="text-xs text-[#666666] hover:text-[#FF2E46] font-semibold transition-colors"
          >
            Forgot Username or Password?
          </button>
        </div>
      </div>

      {/* Forgot Password/Username Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl p-6 sm:p-7 w-full max-w-md shadow-xl border border-[#E0E2E5]">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-[#E0E2E5]">
              <h2 className="text-base font-bold text-[#2C2C2C]">Recover Admin Credentials</h2>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  resetForgotForm();
                  setForgotStep('secret');
                }}
                className="text-[#666666] hover:text-[#2C2C2C] p-1 rounded-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {forgotStep === 'secret' && (
              <div className="space-y-4">
                <p className="text-[#666666] text-xs">Enter your root administrative secret key to proceed:</p>
                <input
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  placeholder="Enter secret key"
                  onKeyPress={(e) => e.key === 'Enter' && handleSecretVerify()}
                  autoFocus
                />
                <button
                  onClick={handleSecretVerify}
                  className="w-full bg-[#FF2E46] hover:bg-[#E02038] text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-colors"
                >
                  Verify Secret
                </button>
              </div>
            )}

            {forgotStep === 'email' && (
              <div className="space-y-4">
                <p className="text-[#666666] text-xs">Enter your registered recovery email address:</p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  placeholder="Enter email address"
                  onKeyPress={(e) => e.key === 'Enter' && handleRequestOTP()}
                  autoFocus
                />
                <button
                  onClick={handleRequestOTP}
                  disabled={isSendingOTP}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-colors ${
                    isSendingOTP
                      ? 'bg-[#FF5A71] text-white cursor-not-allowed'
                      : 'bg-[#FF2E46] text-white hover:bg-[#E02038]'
                  }`}
                >
                  {isSendingOTP ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            )}

            {forgotStep === 'otp' && (
              <div className="space-y-4">
                <p className="text-[#666666] text-xs">
                  Enter the 6-digit OTP code sent to your email:
                </p>
                {timerActive && (
                  <div className="text-center">
                    <span className="text-base font-bold text-[#FF2E46]">{formatTime(timer)}</span>
                    <p className="text-[11px] text-[#666666]">Time remaining</p>
                  </div>
                )}
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-center text-xl font-bold tracking-widest text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  placeholder="000000"
                  maxLength={6}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerifyOTP()}
                  autoFocus
                />
                <button
                  onClick={handleVerifyOTP}
                  className="w-full bg-[#FF2E46] hover:bg-[#E02038] text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-colors"
                >
                  Verify OTP
                </button>
              </div>
            )}

            {forgotStep === 'update' && (
              <div className="space-y-4">
                <p className="text-[#666666] text-xs">Select which credential to update:</p>
                
                {!recoveryType && (
                  <div className="space-y-3">
                    <button
                      onClick={() => setRecoveryType('username')}
                      className="w-full bg-[#2C2C2C] hover:bg-[#1A1A1A] text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      Update Username
                    </button>
                    <button
                      onClick={() => setRecoveryType('password')}
                      className="w-full bg-[#FF2E46] hover:bg-[#E02038] text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-colors"
                    >
                      Update Password
                    </button>
                  </div>
                )}

                {recoveryType === 'username' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                      placeholder="Enter new username"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateCredentials}
                      className="w-full bg-[#FF2E46] hover:bg-[#E02038] text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-colors"
                    >
                      Save Username
                    </button>
                  </div>
                )}

                {recoveryType === 'password' && (
                  <div className="space-y-3">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                      placeholder="Enter new password"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateCredentials}
                      className="w-full bg-[#FF2E46] hover:bg-[#E02038] text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-colors"
                    >
                      Save Password
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;
