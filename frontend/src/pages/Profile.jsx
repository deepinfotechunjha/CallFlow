import React from 'react';
import useAuthStore from '../store/authStore';
import useCallStore from '../store/callStore';

const Profile = () => {
  const { user } = useAuthStore();
  const { calls } = useCallStore();

  const userStats = {
    created: calls.filter(c => c.createdBy === user?.username).length,
    assigned: calls.filter(c => c.assignedTo === user?.username).length,
    completed: calls.filter(c => c.assignedTo === user?.username && c.status === 'COMPLETED').length,
    pending: calls.filter(c => c.assignedTo === user?.username && c.status !== 'COMPLETED').length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-[#FF2E46] uppercase tracking-wider bg-[#FFE8EB] px-2.5 py-0.5 rounded-md border border-[#FF2E46]/15">
              Account Overview
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Profile</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage personal credentials and review assigned operational performance.</p>
        </div>
      </div>
      
      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-900 text-white rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-bold border border-gray-800 shadow-xs shrink-0">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-gray-900 truncate">{user?.username}</h2>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-md border ${
                  user?.role === 'HOST' ? 'bg-[#FFE8EB] text-[#FF2E46] border-[#FF2E46]/20' :
                  user?.role === 'ADMIN' ? 'bg-gray-900 text-white border-gray-900' :
                  'bg-gray-100 text-gray-800 border-gray-200'
                }`}>
                  {user?.role?.replace(/_/g, ' ')}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                  Active
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Account registered on {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Operational Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Calls Created</p>
          <p className="text-2xl font-bold text-gray-900">{userStats.created}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Assigned</p>
          <p className="text-2xl font-bold text-gray-900">{userStats.assigned}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-1">Completed</p>
          <p className="text-2xl font-bold text-emerald-600">{userStats.completed}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 border-l-4 border-l-amber-500">
          <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1">Pending / Open</p>
          <p className="text-2xl font-bold text-amber-600">{userStats.pending}</p>
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <h3 className="text-sm font-semibold text-gray-900">Account Credentials & System Attributes</h3>
        </div>
        <dl className="divide-y divide-gray-100 text-sm">
          <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Username</dt>
            <dd className="sm:col-span-2 font-medium text-gray-900">{user?.username}</dd>
          </div>
          <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">System Role</dt>
            <dd className="sm:col-span-2 font-medium text-gray-900">{user?.role?.replace(/_/g, ' ')}</dd>
          </div>
          <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</dt>
            <dd className="sm:col-span-2 font-medium text-gray-900">{user?.email || '—'}</dd>
          </div>
          <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Phone</dt>
            <dd className="sm:col-span-2 font-mono text-gray-900">{user?.phone || '—'}</dd>
          </div>
          <div className="px-6 py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created Timestamp</dt>
            <dd className="sm:col-span-2 text-gray-700">
              {user?.createdAt ? new Date(user.createdAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' }) : '—'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default Profile;