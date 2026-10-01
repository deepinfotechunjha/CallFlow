import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(username, password);
    setIsLoading(false);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8F9FA] px-4 py-12 relative">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xs border border-[#E0E2E5] p-8 sm:p-10 relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/deep.png" alt="Deep Infotech" className="h-10 w-auto object-contain" />
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#FF2E46] bg-[#FFE8EB] px-2.5 py-0.5 rounded-md mb-3 border border-[#FF2E46]/20">
            Enterprise Portal
          </div>
          <h1 className="text-2xl font-extrabold text-[#2C2C2C] tracking-tight">Welcome Back</h1>
          <p className="mt-1 text-xs text-[#666666]">Sign in to access your CallFlow account</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E0E2E5] rounded-lg text-[#2C2C2C] placeholder-gray-400 focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
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
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E0E2E5] rounded-lg text-[#2C2C2C] placeholder-gray-400 focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-white bg-[#FF2E46] hover:bg-[#E02038] rounded-lg shadow-xs focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-3"
          >
            {isLoading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Signing In...
              </span>
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