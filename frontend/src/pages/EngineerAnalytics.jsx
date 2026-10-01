import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const EngineerAnalytics = () => {
  const [analytics, setAnalytics] = useState([]);
  const [deletionHistory, setDeletionHistory] = useState([]);
  const [serviceDeletionHistory, setServiceDeletionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingServiceHistory, setLoadingServiceHistory] = useState(true);
  const [timeFilter, setTimeFilter] = useState('30');
  const [sortField, setSortField] = useState('completionRate');
  const [sortDirection, setSortDirection] = useState('desc');
  const { user } = useAuthStore();

  const timeFilters = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 3 months' },
    { value: '180', label: 'Last 6 months' },
    { value: 'all', label: 'All time' }
  ];

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/analytics/engineers?days=${timeFilter}`);
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletionHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await apiClient.get('/analytics/deletion-history');
      setDeletionHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch deletion history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchServiceDeletionHistory = async () => {
    try {
      setLoadingServiceHistory(true);
      const response = await apiClient.get('/analytics/service-deletion-history');
      setServiceDeletionHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch service deletion history');
    } finally {
      setLoadingServiceHistory(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'HOST') {
      fetchAnalytics();
      fetchDeletionHistory();
      fetchServiceDeletionHistory();
    }
  }, [timeFilter, user]);

  const formatTime = (hours) => {
    if (hours === 0) return 'N/A';
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    }
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedAnalytics = [...analytics].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'name') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (user?.role !== 'HOST') {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-[#FFE8EB] border border-[#FF2E46]/30 text-[#FF2E46] px-5 py-4 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-semibold text-sm">Access denied. Only HOST users can view performance analytics.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <span className="inline-block text-[#FF2E46] text-xs font-bold uppercase tracking-widest bg-[#FFE8EB] px-2.5 py-0.5 rounded-md mb-2 border border-[#FF2E46]/20">
            PERFORMANCE & METRICS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C2C2C] tracking-tight">Engineer Analytics</h1>
          <p className="text-[#666666] text-sm mt-1">Resolution metrics, completion rates, and audit logs for service operations</p>
        </div>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs font-bold text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 shadow-xs cursor-pointer"
        >
          {timeFilters.map(filter => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      {analytics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-xs border border-[#E0E2E5] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#666666] uppercase tracking-wider mb-1">Total Engineers</h3>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#2C2C2C]">{analytics.length}</p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-[#F0F2F5] text-[#2C2C2C] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#2C2C2C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-xs border border-[#E0E2E5] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#FF2E46] uppercase tracking-wider mb-1">Avg Completion</h3>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#FF2E46]">
                {Math.round(analytics.reduce((sum, eng) => sum + eng.completionRate, 0) / analytics.length)}%
              </p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-[#FFE8EB] text-[#FF2E46] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-xs border border-[#E0E2E5] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Total Completed</h3>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#2C2C2C]">
                {analytics.reduce((sum, eng) => sum + eng.completed, 0)}
              </p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-[#F0F2F5] text-[#2C2C2C] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#2C2C2C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-xs border border-[#E0E2E5] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#666666] uppercase tracking-wider mb-1">Total Pending</h3>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#666666]">
                {analytics.reduce((sum, eng) => sum + eng.pending, 0)}
              </p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-[#F0F2F5] text-[#666666] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#666666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow-xs border border-[#E0E2E5] p-12 text-center text-[#666666]">
          <div className="w-8 h-8 border-3 border-[#FF2E46] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-[#2C2C2C]">Loading analytics metrics...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xs border border-[#E0E2E5] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E0E2E5]">
            <h2 className="text-sm font-bold text-[#2C2C2C] flex items-center gap-2">
              <svg className="w-4 h-4 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Engineer Performance Matrix
            </h2>
          </div>

          {sortedAnalytics.length === 0 ? (
            <div className="px-6 py-10 text-center text-[#666666]">
              <p className="text-sm font-semibold text-[#2C2C2C]">No data available</p>
              <p className="text-xs text-[#666666] mt-1">No performance records for the selected time period</p>
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="lg:hidden divide-y divide-[#E0E2E5]">
                {sortedAnalytics.map((engineer) => (
                  <div key={engineer.name} className="p-4 hover:bg-[#F8F9FA] transition-colors">
                    <div className="flex justify-between items-start mb-2.5">
                      <span className="text-sm font-bold text-[#2C2C2C]">{engineer.name}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        engineer.completionRate >= 80 ? 'bg-[#F0F2F5] text-[#2C2C2C] border border-[#E0E2E5]' :
                        engineer.completionRate >= 60 ? 'bg-[#FFE8EB] text-[#FF2E46] border border-[#FF2E46]/30' :
                        'bg-[#F0F2F5] text-[#666666]'
                      }`}>
                        {engineer.completionRate}% Rate
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[#666666] bg-[#F8F9FA] p-3 rounded-lg border border-[#E0E2E5]">
                      <div>Assigned: <span className="font-semibold text-[#2C2C2C]">{engineer.totalAssigned}</span></div>
                      <div>Completed: <span className="font-semibold text-[#2C2C2C]">{engineer.completed}</span></div>
                      <div>Pending: <span className="font-semibold text-[#FF2E46]">{engineer.pending}</span></div>
                      <div>Avg Time: <span className="font-semibold text-[#2C2C2C]">{formatTime(engineer.avgResolutionTime)}</span></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E0E2E5]">
                  <thead className="bg-[#2C2C2C]">
                    <tr>
                      <th 
                        className="px-5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:text-[#FF2E46] transition-colors border-r border-[#3D3D3D]"
                        onClick={() => handleSort('name')}
                      >
                        Engineer {getSortIcon('name')}
                      </th>
                      <th 
                        className="px-5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:text-[#FF2E46] transition-colors border-r border-[#3D3D3D]"
                        onClick={() => handleSort('totalAssigned')}
                      >
                        Total Assigned {getSortIcon('totalAssigned')}
                      </th>
                      <th 
                        className="px-5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:text-[#FF2E46] transition-colors border-r border-[#3D3D3D]"
                        onClick={() => handleSort('completed')}
                      >
                        Completed {getSortIcon('completed')}
                      </th>
                      <th 
                        className="px-5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:text-[#FF2E46] transition-colors border-r border-[#3D3D3D]"
                        onClick={() => handleSort('pending')}
                      >
                        Pending {getSortIcon('pending')}
                      </th>
                      <th 
                        className="px-5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:text-[#FF2E46] transition-colors border-r border-[#3D3D3D]"
                        onClick={() => handleSort('completionRate')}
                      >
                        Completion Rate {getSortIcon('completionRate')}
                      </th>
                      <th 
                        className="px-5 py-3 text-right text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:text-[#FF2E46] transition-colors"
                        onClick={() => handleSort('avgResolutionTime')}
                      >
                        Avg Resolution Time {getSortIcon('avgResolutionTime')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#E0E2E5]">
                    {sortedAnalytics.map((engineer) => (
                      <tr key={engineer.name} className="hover:bg-[#F8F9FA] transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-sm font-semibold text-[#2C2C2C]">{engineer.name}</span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-[#666666]">
                          {engineer.totalAssigned}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-[#2C2C2C]">
                          {engineer.completed}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-[#FF2E46]">
                          {engineer.pending}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            engineer.completionRate >= 80 ? 'bg-[#F0F2F5] text-[#2C2C2C] border border-[#E0E2E5]' :
                            engineer.completionRate >= 60 ? 'bg-[#FFE8EB] text-[#FF2E46] border border-[#FF2E46]/30' :
                            'bg-[#F0F2F5] text-[#666666]'
                          }`}>
                            {engineer.completionRate}%
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs font-semibold text-[#666666]">
                          {formatTime(engineer.avgResolutionTime)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Deletion History Section */}
      <div className="mt-8 bg-white rounded-xl shadow-xs border border-[#E0E2E5] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E0E2E5]">
          <h2 className="text-sm font-bold text-[#2C2C2C] flex items-center gap-2">
            <svg className="w-4 h-4 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Call Deletion History (Audit Trail)
          </h2>
        </div>

        {loadingHistory ? (
          <div className="px-6 py-8 text-center text-[#666666]">
            <p className="text-xs font-semibold">Loading deletion logs...</p>
          </div>
        ) : deletionHistory.length === 0 ? (
          <div className="px-6 py-8 text-center text-[#666666]">
            <p className="text-xs">No deletion records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E0E2E5]">
              <thead className="bg-[#2C2C2C]">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D] w-16">#</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Deleted By</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Date & Time</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">Calls Deleted</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E0E2E5]">
                {deletionHistory.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap text-xs font-semibold text-[#666666]">{index + 1}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-xs font-semibold text-[#2C2C2C]">{entry.deletedByName}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-xs text-[#666666]">{new Date(entry.deletedAt).toLocaleString()}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-right">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FFE8EB] text-[#FF2E46] border border-[#FF2E46]/30">
                        {entry.callCount} calls
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Service Deletion History Section */}
      <div className="mt-8 bg-white rounded-xl shadow-xs border border-[#E0E2E5] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E0E2E5]">
          <h2 className="text-sm font-bold text-[#2C2C2C] flex items-center gap-2">
            <svg className="w-4 h-4 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Service Deletion History (Audit Trail)
          </h2>
        </div>

        {loadingServiceHistory ? (
          <div className="px-6 py-8 text-center text-[#666666]">
            <p className="text-xs font-semibold">Loading service deletion logs...</p>
          </div>
        ) : serviceDeletionHistory.length === 0 ? (
          <div className="px-6 py-8 text-center text-[#666666]">
            <p className="text-xs">No service deletion records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E0E2E5]">
              <thead className="bg-[#2C2C2C]">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D] w-16">#</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Deleted By</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Date & Time</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">Services Deleted</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E0E2E5]">
                {serviceDeletionHistory.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap text-xs font-semibold text-[#666666]">{index + 1}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-xs font-semibold text-[#2C2C2C]">{entry.deletedByName}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-xs text-[#666666]">{new Date(entry.deletedAt).toLocaleString()}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-right">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FFE8EB] text-[#FF2E46] border border-[#FF2E46]/30">
                        {entry.serviceCount} services
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EngineerAnalytics;