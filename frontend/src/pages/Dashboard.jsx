import React, { useState, useEffect } from 'react';
import useCallStore from '../store/callStore';
import useAuthStore from '../store/authStore';
import useCategoryStore from '../store/categoryStore';
import useSocket from '../hooks/useSocket';
import AddCallForm from '../components/AddCallForm';
import CallCard from '../components/CallCard';
import CallTable from '../components/CallTable';
import ExportModal from '../components/ExportModal';
import { exportCallsToExcel } from '../utils/excelExport';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const { user, token } = useAuthStore();
  const [filter, setFilter] = useState(user?.role === 'ADMIN' || user?.role === 'HOST' ? 'ALL' : 'MY_TASKS');
  const [dateFilter, setDateFilter] = useState({ type: '', start: '', end: '' });
  const [appliedDateFilter, setAppliedDateFilter] = useState({ type: '', start: '', end: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL_STATUS');
  const [categoryFilter, setCategoryFilter] = useState('ALL_CATEGORIES');
  
  const { calls, fetchCalls } = useCallStore();
  const { users, fetchUsers } = useAuthStore();
  const { categories, fetchCategories } = useCategoryStore();
  
  // Initialize WebSocket connection
  useSocket();

  useEffect(() => {
    if (calls.length === 0) fetchCalls();
    if (categories.length === 0) fetchCategories();
    if ((user?.role === 'HOST' || user?.role === 'ADMIN') && users.length === 0) {
      fetchUsers();
    }
  }, [calls.length, categories.length, users.length, user?.role, fetchCalls, fetchCategories, fetchUsers]);

  // Role-based filter options
  const getFilterOptions = () => {
    if (user?.role === 'HOST') {
      return ['ALL', 'MY_CALLS', 'ASSIGNED_AND_PENDING', 'PENDING', 'COMPLETED'];
    } else if (user?.role === 'ADMIN') {
      return ['ALL', 'MY_CALLS', 'ASSIGNED_TO_ME', 'ASSIGNED_AND_PENDING', 'PENDING', 'COMPLETED'];
    } else if (user?.role === 'ENGINEER') {
      return ['MY_TASKS', 'MY_CREATED', 'PENDING', 'COMPLETED'];
    } else {
      return ['MY_TASKS', 'MY_CREATED', 'PENDING', 'COMPLETED'];
    }
  };

  const filteredCalls = calls.filter(call => {
    const isEngineerRole = user?.role === 'ENGINEER';
    const isMyCall = call.createdBy === user?.username || call.assignedTo === user?.username;
    
    // Tab filter
    let tabMatch = true;
    if (filter === 'ALL') tabMatch = true;
    else if (filter === 'MY_CALLS') tabMatch = call.createdBy === user?.username;
    else if (filter === 'MY_TASKS') tabMatch = call.createdBy === user?.username || call.assignedTo === user?.username;
    else if (filter === 'MY_CREATED') tabMatch = call.createdBy === user?.username;
    else if (filter === 'ASSIGNED_TO_ME') tabMatch = call.assignedTo === user?.username;
    else if (filter === 'ASSIGNED_AND_PENDING') tabMatch = call.assignedTo && call.status !== 'COMPLETED';
    else if (filter === 'PENDING') {
      tabMatch = isEngineerRole ? (isMyCall && call.status !== 'COMPLETED') : (!call.assignedTo && call.status !== 'COMPLETED');
    }
    else if (filter === 'COMPLETED') {
      tabMatch = isEngineerRole ? (isMyCall && call.status === 'COMPLETED') : (call.status === 'COMPLETED');
    }
    if (!tabMatch) return false;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        (call.customerName || '').toLowerCase().includes(query) ||
        (call.phone || '').toLowerCase().includes(query) ||
        (call.category || '').toLowerCase().includes(query) ||
        (call.problem || '').toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    // Status dropdown filter
    if (statusFilter !== 'ALL_STATUS') {
      if (statusFilter === 'PENDING' && call.status !== 'PENDING') return false;
      if (statusFilter === 'ASSIGNED' && call.status !== 'ASSIGNED') return false;
      if (statusFilter === 'COMPLETED' && call.status !== 'COMPLETED') return false;
    }
    
    // Category dropdown filter
    if (categoryFilter !== 'ALL_CATEGORIES' && call.category !== categoryFilter) return false;
    
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

  const uniqueCategories = categories.map(c => c.name);

  const todaysCalls = calls.filter(call => {
    const today = new Date().toDateString();
    return new Date(call.createdAt).toDateString() === today;
  });

  // Calculate totals based on user role (same logic as backend)
  const getTotalCalls = () => {
    if (user?.role === 'ENGINEER') {
      return calls.filter(call => 
        call.createdBy === user?.username || call.assignedTo === user?.username
      ).length;
    }
    return calls.length;
  };

  const getTodaysCalls = () => {
    const today = new Date().toDateString();
    if (user?.role === 'ENGINEER') {
      return calls.filter(call => {
        const isMyCall = call.createdBy === user?.username || call.assignedTo === user?.username;
        const isToday = new Date(call.createdAt).toDateString() === today;
        return isMyCall && isToday;
      }).length;
    }
    return todaysCalls.length;
  };

  const getPendingCalls = () => {
    if (user?.role === 'ENGINEER') {
      return calls.filter(call => {
        const isMyCall = call.createdBy === user?.username || call.assignedTo === user?.username;
        const isPending = call.status === 'PENDING' || call.status === 'ASSIGNED';
        return isMyCall && isPending;
      }).length;
    }
    return calls.filter(c => c.status === 'PENDING' || c.status === 'ASSIGNED').length;
  };

  const getCompletedCalls = () => {
    if (user?.role === 'ENGINEER') {
      return calls.filter(call => {
        const isMyCall = call.createdBy === user?.username || call.assignedTo === user?.username;
        const isCompleted = call.status === 'COMPLETED';
        return isMyCall && isCompleted;
      }).length;
    }
    return calls.filter(c => c.status === 'COMPLETED').length;
  };

  const handleExport = async (exportType, password) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/verify-secret`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ secretPassword: password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.hasAccess) {
        const dataToExport = exportType === 'filtered' ? filteredCalls : calls;
        exportCallsToExcel(dataToExport);
        toast.success(`Successfully exported ${dataToExport.length} calls to Excel`);
        setShowExportModal(false);
      } else {
        toast.error('Invalid secret password');
      }
    } catch (error) {
      toast.error('Failed to verify password');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">Welcome Back! 👋</h1>
          <p className="text-gray-600">Hello <span className="font-semibold text-blue-600">{user?.username}</span>, here's your call management overview</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {user?.role === 'HOST' && (
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 font-medium text-sm sm:text-base whitespace-nowrap flex items-center gap-2 shadow-sm transition-all"
            >
              📊 Export
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium text-sm sm:text-base whitespace-nowrap shadow-sm transition-all"
          >
            + Add New Call
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl shadow-sm border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-blue-700 mb-1">Total Calls</h3>
              <p className="text-2xl sm:text-3xl font-bold text-blue-800">{getTotalCalls()}</p>
            </div>
            <div className="text-blue-500 text-2xl">📞</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-xl shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-green-700 mb-1">Today's Calls</h3>
              <p className="text-2xl sm:text-3xl font-bold text-green-800">{getTodaysCalls()}</p>
            </div>
            <div className="text-green-500 text-2xl">📅</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 sm:p-6 rounded-xl shadow-sm border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-yellow-700 mb-1">Pending</h3>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-800">{getPendingCalls()}</p>
            </div>
            <div className="text-yellow-500 text-2xl">⏳</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 sm:p-6 rounded-xl shadow-sm border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-emerald-700 mb-1">Completed</h3>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-800">{getCompletedCalls()}</p>
            </div>
            <div className="text-emerald-500 text-2xl">✅</div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>🔍</span> Search & Filters
        </h2>
        
        {/* Date Filter */}
        <div className="mb-6 pb-6 border-b border-gray-100">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Type</label>
              <select
                value={dateFilter.type}
                onChange={(e) => setDateFilter(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select</option>
                <option value="createdAt">Created</option>
                <option value="assignedAt">Assigned</option>
                <option value="completedAt">Completed</option>
                <option value="lastCalledAt">Last Called</option>
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setAppliedDateFilter(dateFilter)}
              disabled={!dateFilter.type || !dateFilter.start || !dateFilter.end}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Apply
            </button>
            {appliedDateFilter.type && (
              <button
                onClick={() => {
                  setDateFilter({ type: '', start: '', end: '' });
                  setAppliedDateFilter({ type: '', start: '', end: '' });
                }}
                className="px-6 py-3 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Search by customer, phone, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl transition-colors"
              >
                ×
              </button>
            )}
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-400 transition-colors min-w-[120px]"
          >
            <option value="ALL_STATUS">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="COMPLETED">Completed</option>
          </select>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-400 transition-colors min-w-[140px]"
          >
            <option value="ALL_CATEGORIES">All Categories</option>
            {uniqueCategories.map((cat, index) => (
              <option key={index} value={cat}>{cat}</option>
            ))}
          </select>
          
          {(searchQuery || statusFilter !== 'ALL_STATUS' || categoryFilter !== 'ALL_CATEGORIES') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL_STATUS');
                setCategoryFilter('ALL_CATEGORIES');
              }}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex overflow-x-auto scrollbar-hide gap-1">
            {getFilterOptions().map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-all ${
                  filter === f
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {f.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Table View (hidden on mobile) */}
      <div className="hidden lg:block">
        {filteredCalls.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No calls found</p>
          </div>
        ) : (
          <CallTable calls={filteredCalls} />
        )}
      </div>

      {/* Mobile Card View (hidden on desktop) */}
      <div className="lg:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>

      {showAddForm && <AddCallForm onClose={() => setShowAddForm(false)} />}
      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          totalCount={calls.length}
          filteredCount={filteredCalls.length}
          title="Export Calls to Excel"
        />
      )}
    </div>
  );
};

export default Dashboard;