import React, { useState, useEffect, useRef } from 'react';
import useCallStore from '../store/callStore';
import useAuthStore from '../store/authStore';
import useCategoryStore from '../store/categoryStore';
import useSocket from '../hooks/useSocket';
import AddCallForm from '../components/AddCallForm';
import CallCard from '../components/CallCard';
import CallTable from '../components/CallTable';
import ExportModal from '../components/ExportModal';
import BulkDeleteModal from '../components/BulkDeleteModal';
import ShareModal from '../components/ShareModal';
import AnimatedCounter from '../components/AnimatedCounter';
import { exportCallsToExcel } from '../utils/excelExport';
import { animatePageHeader, animateStaggerCascade } from '../utils/animations';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedCalls, setSelectedCalls] = useState([]);
  const { user, token } = useAuthStore();
  const [filter, setFilter] = useState(user?.role === 'ADMIN' || user?.role === 'HOST' ? 'ALL' : 'MY_TASKS');
  const [dateFilter, setDateFilter] = useState({ type: '', start: '', end: '' });
  const [appliedDateFilter, setAppliedDateFilter] = useState({ type: '', start: '', end: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL_STATUS');
  const [categoryFilter, setCategoryFilter] = useState('ALL_CATEGORIES');
  const [userFilterType, setUserFilterType] = useState('ALL_USERS');
  const [selectedUser, setSelectedUser] = useState('ALL');

  const headerRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    animatePageHeader(headerRef.current);
    animateStaggerCascade(statsRef.current, '> div');
  }, []);
  
  const { calls, fetchCalls, bulkDeleteCalls } = useCallStore();
  const { users, fetchUsers } = useAuthStore();
  const { categories, fetchCategories } = useCategoryStore();
  
  useSocket();

  useEffect(() => {
    fetchCalls();
    fetchCategories();
    if ((user?.role === 'HOST' || user?.role === 'ADMIN')) {
      fetchUsers();
    }
  }, [user?.role, fetchCalls, fetchCategories, fetchUsers]);

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
    
    let tabMatch = true;
    if (filter === 'ALL') tabMatch = true;
    else if (filter === 'MY_CALLS') tabMatch = call.createdBy === user?.username;
    else if (filter === 'MY_TASKS') tabMatch = call.assignedTo === user?.username;
    else if (filter === 'MY_CREATED') tabMatch = call.createdBy === user?.username;
    else if (filter === 'ASSIGNED_TO_ME') tabMatch = call.assignedTo === user?.username;
    else if (filter === 'ASSIGNED_AND_PENDING') tabMatch = call.assignedTo && call.status !== 'COMPLETED';
    else if (filter === 'PENDING') {
      tabMatch = isEngineerRole ? (call.assignedTo === user?.username && call.status !== 'COMPLETED') : (!call.assignedTo && call.status !== 'COMPLETED');
    }
    else if (filter === 'COMPLETED') {
      tabMatch = isEngineerRole ? (call.assignedTo === user?.username && call.status === 'COMPLETED') : (call.status === 'COMPLETED');
    }
    if (!tabMatch) return false;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        (call.customerName || '').toLowerCase().includes(query) ||
        (call.phone || '').toLowerCase().includes(query) ||
        (call.category || '').toLowerCase().includes(query) ||
        (call.problem || '').toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    if (statusFilter !== 'ALL_STATUS') {
      if (statusFilter === 'PENDING' && call.status !== 'PENDING') return false;
      if (statusFilter === 'ASSIGNED' && call.status !== 'ASSIGNED') return false;
      if (statusFilter === 'VISITED' && call.status !== 'VISITED') return false;
      if (statusFilter === 'COMPLETED' && call.status !== 'COMPLETED') return false;
    }
    
    if (categoryFilter !== 'ALL_CATEGORIES' && call.category !== categoryFilter) return false;
    
    if (userFilterType !== 'ALL_USERS' && selectedUser !== 'ALL') {
      if (userFilterType === 'CREATED_BY' && call.createdBy !== selectedUser) return false;
      if (userFilterType === 'ASSIGNED_BY' && call.assignedBy !== selectedUser) return false;
      if (userFilterType === 'COMPLETED_BY' && call.completedBy !== selectedUser) return false;
    }
    
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

  const completedCalls = filteredCalls.filter(c => c.status === 'COMPLETED');
  const isAllSelected = completedCalls.length > 0 && selectedCalls.length === completedCalls.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCalls([]);
    } else {
      setSelectedCalls(completedCalls.map(c => c.id));
    }
  };

  const handleSelectCall = (callId) => {
    setSelectedCalls(prev => 
      prev.includes(callId) ? prev.filter(id => id !== callId) : [...prev, callId]
    );
  };

  const handleBulkDelete = async (secretPassword) => {
    try {
      const response = await bulkDeleteCalls(selectedCalls, secretPassword);
      if (response.callsData) {
        await exportCallsToExcel(response.callsData);
      }
      setSelectedCalls([]);
      setShowBulkDeleteModal(false);
    } catch (error) {
      // Error handled in store
    }
  };

  const uniqueCategories = categories.map(c => c.name);
  
  const getUniqueUsers = () => {
    const allUsers = new Set();
    calls.forEach(call => {
      if (call.createdBy && call.createdBy !== 'Share Link') allUsers.add(call.createdBy);
      if (call.assignedBy && call.assignedBy !== 'Share Link') allUsers.add(call.assignedBy);
      if (call.completedBy && call.completedBy !== 'Share Link') allUsers.add(call.completedBy);
    });
    return Array.from(allUsers).sort();
  };
  
  const uniqueUsers = getUniqueUsers();

  const getTotalCalls = () => {
    if (user?.role === 'ENGINEER') {
      return calls.filter(call => call.assignedTo === user?.username).length;
    }
    return calls.length;
  };

  const getTodaysCalls = () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    if (user?.role === 'ENGINEER') {
      return calls.filter(call => {
        const isAssignedToMe = call.assignedTo === user?.username;
        const callDate = new Date(call.createdAt);
        return isAssignedToMe && callDate >= startOfDay && callDate < endOfDay;
      }).length;
    }
    
    return calls.filter(call => {
      const callDate = new Date(call.createdAt);
      return callDate >= startOfDay && callDate < endOfDay;
    }).length;
  };

  const getPendingCalls = () => {
    if (user?.role === 'ENGINEER') {
      return calls.filter(call => {
        const isAssignedToMe = call.assignedTo === user?.username;
        const isPending = call.status === 'PENDING' || call.status === 'ASSIGNED' || call.status === 'VISITED';
        return isAssignedToMe && isPending;
      }).length;
    }
    return calls.filter(c => c.status === 'PENDING' || c.status === 'ASSIGNED' || c.status === 'VISITED').length;
  };

  const getCompletedCalls = () => {
    if (user?.role === 'ENGINEER') {
      return calls.filter(call => {
        const isAssignedToMe = call.assignedTo === user?.username;
        return isAssignedToMe && call.status === 'COMPLETED';
      }).length;
    }
    return calls.filter(c => c.status === 'COMPLETED').length;
  };

  const handleExport = async (exportType, password) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-secret`, {
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
        
        if (dataToExport.length === 0) {
          toast.error('No data to export');
          return;
        }
        
        await exportCallsToExcel(dataToExport);
        toast.success(`Successfully exported ${dataToExport.length} calls to Excel`);
        setShowExportModal(false);
      } else {
        toast.error('Invalid secret password');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Header & Action Controls */}
      <div ref={headerRef} className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-[#FF2E46] uppercase tracking-wider bg-[#FFE8EB] px-2.5 py-0.5 rounded-md border border-[#FF2E46]/15">
              Service Operations
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Call Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time dispatch, engineer tracking, and service lifecycle management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {user?.role === 'HOST' && selectedCalls.length > 0 && (
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium text-xs sm:text-sm text-white bg-red-600 hover:bg-red-700 shadow-xs transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete ({selectedCalls.length})
            </button>
          )}

          {user?.role === 'HOST' && (
            <button
              onClick={() => setShowExportModal(true)}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium text-xs sm:text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-xs transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {isExporting ? 'Exporting...' : 'Export Excel'}
            </button>
          )}

          <button
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium text-xs sm:text-sm bg-[#2C2C2C] hover:bg-black text-white shadow-xs transition-colors"
          >
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share Form
          </button>

          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-xs sm:text-sm text-white bg-[#FF2E46] hover:bg-[#FF5A71] shadow-xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add New Call
          </button>
        </div>
      </div>

      {/* Enterprise Stats Cards */}
      <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Calls</p>
            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2"><AnimatedCounter value={getTotalCalls()} /></p>
          <p className="text-[11px] text-gray-400 mt-1">Overall registered</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Today's Inflow</p>
            <span className="w-2 h-2 rounded-full bg-[#FF2E46]"></span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2"><AnimatedCounter value={getTodaysCalls()} /></p>
          <p className="text-[11px] text-gray-400 mt-1">Logged today</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-amber-700">Pending / Open</p>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2"><AnimatedCounter value={getPendingCalls()} /></p>
          <p className="text-[11px] text-amber-600/70 mt-1">In-progress / queued</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-700">Completed</p>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2"><AnimatedCounter value={getCompletedCalls()} /></p>
          <p className="text-[11px] text-emerald-600/70 mt-1">Resolved calls</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="mb-6 bg-white p-5 rounded-xl shadow-xs border border-gray-200">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter Records
          </h2>
          <span className="text-xs text-gray-500">
            Total records: <strong className="text-gray-900 font-semibold">{filteredCalls.length}</strong>
          </span>
        </div>
        
        {/* Date Filter */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1">
                Date Field
              </label>
              <select
                value={dateFilter.type}
                onChange={(e) => setDateFilter(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/15 focus:border-[#FF2E46] bg-white text-gray-800"
              >
                <option value="">Select Date Field</option>
                <option value="createdAt">Created Date</option>
                <option value="assignedAt">Assigned Date</option>
                <option value="completedAt">Completed Date</option>
                <option value="lastCalledAt">Last Called Date</option>
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/15 focus:border-[#FF2E46] bg-white text-gray-800"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/15 focus:border-[#FF2E46] bg-white text-gray-800"
              />
            </div>
            <button
              onClick={() => setAppliedDateFilter(dateFilter)}
              disabled={!dateFilter.type || !dateFilter.start || !dateFilter.end}
              className="px-4 py-1.5 bg-[#FF2E46] hover:bg-[#FF5A71] text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-all disabled:cursor-not-allowed"
            >
              Apply
            </button>
            {appliedDateFilter.type && (
              <button
                onClick={() => {
                  setDateFilter({ type: '', start: '', end: '' });
                  setAppliedDateFilter({ type: '', start: '', end: '' });
                }}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Search and Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search customer, phone, category, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/15 focus:border-[#FF2E46] bg-white text-gray-800 placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            )}
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/15 focus:border-[#FF2E46] bg-white text-gray-800 min-w-[120px]"
          >
            <option value="ALL_STATUS">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="VISITED">Visited</option>
            <option value="COMPLETED">Completed</option>
          </select>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/15 focus:border-[#FF2E46] bg-white text-gray-800 min-w-[140px]"
          >
            <option value="ALL_CATEGORIES">All Categories</option>
            {uniqueCategories.map((cat, index) => (
              <option key={index} value={cat}>{cat}</option>
            ))}
          </select>
          
          <select
            value={userFilterType}
            onChange={(e) => {
              setUserFilterType(e.target.value);
              setSelectedUser('ALL');
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/15 focus:border-[#FF2E46] bg-white text-gray-800 min-w-[120px]"
          >
            <option value="ALL_USERS">All Users</option>
            <option value="CREATED_BY">Created By</option>
            <option value="ASSIGNED_BY">Assigned By</option>
            <option value="COMPLETED_BY">Completed By</option>
          </select>
          
          {userFilterType !== 'ALL_USERS' && (
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/15 focus:border-[#FF2E46] bg-white text-gray-800 min-w-[120px]"
            >
              <option value="ALL">All Users</option>
              {uniqueUsers.map((user, index) => (
                <option key={index} value={user}>{user}</option>
              ))}
            </select>
          )}
          
          {(searchQuery || statusFilter !== 'ALL_STATUS' || categoryFilter !== 'ALL_CATEGORIES' || userFilterType !== 'ALL_USERS') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL_STATUS');
                setCategoryFilter('ALL_CATEGORIES');
                setUserFilterType('ALL_USERS');
                setSelectedUser('ALL');
              }}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {/* Filter Segmented Control Tabs */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex overflow-x-auto scrollbar-hide gap-1.5 py-1 bg-gray-100/70 p-1 rounded-lg border border-gray-200/60">
            {getFilterOptions().map(f => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                    active
                      ? 'bg-white text-gray-900 shadow-xs border border-gray-200/80'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  {f.replace(/_/g, ' ')}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        {user?.role === 'HOST' && completedCalls.length > 0 && (
          <div className="mb-4 bg-white p-3.5 rounded-lg shadow-xs border border-gray-200 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="w-4 h-4 text-[#FF2E46] rounded focus:ring-[#FF2E46] accent-[#FF2E46]"
              />
              <span className="font-medium text-xs sm:text-sm text-gray-800">
                Select All Completed Calls ({completedCalls.length})
              </span>
            </label>
            {selectedCalls.length > 0 && (
              <span className="text-xs font-semibold text-[#FF2E46] bg-[#FFE8EB] px-2 py-0.5 rounded-md border border-[#FF2E46]/20">
                {selectedCalls.length} Selected
              </span>
            )}
          </div>
        )}
        {filteredCalls.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl text-center py-16 px-4">
            <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-base font-semibold text-gray-900 mb-1">No Calls Found</h4>
            <p className="text-xs text-gray-500">Try adjusting your search criteria or filter parameters.</p>
          </div>
        ) : (
          <CallTable 
            calls={filteredCalls} 
            selectedCalls={selectedCalls}
            onSelectCall={handleSelectCall}
            showCheckboxes={user?.role === 'HOST'}
          />
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {user?.role === 'HOST' && completedCalls.length > 0 && (
          <div className="mb-4 bg-white p-3.5 rounded-lg shadow-xs border border-gray-200 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="w-4 h-4 text-[#FF2E46] rounded focus:ring-[#FF2E46] accent-[#FF2E46]"
              />
              <span className="font-medium text-xs sm:text-sm text-gray-800">
                Select All Completed ({completedCalls.length})
              </span>
            </label>
            {selectedCalls.length > 0 && (
              <span className="text-xs font-semibold text-[#FF2E46] bg-[#FFE8EB] px-2 py-0.5 rounded-md border border-[#FF2E46]/20">
                {selectedCalls.length} Selected
              </span>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCalls.length === 0 ? (
            <div className="col-span-full bg-white border border-gray-200 rounded-xl text-center py-16 px-4">
              <h4 className="text-base font-semibold text-gray-900 mb-1">No Calls Found</h4>
              <p className="text-xs text-gray-500">Try adjusting your search criteria or filter parameters.</p>
            </div>
          ) : (
            filteredCalls.map(call => (
              <CallCard 
                key={call.id} 
                call={call} 
                selectedCalls={selectedCalls}
                onSelectCall={handleSelectCall}
                showCheckboxes={user?.role === 'HOST'}
              />
            ))
          )}
        </div>
      </div>

      {showAddForm && <AddCallForm onClose={() => setShowAddForm(false)} />}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          totalCount={calls.length}
          filteredCount={filteredCalls.length}
          title="Export Calls to Excel"
        />
      )}
      {showBulkDeleteModal && (
        <BulkDeleteModal
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
          onConfirm={handleBulkDelete}
          selectedCount={selectedCalls.length}
        />
      )}
    </div>
  );
};

export default Dashboard;