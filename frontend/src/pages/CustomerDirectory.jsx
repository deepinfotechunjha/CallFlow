import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import useAuthStore from '../store/authStore';
import CustomerDetailsModal from '../components/CustomerDetailsModal';
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
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">Customer Directory</h1>
          <p className="text-gray-600">Manage and view all customer information</p>
        </div>
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <span>📊</span>
          <span className="hidden sm:inline">Export to Excel</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl shadow-sm border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-blue-700 mb-1">Total Customers</h3>
              <p className="text-2xl sm:text-3xl font-bold text-blue-800">{customers.length}</p>
            </div>
            <div className="text-blue-500 text-2xl">👥</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-xl shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-green-700 mb-1">Outside Calls</h3>
              <p className="text-2xl sm:text-3xl font-bold text-green-800">
                {customers.reduce((sum, c) => sum + (c.outsideCalls || 0), 0)}
              </p>
            </div>
            <div className="text-green-500 text-2xl">📞</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-6 rounded-xl shadow-sm border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-purple-700 mb-1">Carry-In Services</h3>
              <p className="text-2xl sm:text-3xl font-bold text-purple-800">
                {customers.reduce((sum, c) => sum + (c.carryInServices || 0), 0)}
              </p>
            </div>
            <div className="text-purple-500 text-2xl">🔧</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 sm:p-6 rounded-xl shadow-sm border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-orange-700 mb-1">Total Interactions</h3>
              <p className="text-2xl sm:text-3xl font-bold text-orange-800">
                {customers.reduce((sum, c) => sum + (c.totalInteractions || 0), 0)}
              </p>
            </div>
            <div className="text-orange-500 text-2xl">📊</div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>🔍</span> Search & Filters
        </h2>
        
        {/* Date Range Filter */}
        <div className="mb-6 pb-6 border-b border-gray-100">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Type</label>
              <select
                value={dateRangeFilter.type || filterDateType}
                onChange={(e) => setDateRangeFilter(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="lastActivityDate">Last Activity</option>
                <option value="createdAt">Created Date</option>
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <input
                type="date"
                value={dateRangeFilter.start}
                onChange={(e) => setDateRangeFilter(prev => ({ ...prev, start: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <input
                type="date"
                value={dateRangeFilter.end}
                onChange={(e) => setDateRangeFilter(prev => ({ ...prev, end: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => {
                const filterWithType = { ...dateRangeFilter, type: dateRangeFilter.type || filterDateType };
                setAppliedDateRange(filterWithType);
              }}
              disabled={!dateRangeFilter.start || !dateRangeFilter.end}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Apply
            </button>
            {appliedDateRange.type && (
              <button
                onClick={() => {
                  setDateRangeFilter({ type: '', start: '', end: '' });
                  setAppliedDateRange({ type: '', start: '', end: '' });
                }}
                className="px-6 py-3 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Search by name, phone, email, or address..."
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
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-400 transition-colors"
          >
            <option value="ALL_ACTIVITY">All Time</option>
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
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-400 transition-colors"
          >
            <option value="ALL_STATUS">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          
          {(searchQuery || activityFilter !== 'ALL_ACTIVITY' || statusFilter !== 'ALL_STATUS') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setActivityFilter('ALL_ACTIVITY');
                setStatusFilter('ALL_STATUS');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Clear All
            </button>
          )}
          
          <div className="ml-auto text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <span className="font-medium">{filteredCustomers.length}</span> of <span className="font-medium">{customers.length}</span> customers
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden xl:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  #
                </th>
                <th onClick={() => handleSort('name')} className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors">
                  <div className="flex items-center gap-1">
                    Customer {getSortIcon('name')}
                  </div>
                </th>
                <th onClick={() => handleSort('phone')} className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors">
                  <div className="flex items-center gap-1">
                    Contact {getSortIcon('phone')}
                  </div>
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Address
                </th>
                <th onClick={() => handleSort('outsideCalls')} className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors">
                  <div className="flex items-center justify-center gap-1">
                    Calls {getSortIcon('outsideCalls')}
                  </div>
                </th>
                <th onClick={() => handleSort('carryInServices')} className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors">
                  <div className="flex items-center justify-center gap-1">
                    Services {getSortIcon('carryInServices')}
                  </div>
                </th>
                <th onClick={() => handleSort('totalInteractions')} className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors">
                  <div className="flex items-center justify-center gap-1">
                    Total {getSortIcon('totalInteractions')}
                  </div>
                </th>
                <th onClick={() => handleSort('status')} className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors">
                  <div className="flex items-center justify-center gap-1">
                    Status {getSortIcon('status')}
                  </div>
                </th>
                <th onClick={() => handleSort('lastActivityDate')} className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors">
                  <div className="flex items-center justify-center gap-1">
                    Last Activity {getSortIcon('lastActivityDate')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <div className="text-gray-400 text-4xl mb-4">👥</div>
                    <p className="text-lg font-medium text-gray-500 mb-2">No customers found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => handleCustomerClick(customer)}>
                    <td className="px-4 py-4 text-sm font-medium text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{customer.name}</div>
                          {customer.email && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <span>✉️</span> {customer.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <span className="text-green-500">📞</span>
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600 max-w-xs">
                        {customer.address ? (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-400 mt-0.5">📍</span>
                            <span className="line-clamp-2">{customer.address}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No address</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                        {customer.outsideCalls || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        {customer.carryInServices || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {customer.totalInteractions || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                        getCustomerStatus(customer) === 'Active' 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        <span className="mr-1">{getCustomerStatus(customer) === 'Active' ? '🟢' : '🔴'}</span>
                        {getCustomerStatus(customer)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-500">
                      {customer.lastActivityDate ? (
                        <div>
                          <div className="font-medium">{new Date(customer.lastActivityDate).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-400">{new Date(customer.lastActivityDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Never</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="xl:hidden space-y-4">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-xl font-semibold text-gray-700 mb-2">No customers found</p>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredCustomers.map((customer, index) => (
            <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer" onClick={() => handleCustomerClick(customer)}>
              {/* Header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-lg">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">#{index + 1}</span>
                        <h3 className="text-lg font-bold text-gray-900">{customer.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-green-500">📞</span>
                        <span className="font-medium">{customer.phone}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border ${
                    getCustomerStatus(customer) === 'Active' 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    <span className="mr-1.5">{getCustomerStatus(customer) === 'Active' ? '🟢' : '🔴'}</span>
                    {getCustomerStatus(customer)}
                  </span>
                </div>
                
                {/* Contact Info */}
                <div className="space-y-2">
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-blue-500">✉️</span>
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-red-500 mt-0.5">📍</span>
                      <span className="flex-1">{customer.address}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Stats */}
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                    <div className="text-green-600 text-xl mb-1">📞</div>
                    <div className="text-xs text-green-700 mb-1 font-semibold uppercase tracking-wide">Calls</div>
                    <div className="text-xl font-bold text-green-800">{customer.outsideCalls || 0}</div>
                  </div>
                  <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                    <div className="text-purple-600 text-xl mb-1">🔧</div>
                    <div className="text-xs text-purple-700 mb-1 font-semibold uppercase tracking-wide">Services</div>
                    <div className="text-xl font-bold text-purple-800">{customer.carryInServices || 0}</div>
                  </div>
                  <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <div className="text-blue-600 text-xl mb-1">📊</div>
                    <div className="text-xs text-blue-700 mb-1 font-semibold uppercase tracking-wide">Total</div>
                    <div className="text-xl font-bold text-blue-800">{customer.totalInteractions || 0}</div>
                  </div>
                </div>
                
                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 text-sm">📅</span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</div>
                      <div className="text-sm font-medium text-gray-700">
                        {customer.createdAt 
                          ? new Date(customer.createdAt).toLocaleDateString()
                          : 'N/A'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 text-sm">⏰</span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Activity</div>
                      <div className="text-sm font-medium text-gray-700">
                        {customer.lastActivityDate 
                          ? new Date(customer.lastActivityDate).toLocaleDateString()
                          : 'Never'
                        }
                      </div>
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