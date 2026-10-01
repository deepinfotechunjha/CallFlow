import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import useAuthStore from '../store/authStore';
import CustomerDetailsModal from '../components/CustomerDetailsModal';
import EditCustomerModal from '../components/EditCustomerModal';
import ExportModal from '../components/ExportModal';

const CustomerDirectory = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [activityFilter, setActivityFilter] = useState('ALL_ACTIVITY');
  const [statusFilter, setStatusFilter] = useState('ALL_STATUS');
  const [dateRangeFilter, setDateRangeFilter] = useState({ type: '', start: '', end: '' });
  const [appliedDateRange, setAppliedDateRange] = useState({ type: '', start: '', end: '' });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const filterDateType = 'lastActivityDate';
  const { user } = useAuthStore();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await apiClient.get('/customers/directory');
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.direction === 'desc') direction = null;
    }
    setSortConfig({ key, direction });
  };

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedCustomer(null);
    fetchCustomers(); // Refresh data
  };

  const handleExport = async (exportType, password, activityDays) => {
    try {
      let dataToExport;
      let filename;
      
      if (exportType === 'filtered') {
        dataToExport = filteredCustomers;
        filename = `Customer_Directory_Filtered_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}`;
      } else {
        const response = await apiClient.get('/customers');
        dataToExport = response.data;
        filename = `Customer_Directory_All_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}`;
      }

      const getCustomerStatusForExport = (customer, days) => {
        if (!customer.lastActivityDate) return 'Inactive';
        const activityDate = new Date(customer.lastActivityDate);
        const daysSinceActivity = (new Date() - activityDate) / (1000 * 60 * 60 * 24);
        return daysSinceActivity <= days ? 'Active' : 'Inactive';
      };

      const excelData = dataToExport.map((customer, index) => ({
        'Sr. No': index + 1,
        'Name': customer.name,
        'Phone': customer.phone,
        'Email': customer.email || 'Not provided',
        'Address': customer.address || 'Not provided',
        'Created At': customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A',
        'Outside Calls': customer.outsideCalls || 0,
        'Carry In Services': customer.carryInServices || 0,
        'Total Interactions': customer.totalInteractions || 0,
        'Last Call Date': customer.lastCallDate ? new Date(customer.lastCallDate).toLocaleDateString() : 'Never',
        'Last Service Date': customer.lastServiceDate ? new Date(customer.lastServiceDate).toLocaleDateString() : 'Never',
        'Last Activity Date': customer.lastActivityDate ? new Date(customer.lastActivityDate).toLocaleDateString() : 'Never',
        'Status': getCustomerStatusForExport(customer, activityDays)
      }));

      const { exportToExcel } = await import('../utils/excelExport');
      await exportToExcel(excelData, filename, password);
      
      setIsExportModalOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    if (sortConfig.direction === 'asc') return '↑';
    if (sortConfig.direction === 'desc') return '↓';
    return '↕️';
  };

  const getCustomerStatus = (customer) => {
    const dateField = customer[filterDateType];
    if (!dateField) return 'Inactive';
    const activityDate = new Date(dateField);
    const daysSinceActivity = (new Date() - activityDate) / (1000 * 60 * 60 * 24);
    const activeDays = getActivityDays(activityFilter) || 30;
    return daysSinceActivity <= activeDays ? 'Active' : 'Inactive';
  };

  const getActivityDays = (filterType) => {
    switch (filterType) {
      case '1_DAY': return 1;
      case '3_DAYS': return 3;
      case '7_DAYS': return 7;
      case '15_DAYS': return 15;
      case '1_MONTH': return 30;
      case '3_MONTHS': return 90;
      case '6_MONTHS': return 180;
      case '12_MONTHS': return 365;
      default: return null;
    }
  };

  let filteredCustomers = customers.filter(customer => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        customer.name.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query) ||
        (customer.email && customer.email.toLowerCase().includes(query)) ||
        (customer.address && customer.address.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Activity filter only affects status calculation, not visibility

    if (statusFilter !== 'ALL_STATUS') {
      const status = getCustomerStatus(customer);
      if (statusFilter === 'ACTIVE' && status !== 'Active') return false;
      if (statusFilter === 'INACTIVE' && status !== 'Inactive') return false;
    }

    if (appliedDateRange.type && appliedDateRange.start && appliedDateRange.end) {
      const dateField = customer[appliedDateRange.type];
      if (!dateField) return false;
      const date = new Date(dateField);
      const start = new Date(appliedDateRange.start);
      const end = new Date(appliedDateRange.end);
      end.setHours(23, 59, 59, 999);
      if (date < start || date > end) return false;
    }

    return true;
  });

  if (sortConfig.key && sortConfig.direction) {
    filteredCustomers.sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'name': aVal = a.name || ''; bVal = b.name || ''; break;
        case 'phone': aVal = a.phone || ''; bVal = b.phone || ''; break;
        case 'outsideCalls': aVal = a.outsideCalls || 0; bVal = b.outsideCalls || 0; break;
        case 'carryInServices': aVal = a.carryInServices || 0; bVal = b.carryInServices || 0; break;
        case 'totalInteractions': aVal = a.totalInteractions || 0; bVal = b.totalInteractions || 0; break;
        case 'status': aVal = getCustomerStatus(a); bVal = getCustomerStatus(b); break;
        case 'createdAt': aVal = a.createdAt || ''; bVal = b.createdAt || ''; break;
        case 'lastActivityDate': aVal = a.lastActivityDate || ''; bVal = b.lastActivityDate || ''; break;
        default: return 0;
      }
      if (typeof aVal === 'string') {
        if (sortConfig.direction === 'asc') return aVal.localeCompare(bVal);
        return bVal.localeCompare(aVal);
      } else {
        if (sortConfig.direction === 'asc') return aVal - bVal;
        return bVal - aVal;
      }
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 bg-white p-5 sm:p-6 rounded-xl border border-[#E0E2E5] shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#FF2E46] bg-[#FFE8EB] px-2.5 py-1 rounded-md mb-2">
            Central Directory &bull; Customer Accounts
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C]">
            Customer Directory
          </h1>
          <p className="text-sm text-[#666666] mt-1">
            Manage comprehensive client profiles, transaction history, and service interaction logs.
          </p>
        </div>
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm border border-[#E0E2E5] bg-white text-[#2C2C2C] hover:border-[#FF2E46] hover:text-[#FF2E46] hover:bg-[#FFE8EB]/20 shadow-xs transition-all"
        >
          <svg className="w-4 h-4 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Export Excel</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E0E2E5] shadow-xs hover:border-[#FF2E46]/40 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#666666] mb-1">Total Customers</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2C2C2C] group-hover:text-[#FF2E46] transition-colors">{customers.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#FFE8EB] text-[#FF2E46] flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E0E2E5] shadow-xs hover:border-[#FF2E46]/40 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#666666] mb-1">Outside Calls</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2C2C2C] group-hover:text-[#FF2E46] transition-colors">
                {customers.reduce((sum, c) => sum + (c.outsideCalls || 0), 0)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#F0F2F5] text-[#2C2C2C] flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E0E2E5] shadow-xs hover:border-[#FF2E46]/40 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#666666] mb-1">Carry-In Services</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2C2C2C] group-hover:text-[#FF2E46] transition-colors">
                {customers.reduce((sum, c) => sum + (c.carryInServices || 0), 0)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E0E2E5] shadow-xs hover:border-[#FF2E46]/40 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#666666] mb-1">Total Touchpoints</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                {customers.reduce((sum, c) => sum + (c.totalInteractions || 0), 0)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="mb-6 bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-[#E0E2E5]">
        <h2 className="text-sm font-bold text-[#2C2C2C] mb-3 flex items-center gap-2 pb-2.5 border-b border-[#F0F2F5]">
          <svg className="w-4 h-4 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Directory Search &amp; Filters
        </h2>
        
        {/* Date Range Filter */}
        <div className="mb-4 pb-4 border-b border-[#F0F2F5]">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1.5">Date Type</label>
              <select
                value={dateRangeFilter.type || filterDateType}
                onChange={(e) => setDateRangeFilter(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3.5 py-2 border border-[#E0E2E5] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/20 focus:border-[#FF2E46] bg-white text-[#2C2C2C]"
              >
                <option value="lastActivityDate">Last Activity</option>
                <option value="createdAt">Created Date</option>
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1.5">From</label>
              <input
                type="date"
                value={dateRangeFilter.start}
                onChange={(e) => setDateRangeFilter(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3.5 py-2 border border-[#E0E2E5] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/20 focus:border-[#FF2E46] bg-white text-[#2C2C2C]"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1.5">To</label>
              <input
                type="date"
                value={dateRangeFilter.end}
                onChange={(e) => setDateRangeFilter(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3.5 py-2 border border-[#E0E2E5] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/20 focus:border-[#FF2E46] bg-white text-[#2C2C2C]"
              />
            </div>
            <button
              onClick={() => {
                const filterWithType = { ...dateRangeFilter, type: dateRangeFilter.type || filterDateType };
                setAppliedDateRange(filterWithType);
              }}
              disabled={!dateRangeFilter.start || !dateRangeFilter.end}
              className="px-4 py-2 bg-[#FF2E46] hover:bg-[#FF5A71] text-white rounded-lg text-xs sm:text-sm font-semibold disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-xs"
            >
              Apply Filter
            </button>
            {appliedDateRange.type && (
              <button
                onClick={() => {
                  setDateRangeFilter({ type: '', start: '', end: '' });
                  setAppliedDateRange({ type: '', start: '', end: '' });
                }}
                className="px-3.5 py-2 bg-[#F0F2F5] hover:bg-[#E0E2E5] text-[#2C2C2C] rounded-lg text-xs sm:text-sm font-semibold transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Search Bar & Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by name, phone, email, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-[#E0E2E5] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/20 focus:border-[#FF2E46] bg-[#F8F9FA] focus:bg-white text-[#2C2C2C] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold"
              >
                &times;
              </button>
            )}
          </div>

          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="px-3.5 py-2 border border-[#E0E2E5] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/20 focus:border-[#FF2E46] bg-white text-[#2C2C2C] hover:border-[#2C2C2C] transition-colors"
          >
            <option value="ALL_ACTIVITY">All Time Activity</option>
            <option value="1_DAY">Last 1 Day</option>
            <option value="3_DAYS">Last 3 Days</option>
            <option value="7_DAYS">Last 7 Days</option>
            <option value="15_DAYS">Last 15 Days</option>
            <option value="1_MONTH">Last 1 Month</option>
            <option value="3_MONTHS">Last 3 Months</option>
            <option value="6_MONTHS">Last 6 Months</option>
            <option value="12_MONTHS">Last 12 Months</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 border border-[#E0E2E5] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/20 focus:border-[#FF2E46] bg-white text-[#2C2C2C] hover:border-[#2C2C2C] transition-colors"
          >
            <option value="ALL_STATUS">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden xl:block bg-white rounded-xl shadow-xs border border-[#E0E2E5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E0E2E5]">
            <thead className="bg-[#2C2C2C]">
              <tr>
                <th className="px-3.5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">
                  #
                </th>
                <th onClick={() => handleSort('name')} className="px-3.5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1A1A1A] transition-colors border-r border-[#3D3D3D]">
                  <div className="flex items-center gap-1">
                    Customer {getSortIcon('name')}
                  </div>
                </th>
                <th onClick={() => handleSort('phone')} className="px-3.5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1A1A1A] transition-colors border-r border-[#3D3D3D]">
                  <div className="flex items-center gap-1">
                    Contact {getSortIcon('phone')}
                  </div>
                </th>
                <th className="px-3.5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">
                  Address
                </th>
                <th onClick={() => handleSort('outsideCalls')} className="px-3.5 py-3 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1A1A1A] transition-colors border-r border-[#3D3D3D]">
                  <div className="flex items-center justify-center gap-1">
                    Calls {getSortIcon('outsideCalls')}
                  </div>
                </th>
                <th onClick={() => handleSort('carryInServices')} className="px-3.5 py-3 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1A1A1A] transition-colors border-r border-[#3D3D3D]">
                  <div className="flex items-center justify-center gap-1">
                    Services {getSortIcon('carryInServices')}
                  </div>
                </th>
                <th onClick={() => handleSort('totalInteractions')} className="px-3.5 py-3 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1A1A1A] transition-colors border-r border-[#3D3D3D]">
                  <div className="flex items-center justify-center gap-1">
                    Total {getSortIcon('totalInteractions')}
                  </div>
                </th>
                <th onClick={() => handleSort('status')} className="px-3.5 py-3 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1A1A1A] transition-colors border-r border-[#3D3D3D]">
                  <div className="flex items-center justify-center gap-1">
                    Status {getSortIcon('status')}
                  </div>
                </th>
                <th onClick={() => handleSort('lastActivityDate')} className="px-3.5 py-3 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1A1A1A] transition-colors border-r border-[#3D3D3D]">
                  <div className="flex items-center justify-center gap-1">
                    Last Activity {getSortIcon('lastActivityDate')}
                  </div>
                </th>
                {(user?.role === 'HOST' || user?.role === 'ADMIN') && (
                  <th className="px-3.5 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#F0F2F5]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === 'HOST' || user?.role === 'ADMIN' ? "10" : "9"} className="px-6 py-12 text-center">
                    <p className="text-sm font-semibold text-[#2C2C2C] mb-1">No customers found</p>
                    <p className="text-xs text-[#666666]">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="px-3.5 py-3.5 text-xs font-medium text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-3.5 py-3.5 cursor-pointer" onClick={() => handleCustomerClick(customer)}>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-9 w-9">
                          <div className="h-9 w-9 rounded-lg bg-[#FFE8EB] text-[#FF2E46] flex items-center justify-center font-bold text-xs border border-[#FF2E46]/20">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-xs sm:text-sm font-bold text-[#2C2C2C]">{customer.name}</div>
                          {customer.email && (
                            <div className="text-xs text-[#666666] flex items-center gap-1">
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3.5 cursor-pointer" onClick={() => handleCustomerClick(customer)}>
                      <div className="text-xs sm:text-sm font-semibold text-[#2C2C2C]">
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-3.5 py-3.5 cursor-pointer" onClick={() => handleCustomerClick(customer)}>
                      <div className="text-xs text-[#666666] max-w-xs">
                        {customer.address ? (
                          <span className="line-clamp-2">{customer.address}</span>
                        ) : (
                          <span className="text-gray-400 italic">No address</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3.5 py-3.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {customer.outsideCalls || 0}
                      </span>
                    </td>
                    <td className="px-3.5 py-3.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        {customer.carryInServices || 0}
                      </span>
                    </td>
                    <td className="px-3.5 py-3.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {customer.totalInteractions || 0}
                      </span>
                    </td>
                    <td className="px-3.5 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                        getCustomerStatus(customer) === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {getCustomerStatus(customer)}
                      </span>
                    </td>
                    <td className="px-3.5 py-3.5 text-center text-xs text-[#666666]">
                      {customer.lastActivityDate ? (
                        <div>
                          <div className="font-semibold text-[#2C2C2C]">{new Date(customer.lastActivityDate).toLocaleDateString()}</div>
                          <div className="text-[11px] text-[#666666]">{new Date(customer.lastActivityDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Never</span>
                      )}
                    </td>
                    {(user?.role === 'HOST' || user?.role === 'ADMIN') && (
                      <td className="px-3.5 py-3.5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCustomer(customer);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2C2C2C] hover:bg-[#1A1A1A] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                        >
                          <svg className="w-3.5 h-3.5 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="xl:hidden space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-xs p-8 text-center border border-[#E0E2E5]">
            <p className="text-sm font-semibold text-[#2C2C2C] mb-1">No customers found</p>
            <p className="text-xs text-[#666666]">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredCustomers.map((customer, index) => (
            <div key={customer.id} className="bg-white rounded-xl shadow-xs border border-[#E0E2E5] hover:border-[#FF2E46]/40 transition-all cursor-pointer" onClick={() => handleCustomerClick(customer)}>
              {/* Header */}
              <div className="p-4 border-b border-[#F0F2F5]">
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-[#FFE8EB] text-[#FF2E46] flex items-center justify-center font-bold text-sm border border-[#FF2E46]/20">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="bg-gray-100 text-[#2C2C2C] text-[11px] font-bold px-1.5 py-0.5 rounded-md border border-gray-200">#{index + 1}</span>
                        <h3 className="text-sm font-bold text-[#2C2C2C]">{customer.name}</h3>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#666666]">
                        <span className="font-semibold text-[#2C2C2C]">{customer.phone}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                    getCustomerStatus(customer) === 'Active' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {getCustomerStatus(customer)}
                  </span>
                </div>
                {(user?.role === 'HOST' || user?.role === 'ADMIN') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCustomer(customer);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2C2C2C] hover:bg-[#1A1A1A] text-white text-xs font-semibold rounded-md shadow-xs transition-colors mb-2"
                  >
                    <svg className="w-3.5 h-3.5 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                )}
                
                {/* Contact Info */}
                <div className="space-y-1">
                  {customer.email && (
                    <div className="text-xs text-[#666666]">
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="text-xs text-[#666666]">
                      <span>{customer.address}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Stats */}
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2.5 mb-3">
                  <div className="text-center bg-[#F8F9FA] p-2.5 rounded-lg border border-[#E0E2E5]">
                    <div className="text-[11px] text-[#666666] font-semibold uppercase tracking-wide">Calls</div>
                    <div className="text-base font-extrabold text-[#2C2C2C]">{customer.outsideCalls || 0}</div>
                  </div>
                  <div className="text-center bg-[#F8F9FA] p-2.5 rounded-lg border border-[#E0E2E5]">
                    <div className="text-[11px] text-[#666666] font-semibold uppercase tracking-wide">Services</div>
                    <div className="text-base font-extrabold text-[#2C2C2C]">{customer.carryInServices || 0}</div>
                  </div>
                  <div className="text-center bg-[#F8F9FA] p-2.5 rounded-lg border border-[#E0E2E5]">
                    <div className="text-[11px] text-[#666666] font-semibold uppercase tracking-wide">Total</div>
                    <div className="text-base font-extrabold text-[#FF2E46]">{customer.totalInteractions || 0}</div>
                  </div>
                </div>
                
                {/* Dates */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#F0F2F5] text-xs">
                  <div>
                    <div className="text-[10px] font-bold text-[#666666] uppercase tracking-wide">Created</div>
                    <div className="font-semibold text-[#2C2C2C]">
                      {customer.createdAt 
                        ? new Date(customer.createdAt).toLocaleDateString()
                        : 'N/A'
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#666666] uppercase tracking-wide">Last Activity</div>
                    <div className="font-semibold text-[#2C2C2C]">
                      {customer.lastActivityDate 
                        ? new Date(customer.lastActivityDate).toLocaleDateString()
                        : 'Never'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Details Modal */}
      <CustomerDetailsModal 
        customer={selectedCustomer}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Edit Customer Modal */}
      <EditCustomerModal 
        customer={selectedCustomer}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        title="Export Customer Directory"
        filteredCount={filteredCustomers.length}
        totalCount={customers.length}
      />
    </div>
  );
};

export default CustomerDirectory;