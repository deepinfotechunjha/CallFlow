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
      toast.error('Invalid secret');
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Admin Portal
          </h1>
          <p className="mt-2 text-sm text-gray-600">Special Administrator Access</p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-bold text-gray-700 tracking-wide">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full text-base py-2 px-3 border-b-2 border-gray-300 focus:outline-none focus:border-blue-600 transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="text-sm font-bold text-gray-700 tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-base py-2 px-3 border-b-2 border-gray-300 focus:outline-none focus:border-blue-600 transition-colors"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all shadow-lg"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        
        <div className="text-center">
          <button
            onClick={() => setShowForgotModal(true)}
            className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Forgot Username or Password?
          </button>
        </div>
      </div>

      {/* Forgot Password/Username Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Recover Credentials</h2>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  resetForgotForm();
                  setForgotStep('secret');
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {forgotStep === 'secret' && (
              <div className="space-y-4">
                <p className="text-gray-600 text-sm">Enter your secret key to proceed:</p>
                <input
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter secret key"
                  onKeyPress={(e) => e.key === 'Enter' && handleSecretVerify()}
                />
                <button
                  onClick={handleSecretVerify}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Verify Secret
                </button>
              </div>
            )}

            {forgotStep === 'email' && (
              <div className="space-y-4">
                <p className="text-gray-600 text-sm">Enter your registered email address:</p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                  onKeyPress={(e) => e.key === 'Enter' && handleRequestOTP()}
                />
                <button
                  onClick={handleRequestOTP}
                  disabled={isSendingOTP}
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    isSendingOTP
                      ? 'bg-blue-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSendingOTP ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            )}

            {forgotStep === 'otp' && (
              <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                  Enter the OTP sent to your email:
                </p>
                {timerActive && (
                  <div className="text-center">
                    <span className="text-lg font-bold text-red-600">{formatTime(timer)}</span>
                    <p className="text-xs text-gray-500">Time remaining</p>
                  </div>
                )}
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerifyOTP()}
                />
                <button
                  onClick={handleVerifyOTP}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Verify OTP
                </button>
              </div>
            )}

            {forgotStep === 'update' && (
              <div className="space-y-4">
                <p className="text-gray-600 text-sm">What would you like to recover?</p>
                
                {!recoveryType && (
                  <div className="space-y-3">
                    <button
                      onClick={() => setRecoveryType('username')}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      Recover Username
                    </button>
                    <button
                      onClick={() => setRecoveryType('password')}
                      className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                    >
                      Recover Password
                    </button>
                  </div>
                )}

                {recoveryType === 'username' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter new username"
                    />
                    <button
                      onClick={handleUpdateCredentials}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      Update Username
                    </button>
                  </div>
                )}

                {recoveryType === 'password' && (
                  <div className="space-y-3">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter new password"
                    />
                    <button
                      onClick={handleUpdateCredentials}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      Update Password
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
