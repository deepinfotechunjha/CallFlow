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
  const [entryFilter, setEntryFilter] = useState('ALL');
  const [filterField, setFilterField] = useState('firmName');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownAbove, setDropdownAbove] = useState(false);
  const searchInputRef = React.useRef(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const { user, users, fetchUsers } = useAuthStore();
  const { entries, fetchEntries, fetchSalesLogs, salesLogs, loading } = useSalesStore();
  const [salesUsernames, setSalesUsernames] = useState([]);

  useEffect(() => {
    fetchEntries();
    fetchSalesLogs();

    if (user?.role === 'HOST' || user?.role === 'SALES_ADMIN') {
      fetchUsers();
      const token = useAuthStore.getState().token;
      const baseUrl = import.meta.env.VITE_API_URL;
      fetch(`${baseUrl}/users`, { headers: { 'Authorization': `Bearer ${token}` } })
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
  }, []);

  // Remove the separate date range refetch - all filtering is now client-side

  // For multi-field modes, no dropdown suggestions (too many combinations)
  // For single-field modes, show unique values filtered by query
  const MULTI_FIELD_MODES = ['anyName', 'anyNumber'];

  const getUniqueOptions = () => {
    if (MULTI_FIELD_MODES.includes(filterField)) return [];
    const options = new Set();
    entries.forEach(entry => {
      const value = entry[filterField];
      if (value) options.add(value);
    });
    return Array.from(options).sort();
  };

  const uniqueOptions = getUniqueOptions();
  const filteredOptions = uniqueOptions.filter(option => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const v = option.toLowerCase();
    // name fields: contains; number/gst/other fields: startsWith
    if (['firmName', 'contactPerson1Name', 'contactPerson2Name', 'accountContactName', 'city', 'createdBy'].includes(filterField)) {
      return v.includes(q);
    }
    return v.startsWith(q);
  });

  // Core match function used by both filteredEntries and stats
  const matchesSearch = (entry) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (filterField === 'anyName') {
      const names = [
        entry.contactPerson1Name,
        entry.contactPerson2Name,
        entry.accountContactName
      ].filter(Boolean).map(n => n.toLowerCase());
      return names.some(n => n.includes(q));
    }
    if (filterField === 'anyNumber') {
      const numbers = [
        entry.contactPerson1Number,
        entry.contactPerson2Number,
        entry.accountContactNumber
      ].filter(Boolean).map(n => n.toLowerCase());
      return numbers.some(n => n.startsWith(q));
    }
    const value = entry[filterField];
    if (!value) return false;
    const v = value.toLowerCase();
    // name-like fields: contains; others (numbers, gst, city, createdBy): startsWith
    if (['firmName', 'contactPerson1Name', 'contactPerson2Name', 'accountContactName', 'city', 'createdBy'].includes(filterField)) {
      return v.includes(q);
    }
    return v.startsWith(q);
  };

  const isInDateRange = (dateString) => {
    if (!dateString) return false;
    if (!dateRange.startDate && !dateRange.endDate) return true;
    const d = new Date(dateString);
    if (dateRange.startDate) {
      const start = new Date(dateRange.startDate);
      start.setHours(0, 0, 0, 0);
      if (d < start) return false;
    }
    if (dateRange.endDate) {
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  };

  const isDateFilterActive = dateRange.startDate || dateRange.endDate;

  const filteredEntries = entries.filter(entry => {
    const targetUser = salesExecutiveFilter !== 'ALL' ? salesExecutiveFilter : null;

    if (entryFilter === 'CREATED_BY') {
      if (targetUser && entry.createdBy !== targetUser) return false;
      if (isDateFilterActive && !isInDateRange(entry.createdAt)) return false;
    }
    if (entryFilter === 'VISITED_BY') {
      const entryLogs = salesLogs.filter(l => l.salesEntryId === entry.id && l.logType === 'VISIT');
      if (targetUser) {
        const userLogs = entryLogs.filter(l => l.loggedBy === targetUser);
        if (userLogs.length === 0) return false;
        if (isDateFilterActive && !userLogs.some(l => isInDateRange(l.loggedAt))) return false;
      } else {
        if (entryLogs.length === 0) return false;
        if (isDateFilterActive && !entryLogs.some(l => isInDateRange(l.loggedAt))) return false;
      }
    }
    if (entryFilter === 'CALLED_BY') {
      const entryLogs = salesLogs.filter(l => l.salesEntryId === entry.id && l.logType === 'CALL');
      if (targetUser) {
        const userLogs = entryLogs.filter(l => l.loggedBy === targetUser);
        if (userLogs.length === 0) return false;
        if (isDateFilterActive && !userLogs.some(l => isInDateRange(l.loggedAt))) return false;
      } else {
        if (entryLogs.length === 0) return false;
        if (isDateFilterActive && !entryLogs.some(l => isInDateRange(l.loggedAt))) return false;
      }
    }
    if (entryFilter === 'ALL') {
      if (salesExecutiveFilter !== 'ALL' && entry.createdBy !== salesExecutiveFilter) return false;
      if (isDateFilterActive && !isInDateRange(entry.createdAt)) return false;
    }

    // Search filter
    if (!matchesSearch(entry)) return false;
    // City filter
    if (cityFilter !== 'ALL' && entry.city !== cityFilter) return false;
    // Area filter
    if (areaFilter !== 'ALL' && entry.area !== areaFilter) return false;

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

  // Per-entry filtered log count (respects salesExecutive + date)
  const getFilteredLogCount = (entryId, logType) =>
    salesLogs.filter(l =>
      l.salesEntryId === entryId &&
      l.logType === logType &&
      (entryFilter === 'CREATED_BY' || salesExecutiveFilter === 'ALL' || l.loggedBy === salesExecutiveFilter) &&
      (!isDateFilterActive || isInDateRange(l.loggedAt))
    ).length;

  const stats = {
    totalEntries: filteredEntries.length,
    totalVisits: filteredEntries.reduce((sum, e) => sum + (e.visitCount || 0), 0),
    totalCalls:  filteredEntries.reduce((sum, e) => sum + (e.callCount  || 0), 0),
    filteredVisits: filteredEntries.reduce((sum, e) => sum + getFilteredLogCount(e.id, 'VISIT'), 0),
    filteredCalls:  filteredEntries.reduce((sum, e) => sum + getFilteredLogCount(e.id, 'CALL'),  0),
  };

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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-secret`, {
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

        // Fetch full logs for Sheet 2
        const baseUrl = import.meta.env.VITE_API_URL;
        const logsRes = await fetch(`${baseUrl}/sales-logs/full`, {
          headers: { 'Authorization': `Bearer ${useAuthStore.getState().token}` }
        });
        const fullLogs = logsRes.ok ? await logsRes.json() : [];

        await exportSalesEntriesToExcel(dataToExport, fullLogs);
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
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
              <p className="text-2xl sm:text-3xl font-bold text-green-800">{stats.totalVisits}</p>
            </div>
            <div className="text-green-500 text-2xl">👁️</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-6 rounded-xl shadow-sm border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-purple-700 mb-1">Total Calls</h3>
              <p className="text-2xl sm:text-3xl font-bold text-purple-800">{stats.totalCalls}</p>
            </div>
            <div className="text-purple-500 text-2xl">📞</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 sm:p-6 rounded-xl shadow-sm border border-teal-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-teal-700 mb-1">Filtered Visits</h3>
              <p className="text-2xl sm:text-3xl font-bold text-teal-800">{stats.filteredVisits}</p>
            </div>
            <div className="text-teal-500 text-2xl">🔍👁️</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 sm:p-6 rounded-xl shadow-sm border border-pink-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-pink-700 mb-1">Filtered Calls</h3>
              <p className="text-2xl sm:text-3xl font-bold text-pink-800">{stats.filteredCalls}</p>
            </div>
            <div className="text-pink-500 text-2xl">🔍📞</div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 flex items-center justify-between">
          <h2 className="text-white font-semibold text-base flex items-center gap-2">🔍 Search & Filters</h2>
          {(searchQuery || cityFilter !== 'ALL' || areaFilter !== 'ALL' || salesExecutiveFilter !== 'ALL' || entryFilter !== 'ALL' || dateRange.startDate || dateRange.endDate) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCityFilter('ALL');
                setAreaFilter('ALL');
                setSalesExecutiveFilter('ALL');
                setEntryFilter('ALL');
                setDateRange({ startDate: '', endDate: '' });
              }}
              className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              ✕ Clear All
            </button>
          )}
        </div>

        <div className="p-4 sm:p-5">
          {/* Responsive grid: 1 col → 2 col → 4 col */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

            {/* ── Card 1: Search ── */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex flex-col gap-2 overflow-visible">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">🔍 Search</p>
              <select
                value={filterField}
                onChange={(e) => { setFilterField(e.target.value); setSearchQuery(''); setHighlightedIndex(-1); }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="firmName">Firm Name</option>
                <option value="anyName">Any Name (All Contacts)</option>
                <option value="anyNumber">Any Number (All Contacts)</option>
                <option value="gstNo">GST Number</option>
                <option value="accountContactName">Account Name</option>
                <option value="accountContactNumber">Account Number</option>
              </select>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder={`Search by ${
                    filterField === 'firmName' ? 'firm name'
                    : filterField === 'anyName' ? 'any contact name'
                    : filterField === 'anyNumber' ? 'any contact number'
                    : filterField === 'gstNo' ? 'GST number'
                    : filterField === 'accountContactName' ? 'account name'
                    : filterField === 'accountContactNumber' ? 'account number'
                    : filterField === 'city' ? 'city' : 'created by'
                  }...`}
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setHighlightedIndex(-1); }}
                  onFocus={() => {
                    if (searchInputRef.current) {
                      const rect = searchInputRef.current.getBoundingClientRect();
                      const spaceBelow = window.innerHeight - rect.bottom;
                      setDropdownAbove(spaceBelow < 220);
                    }
                    setShowDropdown(true);
                  }}
                  onBlur={() => setShowDropdown(false)}
                  ref={searchInputRef}
                  onKeyDown={(e) => {
                    if (!showDropdown || filteredOptions.length === 0) return;
                    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex(i => Math.min(i + 1, filteredOptions.length - 1)); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(i => Math.max(i - 1, 0)); }
                    else if (e.key === 'Enter') { e.preventDefault(); const idx = highlightedIndex >= 0 ? highlightedIndex : 0; setSearchQuery(filteredOptions[idx]); setShowDropdown(false); setHighlightedIndex(-1); }
                    else if (e.key === 'Tab' && filteredOptions.length === 1) { e.preventDefault(); setSearchQuery(filteredOptions[0]); setShowDropdown(false); setHighlightedIndex(-1); }
                    else if (e.key === 'Escape') { setShowDropdown(false); setHighlightedIndex(-1); }
                  }}
                  className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                )}
                {showDropdown && filteredOptions.length > 0 && (
                  <div className={`absolute z-50 left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-xl max-h-52 overflow-y-auto ${
                    dropdownAbove ? 'bottom-full mb-1' : 'top-full mt-1'
                  }`}>
                    {filteredOptions.map((option, index) => (
                      <div
                        key={index}
                        onMouseDown={(e) => { e.preventDefault(); setSearchQuery(option); setShowDropdown(false); setHighlightedIndex(-1); }}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`px-4 py-2 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-b-0 ${index === highlightedIndex ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Card 2: City & Area ── */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">🏙️ City & Area</p>
              <div>
                <p className="text-xs text-gray-400 mb-1">City</p>
                <select
                  value={cityFilter}
                  onChange={(e) => { setCityFilter(e.target.value); if (e.target.value === 'ALL') setAreaFilter('ALL'); }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="ALL">All Cities</option>
                  {uniqueCities.map((city, i) => <option key={i} value={city}>{city}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Area</p>
                <select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  disabled={cityFilter === 'ALL'}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="ALL">{cityFilter === 'ALL' ? 'Select city first' : 'All Areas'}</option>
                  {uniqueAreas.map((area, i) => <option key={i} value={area}>{area}</option>)}
                </select>
              </div>
            </div>

            {/* ── Card 3: Sales Executive + Entry Filter (HOST/SALES_ADMIN only) ── */}
            {(user?.role === 'HOST' || user?.role === 'SALES_ADMIN') ? (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex flex-col gap-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">👤 Sales Executive</p>
                <select
                  value={salesExecutiveFilter}
                  onChange={(e) => setSalesExecutiveFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="ALL">All Sales Executives</option>
                  {salesExecutives.map((ex, i) => <option key={i} value={ex}>{ex}</option>)}
                </select>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Filter by activity</p>
                  <select
                    value={entryFilter}
                    onChange={(e) => setEntryFilter(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="ALL">All</option>
                    <option value="CREATED_BY">Created By</option>
                    <option value="VISITED_BY">Visited By</option>
                    <option value="CALLED_BY">Called By</option>
                  </select>
                </div>
              </div>
            ) : (
              /* placeholder so date card stays in col-4 on xl */
              <div className="hidden xl:block" />
            )}

            {/* ── Card 4: Date Range ── */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">📅 Date Range</p>
              <div>
                <p className="text-xs text-gray-400 mb-1">From</p>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">To</p>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

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
            salesLogs={salesLogs}
            salesExecutiveFilter={salesExecutiveFilter}
            dateRange={dateRange}
            entryFilter={entryFilter}
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
