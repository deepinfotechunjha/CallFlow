import React, { useState, useEffect } from 'react';
import useSalesStore from '../store/salesStore';
import useAuthStore from '../store/authStore';
import AddSalesEntryForm from '../components/AddSalesEntryForm';
import EditSalesEntryForm from '../components/EditSalesEntryForm';
import SalesEntryTable from '../components/SalesEntryTable';
import SalesEntryCard from '../components/SalesEntryCard';
import VisitLogModal from '../components/VisitLogModal';
import CallLogModal from '../components/CallLogModal';
import SalesEntryDetailsModal from '../components/SalesEntryDetailsModal';
import SalesShareModal from '../components/SalesShareModal';
import ExportModal from '../components/ExportModal';
import { exportSalesEntriesToExcel } from '../utils/excelExport';
import toast from 'react-hot-toast';

const SalesDashboard = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [areaFilter, setAreaFilter] = useState('ALL');
  const [salesExecutiveFilter, setSalesExecutiveFilter] = useState('ALL');
  const [logTypeFilter, setLogTypeFilter] = useState('ALL');
  const [filterField, setFilterField] = useState('firmName');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const { user, users, fetchUsers } = useAuthStore();
  const { entries, fetchEntries, loading } = useSalesStore();
  const [salesUsernames, setSalesUsernames] = useState([]);

  useEffect(() => {
    fetchEntries();
    if (user?.role === 'HOST' || user?.role === 'SALES_ADMIN') {
      fetchUsers();
      // Directly fetch users for the filter dropdown
      const token = useAuthStore.getState().token;
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            const names = data
              .filter(u => ['HOST', 'SALES_EXECUTIVE', 'TALLY_CALLER', 'SALES_ADMIN'].includes(u.role))
              .map(u => u.username)
              .sort();
            setSalesUsernames(names);
          }
        })
        .catch(() => {});
    }
  }, [fetchEntries, fetchUsers, user?.role]);

  // Refetch entries when date range changes
  useEffect(() => {
    if (dateRange.startDate || dateRange.endDate) {
      fetchEntries(dateRange);
    } else {
      fetchEntries();
    }
  }, [dateRange.startDate, dateRange.endDate, fetchEntries]);

  const getUniqueOptions = () => {
    const options = new Set();
    entries.forEach(entry => {
      const value = entry[filterField];
      if (value) options.add(value);
    });
    return Array.from(options).sort();
  };

  const uniqueOptions = getUniqueOptions();
  const filteredOptions = uniqueOptions.filter(option => 
    option.toLowerCase().startsWith(searchQuery.toLowerCase())
  );

  const isInDateRange = (dateString) => {
    const entryDate = new Date(dateString);
    const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
    const endDate = dateRange.endDate ? new Date(dateRange.endDate + 'T23:59:59') : null;

    // If no date range is selected, default to showing today's entries
    if (!startDate && !endDate) {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      return entryDate >= startOfToday && entryDate <= endOfToday;
    }

    if (startDate && entryDate < startDate) return false;
    if (endDate && entryDate > endDate) return false;
    return true;
  };

  const filteredEntries = entries.filter(entry => {
    // Search filter
    if (searchQuery.trim()) {
      const value = entry[filterField];
      if (!value || !value.toLowerCase().startsWith(searchQuery.toLowerCase())) return false;
    }
    
    // City filter
    if (cityFilter !== 'ALL' && entry.city !== cityFilter) return false;
    
    // Area filter (cascading - depends on city)
    if (areaFilter !== 'ALL' && entry.area !== areaFilter) return false;
    
    // Sales Executive filter (only for ADMIN/HOST)
    if (salesExecutiveFilter !== 'ALL' && entry.createdBy !== salesExecutiveFilter) return false;
    
    // Log type filter
    if (logTypeFilter !== 'ALL') {
      if (logTypeFilter === 'VISIT' && !(entry.visitCount > 0)) return false;
      if (logTypeFilter === 'CALL' && !(entry.callCount > 0)) return false;
      if (logTypeFilter === 'CREATED' && !isInDateRange(entry.createdAt)) return false;
    }

    // Date range filter (applies when not showing "Created" specifically)
    if (logTypeFilter !== 'CREATED' && (dateRange.startDate || dateRange.endDate)) {
      const entryDate = new Date(entry.createdAt);
      const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate + 'T23:59:59') : null;

      if (startDate && entryDate < startDate) return false;
      if (endDate && entryDate > endDate) return false;
    }

    return true;
  });

  const uniqueCities = [...new Set(entries.map(e => e.city))].sort();
  
  // Get unique areas based on selected city
  const uniqueAreas = [...new Set(
    entries
      .filter(e => cityFilter === 'ALL' || e.city === cityFilter)
      .map(e => e.area)
      .filter(Boolean)
  )].sort();
  
  const salesExecutives = [...new Set([
    ...salesUsernames,
    ...entries.map(e => e.createdBy).filter(Boolean)
  ])].sort();

  // Get filtered stats based on current filters
  const getFilteredStats = () => {
    const filtered = entries.filter(entry => {
      // Search filter
      if (searchQuery.trim()) {
        const value = entry[filterField];
        if (!value || !value.toLowerCase().startsWith(searchQuery.toLowerCase())) return false;
      }
      
      // City filter
      if (cityFilter !== 'ALL' && entry.city !== cityFilter) return false;
      
      // Area filter
      if (areaFilter !== 'ALL' && entry.area !== areaFilter) return false;
      
      // Sales Executive filter
      if (salesExecutiveFilter !== 'ALL' && entry.createdBy !== salesExecutiveFilter) return false;
      
      // Log type filter
      if (logTypeFilter !== 'ALL') {
        if (logTypeFilter === 'VISIT' && !(entry.visitCount > 0)) return false;
        if (logTypeFilter === 'CALL' && !(entry.callCount > 0)) return false;
        if (logTypeFilter === 'CREATED' && !isInDateRange(entry.createdAt)) return false;
      }
      
      // Date range filter for stats (ignore when specifically filtering by created date)
      if (logTypeFilter !== 'CREATED' && (dateRange.startDate || dateRange.endDate)) {
        const entryDate = new Date(entry.createdAt);
        const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
        const endDate = dateRange.endDate ? new Date(dateRange.endDate + 'T23:59:59') : null;
        
        if (startDate && entryDate < startDate) return false;
        if (endDate && entryDate > endDate) return false;
      }
      
      return true;
    });
    
    return {
      totalEntries: filtered.length,
      visitsToday: filtered.reduce((sum, e) => sum + (e.visitCount || 0), 0),
      callsToday: filtered.reduce((sum, e) => sum + (e.callCount || 0), 0),
      logsThisMonth: filtered.reduce((sum, e) => sum + (e.visitCount || 0) + (e.callCount || 0), 0)
    };
  };

  const stats = getFilteredStats();

  const handleVisitClick = (entry) => {
    setSelectedEntry(entry);
    setShowVisitModal(true);
  };

  const handleCallClick = (entry) => {
    setSelectedEntry(entry);
    setShowCallModal(true);
  };

  const handleDetailsClick = (entry) => {
    setSelectedEntry(entry);
    setShowDetailsModal(true);
  };

  const handleEditClick = (entry) => {
    setSelectedEntry(entry);
    setShowEditForm(true);
  };

  const handleExport = async (exportType, password) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/verify-secret`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().token}`
        },
        body: JSON.stringify({ secretPassword: password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.hasAccess) {
        const dataToExport = exportType === 'filtered' ? filteredEntries : entries;
        
        if (dataToExport.length === 0) {
          toast.error('No data to export');
          return;
        }
        
        await exportSalesEntriesToExcel(dataToExport);
        toast.success(`Successfully exported ${dataToExport.length} sales entries to Excel`);
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
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">Sales Dashboard 📊</h1>
          <p className="text-gray-600">Hello <span className="font-semibold text-blue-600">{user?.username}</span>, manage your firm entries</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {user?.role === 'HOST' && (
            <button
              onClick={() => setShowExportModal(true)}
              disabled={isExporting}
              className={`px-4 sm:px-6 py-3 rounded-xl font-medium text-sm sm:text-base whitespace-nowrap flex items-center gap-2 shadow-sm transition-all ${
                isExporting 
                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                  : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
              }`}
            >
              {isExporting ? '⏳ Exporting...' : '📊 Export'}
            </button>
          )}
          <button
            onClick={() => setShowShareModal(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 sm:px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 font-medium text-sm sm:text-base whitespace-nowrap shadow-sm transition-all flex items-center gap-2"
          >
            🔗 Share
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium text-sm sm:text-base whitespace-nowrap shadow-sm transition-all"
          >
            + Add Entry
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl shadow-sm border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-blue-700 mb-1">Total Entries</h3>
              <p className="text-2xl sm:text-3xl font-bold text-blue-800">{stats.totalEntries}</p>
            </div>
            <div className="text-blue-500 text-2xl">🏢</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-xl shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-green-700 mb-1">Total Visits</h3>
              <p className="text-2xl sm:text-3xl font-bold text-green-800">{stats.visitsToday}</p>
            </div>
            <div className="text-green-500 text-2xl">👁️</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-6 rounded-xl shadow-sm border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-purple-700 mb-1">Total Calls</h3>
              <p className="text-2xl sm:text-3xl font-bold text-purple-800">{stats.callsToday}</p>
            </div>
            <div className="text-purple-500 text-2xl">📞</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 sm:p-6 rounded-xl shadow-sm border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-orange-700 mb-1">Total Logs</h3>
              <p className="text-2xl sm:text-3xl font-bold text-orange-800">{stats.logsThisMonth}</p>
            </div>
            <div className="text-orange-500 text-2xl">📋</div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>🔍</span> Search & Filters
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <label className="text-sm font-medium text-gray-700">🔍 Search</label>
            <div className="mt-3 flex flex-col gap-2">
              <select
                value={filterField}
                onChange={(e) => {
                  setFilterField(e.target.value);
                  setSearchQuery('');
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-400 transition-colors"
              >
                <option value="firmName">Firm Name</option>
                <option value="contactPerson1Name">Contact 1 Name</option>
                <option value="contactPerson1Number">Contact 1 Number</option>
                <option value="contactPerson2Name">Contact 2 Name</option>
                <option value="contactPerson2Number">Contact 2 Number</option>
                <option value="accountContactName">Account Name</option>
                <option value="accountContactNumber">Account Number</option>
                <option value="city">City</option>
                <option value="createdBy">Created By</option>
              </select>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                <input
                  type="text"
                  placeholder={`Search by ${
                    filterField === 'firmName'
                      ? 'firm name'
                      : filterField === 'contactPerson1Name'
                      ? 'contact 1 name'
                      : filterField === 'contactPerson1Number'
                      ? 'contact 1 number'
                      : filterField === 'contactPerson2Name'
                      ? 'contact 2 name'
                      : filterField === 'contactPerson2Number'
                      ? 'contact 2 number'
                      : filterField === 'accountContactName'
                      ? 'account name'
                      : filterField === 'accountContactNumber'
                      ? 'account number'
                      : filterField === 'city'
                      ? 'city'
                      : 'created by'
                  }...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
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
                {showDropdown && filteredOptions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredOptions.map((option, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setSearchQuery(option);
                          setShowDropdown(false);
                        }}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <label className="text-sm font-medium text-gray-700">🏙️ City & Area</label>
            <div className="mt-3 flex flex-col gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">City</p>
                <select
                  value={cityFilter}
                  onChange={(e) => {
                    setCityFilter(e.target.value);
                    // Reset area filter when city changes
                    if (e.target.value === 'ALL') {
                      setAreaFilter('ALL');
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-400 transition-colors"
                >
                  <option value="ALL">All Cities</option>
                  {uniqueCities.map((city, index) => (
                    <option key={index} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Area</p>
                <select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  disabled={cityFilter === 'ALL'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-400 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="ALL">{cityFilter === 'ALL' ? 'Select city first' : 'All Areas'}</option>
                  {uniqueAreas.map((area, index) => (
                    <option key={index} value={area}>{area}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {(user?.role === 'HOST' || user?.role === 'SALES_ADMIN') && (
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <label className="text-sm font-medium text-gray-700">👤 Sales Executive</label>
              <select
                value={salesExecutiveFilter}
                onChange={(e) => setSalesExecutiveFilter(e.target.value)}
                className="mt-3 w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-400 transition-colors"
              >
                <option value="ALL">All Sales Executives</option>
                {salesExecutives.map((executive, index) => (
                  <option key={index} value={executive}>{executive}</option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <label className="text-sm font-medium text-gray-700">🧭 Action Filter</label>
            <div className="mt-3 flex flex-col gap-3">
              <div>
                <p className="text-xs font-medium text-gray-500">Type</p>
                <select
                  value={logTypeFilter}
                  onChange={(e) => setLogTypeFilter(e.target.value)}
                  className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-400 transition-colors"
                >
                  <option value="ALL">All Logs</option>
                  <option value="VISIT">Visited</option>
                  <option value="CALL">Called</option>
                  <option value="CREATED">Created</option>
                </select>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Date range</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[120px]"
                    placeholder="Start Date"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[120px]"
                    placeholder="End Date"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            {(searchQuery || cityFilter !== 'ALL' || areaFilter !== 'ALL' || salesExecutiveFilter !== 'ALL' || logTypeFilter !== 'ALL' || dateRange.startDate || dateRange.endDate) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCityFilter('ALL');
                  setAreaFilter('ALL');
                  setSalesExecutiveFilter('ALL');
                  setLogTypeFilter('ALL');
                  setDateRange({ startDate: '', endDate: '' });
                }}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading entries...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No entries found</p>
          </div>
        ) : (
          <SalesEntryTable 
            entries={filteredEntries}
            onVisitClick={handleVisitClick}
            onCallClick={handleCallClick}
            onDetailsClick={handleDetailsClick}
            onEditClick={handleEditClick}
          />
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading entries...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No entries found</p>
            </div>
          ) : (
            filteredEntries.map(entry => (
              <SalesEntryCard
                key={entry.id}
                entry={entry}
                onVisitClick={handleVisitClick}
                onCallClick={handleCallClick}
                onDetailsClick={handleDetailsClick}
                onEditClick={handleEditClick}
              />
            ))
          )}
        </div>
      </div>

      {showAddForm && <AddSalesEntryForm onClose={() => setShowAddForm(false)} />}
      {showEditForm && selectedEntry && (
        <EditSalesEntryForm
          entry={selectedEntry}
          onClose={() => {
            setShowEditForm(false);
            setSelectedEntry(null);
          }}
        />
      )}
      {showVisitModal && selectedEntry && (
        <VisitLogModal
          entry={selectedEntry}
          onClose={() => {
            setShowVisitModal(false);
            setSelectedEntry(null);
          }}
        />
      )}
      {showCallModal && selectedEntry && (
        <CallLogModal
          entry={selectedEntry}
          onClose={() => {
            setShowCallModal(false);
            setSelectedEntry(null);
          }}
        />
      )}
      {showDetailsModal && selectedEntry && (
        <SalesEntryDetailsModal
          entry={selectedEntry}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedEntry(null);
          }}
        />
      )}
      {showShareModal && (
        <SalesShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          totalCount={entries.length}
          filteredCount={filteredEntries.length}
          title="Export Sales Entries to Excel"
        />
      )}
    </div>
  );
};

export default SalesDashboard;
