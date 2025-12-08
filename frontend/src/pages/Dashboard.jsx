import React, { useState, useEffect } from 'react';
import useCallStore from '../store/callStore';
import useAuthStore from '../store/authStore';
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
    
    // Tab filter
    let tabMatch = true;
    if (filter === 'ALL') tabMatch = true;
    else if (filter === 'MY_CALLS') tabMatch = call.createdBy === user?.username;
    else if (filter === 'MY_TASKS') tabMatch = call.createdBy === user?.username || call.assignedTo === user?.username;
    else if (filter === 'MY_CREATED') tabMatch = call.createdBy === user?.username;
    else if (filter === 'ASSIGNED_TO_ME') tabMatch = call.assignedTo === user?.username;
    else if (filter === 'ASSIGNED_AND_PENDING') tabMatch = call.assignedTo && call.status !== 'COMPLETED';
    else if (filter === 'PENDING') {
      tabMatch = isUserRole ? (isMyCall && call.status !== 'COMPLETED') : (!call.assignedTo && call.status !== 'COMPLETED');
    }
    else if (filter === 'COMPLETED') {
      tabMatch = isUserRole ? (isMyCall && call.status === 'COMPLETED') : (call.status === 'COMPLETED');
    }
    if (!tabMatch) return false;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        call.customerName?.toLowerCase().includes(query) ||
        call.phone?.toLowerCase().includes(query) ||
        call.category?.toLowerCase().includes(query);
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

  const uniqueCategories = [...new Set(calls.map(c => c.category).filter(Boolean))];

  const todaysCalls = calls.filter(call => {
    const today = new Date().toDateString();
    return new Date(call.createdAt).toDateString() === today;
  });

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
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-700">Welcome Back! {user?.username}</h3>
      
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {user?.role === 'HOST' && (
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-green-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-green-700 font-medium text-sm sm:text-base whitespace-nowrap flex items-center gap-2"
            >
              📊 Export
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm sm:text-base whitespace-nowrap"
          >
            + Add New Call
          </button>
        </div>
      </div>

      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6">
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-700">Total Calls</h3>
          <p className="text-xl sm:text-3xl font-bold text-blue-600">{calls.length}</p>
        </div>
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-700">Today's Calls</h3>
          <p className="text-xl sm:text-3xl font-bold text-green-600">{todaysCalls.length}</p>
        </div>
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-700">Pending</h3>
          <p className="text-xl sm:text-3xl font-bold text-yellow-600">
            {calls.filter(c => c.status === 'PENDING' || c.status === 'ASSIGNED').length}
          </p>
        </div>
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-700">Completed</h3>
          <p className="text-xl sm:text-3xl font-bold text-green-600">
            {calls.filter(c => c.status === 'COMPLETED').length}
          </p>
        </div>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        {/* Date Filter - First */}
        <div className="mb-4 pb-4 border-b">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Date Type</label>
              <select
                value={dateFilter.type}
                onChange={(e) => setDateFilter(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-2 border rounded text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="createdAt">Created</option>
                <option value="assignedAt">Assigned</option>
                <option value="completedAt">Completed</option>
                <option value="lastCalledAt">Last Called</option>
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                className="w-full p-2 border rounded text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                className="w-full p-2 border rounded text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setAppliedDateFilter(dateFilter)}
              disabled={!dateFilter.type || !dateFilter.start || !dateFilter.end}
              className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Apply
            </button>
            {appliedDateFilter.type && (
              <button
                onClick={() => {
                  setDateFilter({ type: '', start: '', end: '' });
                  setAppliedDateFilter({ type: '', start: '', end: '' });
                }}
                className="px-4 py-2 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Search Bar - Second */}
        <div className="mb-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search by customer, phone, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters - Third */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="ALL_STATUS">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="COMPLETED">Completed</option>
          </select>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="ALL_CATEGORIES">All Categories</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          {(searchQuery || statusFilter !== 'ALL_STATUS' || categoryFilter !== 'ALL_CATEGORIES') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL_STATUS');
                setCategoryFilter('ALL_CATEGORIES');
              }}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300"
            >
              Clear
            </button>
          )}
          
          <div className="ml-auto text-xs text-gray-600">
            {filteredCalls.length} of {calls.length}
          </div>
        </div>

        {/* Tabs - Last */}
        <div className="border-t pt-4 -mx-4 px-4">
          <div className="flex overflow-x-auto scrollbar-hide">
            {getFilterOptions().map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  filter === f
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
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