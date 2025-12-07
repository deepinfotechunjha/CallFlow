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
    <div className="max-w-4xl mx-auto px-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Profile</h1>
      
      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{user?.username}</h2>
            <span className={`inline-block mt-2 px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${
              user?.role === 'HOST' ? 'bg-purple-100 text-purple-800' :
              user?.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {user?.role}
            </span>
            <p className="mt-2 text-xs sm:text-sm text-gray-600">
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Calls Created</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{userStats.created}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Assigned to Me</p>
          <p className="text-xl sm:text-2xl font-bold text-purple-600">{userStats.assigned}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Completed</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600">{userStats.completed}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Pending</p>
          <p className="text-xl sm:text-2xl font-bold text-yellow-600">{userStats.pending}</p>
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Account Details</h3>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b">
            <span className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-0">Username</span>
            <span className="text-sm sm:text-base text-gray-900 break-words">{user?.username}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b">
            <span className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-0">Role</span>
            <span className="text-sm sm:text-base text-gray-900">{user?.role}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b">
            <span className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-0">Account Created</span>
            <span className="text-sm sm:text-base text-gray-900">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3">
            <span className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-0">Account Status</span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;