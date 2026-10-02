import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import apiClient from '../api/apiClient';

const Login = () => {
  const [username, setUsername] = useState(() => localStorage.getItem('cf_login_username') || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [lockoutMessage, setLockoutMessage] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const debounceRef = useRef(null);

  // Restore active lockout or attempt state from localStorage and database on page load / refresh
  useEffect(() => {
    try {
      const savedLockedUntil = localStorage.getItem('cf_login_locked_until');
      const savedRemaining = localStorage.getItem('cf_login_remaining');

      if (savedLockedUntil) {
        const lockedUntilMs = Number(savedLockedUntil);
        const now = Date.now();
        if (lockedUntilMs > now) {
          const secs = Math.ceil((lockedUntilMs - now) / 1000);
          setLockoutSeconds(secs);
          setRemainingAttempts(0);
        } else {
          localStorage.removeItem('cf_login_locked_until');
        }
      }

      if (savedRemaining !== null && savedRemaining !== undefined) {
        setRemainingAttempts(Number(savedRemaining));
      }

      checkServerStatus();
    } catch (e) {}
  }, []);

  // Sync rate limit status with database for this device
  const checkServerStatus = async () => {
    try {
      const res = await apiClient.get('/auth/rate-limit-status?action=login');
      const data = res.data;
      if (data.isLocked && data.retryAfterSeconds) {
        setLockoutSeconds(data.retryAfterSeconds);
        setRemainingAttempts(0);
        if (data.lockedUntil) {
          localStorage.setItem('cf_login_locked_until', String(new Date(data.lockedUntil).getTime()));
        }
      } else {
        if (typeof data.remainingAttempts === 'number') {
          setRemainingAttempts(data.remainingAttempts);
          localStorage.setItem('cf_login_remaining', String(data.remainingAttempts));
        }
        if (!data.isLocked) {
          setLockoutSeconds(0);
          localStorage.removeItem('cf_login_locked_until');
        }
      }
    } catch (err) {}
  };

  const handleUsernameChange = (val) => {
    setUsername(val);
    localStorage.setItem('cf_login_username', val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      checkServerStatus(val);
    }, 400);
  };

  // Live timer countdown ticker
  useEffect(() => {
    if (lockoutSeconds <= 0) return;

    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setLockoutMessage('');
          localStorage.removeItem('cf_login_locked_until');
          // re-check server status to get fresh 5 chances
          checkServerStatus(username);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutSeconds, username]);

  const formatTimer = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    localStorage.setItem('cf_login_username', username);
    setIsLoading(true);
    const result = await login(username, password);
    setIsLoading(false);

    if (result.success) {
      setRemainingAttempts(null);
      setLockoutSeconds(0);
      localStorage.removeItem('cf_login_locked_until');
      localStorage.removeItem('cf_login_remaining');
      navigate('/');
    } else {
      if (result.isLocked && result.retryAfterSeconds) {
        setLockoutSeconds(result.retryAfterSeconds);
        setRemainingAttempts(0);
        setLockoutMessage(result.error);
        if (result.lockedUntil) {
          localStorage.setItem('cf_login_locked_until', String(new Date(result.lockedUntil).getTime()));
        } else {
          localStorage.setItem('cf_login_locked_until', String(Date.now() + result.retryAfterSeconds * 1000));
        }
        localStorage.setItem('cf_login_remaining', '0');
      } else if (typeof result.remainingAttempts === 'number') {
        setRemainingAttempts(result.remainingAttempts);
        localStorage.setItem('cf_login_remaining', String(result.remainingAttempts));
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8F9FA] px-4 py-12 relative">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xs border border-[#E0E2E5] p-8 sm:p-10 relative z-10">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img src="/deep.png" alt="Deep Infotech" className="h-10 w-auto object-contain" />
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#FF2E46] bg-[#FFE8EB] px-2.5 py-0.5 rounded-md mb-3 border border-[#FF2E46]/20">
            Enterprise Portal
          </div>
          <h1 className="text-2xl font-extrabold text-[#2C2C2C] tracking-tight">Welcome Back</h1>
          <p className="mt-1 text-xs text-[#666666]">Sign in to access your CallFlow account</p>
        </div>

        {/* Lockout Timer Active Banner */}
        {lockoutSeconds > 0 && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-center animate-pulse">
            <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
              ⚠️ Device Temporarily Locked
            </div>
            <div className="text-2xl font-mono font-extrabold text-red-700 my-1">
              {formatTimer(lockoutSeconds)}
            </div>
            <div className="text-[11px] text-red-600">
              Please wait until the countdown finishes before trying again.
            </div>
          </div>
        )}

        {/* Remaining Attempts Warning Banner (When not locked out but failed) */}
        {lockoutSeconds === 0 && remainingAttempts !== null && remainingAttempts < 5 && (
          <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
            <span className="text-xs text-amber-800 font-medium">Chances remaining in 1hr:</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${remainingAttempts <= 2 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
              {remainingAttempts} / 5
            </span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="Enter your username"
              disabled={lockoutSeconds > 0}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E0E2E5] rounded-lg text-[#2C2C2C] placeholder-gray-400 focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={lockoutSeconds > 0}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E0E2E5] rounded-lg text-[#2C2C2C] placeholder-gray-400 focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || lockoutSeconds > 0}
            className="w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-white bg-[#FF2E46] hover:bg-[#E02038] rounded-lg shadow-xs focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-3"
          >
            {isLoading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Signing In...
              </span>
            ) : lockoutSeconds > 0 ? (
              `Locked (${formatTimer(lockoutSeconds)})`
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 pt-5 border-t border-[#E0E2E5] text-center">
          <p className="text-[11px] text-[#666666]">
            Deep Infotech • Unjha • Mehsana • Ahmedabad
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;