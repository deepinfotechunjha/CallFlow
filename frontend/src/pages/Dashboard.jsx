import React, { useState, useEffect } from 'react';
import useCallStore from '../store/callStore';
import useAuthStore from '../store/authStore';
import AddCallForm from '../components/AddCallForm';
import CallCard from '../components/CallCard';

const Dashboard = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const { user } = useAuthStore();
  const [filter, setFilter] = useState(user?.role === 'ADMIN' || user?.role === 'HOST' ? 'ALL' : 'MY_TASKS');
  const [dateFilter, setDateFilter] = useState({ type: '', start: '', end: '' });
  const [appliedDateFilter, setAppliedDateFilter] = useState({ type: '', start: '', end: '' });
  
  const { calls, fetchCalls } = useCallStore();
  const { fetchUsers } = useAuthStore();

  useEffect(() => {
    fetchCalls();
    fetchUsers();
  }, []);

  // Role-based filter options
  const getFilterOptions = () => {
    if (user?.role === 'HOST') {
      return ['ALL', 'MY_CALLS', 'ASSIGNED_AND_PENDING', 'PENDING', 'COMPLETED'];
    } else if (user?.role === 'ADMIN') {
      return ['ALL', 'MY_CALLS', 'ASSIGNED_TO_ME', 'ASSIGNED_AND_PENDING', 'PENDING', 'COMPLETED'];
    } else {
      return ['MY_TASKS', 'MY_CREATED', 'PENDING', 'COMPLETED'];
    }
  };

  const filteredCalls = calls.filter(call => {
    const isUserRole = user?.role === 'USER';
    const isMyCall = call.createdBy === user?.username || call.assignedTo === user?.username;
    
    // Status filter
    let statusMatch = true;
    if (filter === 'ALL') statusMatch = true;
    else if (filter === 'MY_CALLS') statusMatch = call.createdBy === user?.username;
    else if (filter === 'MY_TASKS') statusMatch = call.createdBy === user?.username || call.assignedTo === user?.username;
    else if (filter === 'MY_CREATED') statusMatch = call.createdBy === user?.username;
    else if (filter === 'ASSIGNED_TO_ME') statusMatch = call.assignedTo === user?.username;
    else if (filter === 'ASSIGNED_AND_PENDING') statusMatch = call.assignedTo && call.status !== 'COMPLETED';
    else if (filter === 'PENDING') {
      statusMatch = isUserRole ? (isMyCall && call.status !== 'COMPLETED') : (!call.assignedTo && call.status !== 'COMPLETED');
    }
    else if (filter === 'COMPLETED') {
      statusMatch = isUserRole ? (isMyCall && call.status === 'COMPLETED') : (call.status === 'COMPLETED');
    }
    
    if (!statusMatch) return false;
    
    // Date range filter
    if (appliedDateFilter.type && appliedDateFilter.start && appliedDateFilter.end) {
      const callDate = call[appliedDateFilter.type];
      if (!callDate) return false;
      const date = new Date(callDate);
      const start = new Date(appliedDateFilter.start);
      const end = new Date(appliedDateFilter.end);
      end.setHours(23, 59, 59, 999);
      if (date < start || date > end) return false;
    }
    
    return true;
  });

  const todaysCalls = calls.filter(call => {
    const today = new Date().toDateString();
    return new Date(call.createdAt).toDateString() === today;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-3xl font-bold text-blue-700">Welcome Back! {user?.username}</h3>
      
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          + Add New Call
        </button>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Calls</h3>
          <p className="text-3xl font-bold text-blue-600">{calls.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Today's Calls</h3>
          <p className="text-3xl font-bold text-green-600">{todaysCalls.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {calls.filter(c => c.status === 'PENDING' || c.status === 'ASSIGNED').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Completed</h3>
          <p className="text-3xl font-bold text-green-600">
            {calls.filter(c => c.status === 'COMPLETED').length}
          </p>
        </div>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Date Range Filter</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Filter By</label>
            <select
              value={dateFilter.type}
              onChange={(e) => setDateFilter(prev => ({ ...prev, type: e.target.value }))}
              className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Type</option>
              <option value="createdAt">Created Date</option>
              <option value="assignedAt">Assigned Date</option>
              <option value="completedAt">Completed Date</option>
              <option value="lastCalledAt">Last Called Date</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={dateFilter.start}
              onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
              className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={dateFilter.end}
              onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
              className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setAppliedDateFilter(dateFilter)}
            disabled={!dateFilter.type || !dateFilter.start || !dateFilter.end}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Apply Filter
          </button>
          {appliedDateFilter.type && (
            <button
              onClick={() => {
                setDateFilter({ type: '', start: '', end: '' });
                setAppliedDateFilter({ type: '', start: '', end: '' });
              }}
              className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {getFilterOptions().map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCalls.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">No calls found</p>
          </div>
        ) : (
          filteredCalls.map(call => (
            <CallCard key={call.id} call={call} />
          ))
        )}
      </div>

      {showAddForm && <AddCallForm onClose={() => setShowAddForm(false)} />}
    </div>
  );
};

export default Dashboard;