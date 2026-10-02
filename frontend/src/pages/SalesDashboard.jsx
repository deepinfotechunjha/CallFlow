import React, { useState, useEffect, useRef } from 'react';
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
import AnimatedCounter from '../components/AnimatedCounter';
import { exportSalesEntriesToExcel } from '../utils/excelExport';
import { animatePageHeader, animateStaggerCascade } from '../utils/animations';
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

  const headerRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    animatePageHeader(headerRef.current);
    animateStaggerCascade(statsRef.current, '> div');
  }, []);

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
        toast.error(data.error || 'Invalid secret password');
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
      {/* Top Header & Actions */}
      <div ref={headerRef} className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-[#FF2E46] uppercase tracking-wider bg-[#FFE8EB] px-2.5 py-0.5 rounded-md border border-[#FF2E46]/15">
              Sales &amp; Dealer Network
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Sales Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your firm directory, track field visits, and log client telecalling activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium text-xs sm:text-sm bg-[#2C2C2C]/5 hover:bg-[#2C2C2C]/10 text-[#2C2C2C] border border-[#2C2C2C]/20 shadow-xs transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share Intake
          </button>

          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-xs sm:text-sm text-[#FF2E46] bg-[#FF2E46]/10 hover:bg-[#FF2E46]/20 border border-[#FF2E46]/25 shadow-xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Firm Entry
          </button>
        </div>
      </div>

      {/* Enterprise Metric Cards */}
      <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Entries</p>
          <p className="text-2xl font-bold text-gray-900 mt-2"><AnimatedCounter value={stats.totalEntries} /></p>
          <p className="text-[11px] text-gray-400 mt-0.5">Directory records</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Visits</p>
          <p className="text-2xl font-bold text-gray-900 mt-2"><AnimatedCounter value={stats.totalVisits} /></p>
          <p className="text-[11px] text-gray-400 mt-0.5">Physical visits logged</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Calls</p>
          <p className="text-2xl font-bold text-gray-900 mt-2"><AnimatedCounter value={stats.totalCalls} /></p>
          <p className="text-[11px] text-gray-400 mt-0.5">Calls connected</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs border-l-4 border-l-amber-500">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-700">Filtered Visits</p>
          <p className="text-2xl font-bold text-amber-600 mt-2"><AnimatedCounter value={stats.filteredVisits} /></p>
          <p className="text-[11px] text-amber-600/70 mt-0.5">In active filter</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs border-l-4 border-l-emerald-500">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-700">Filtered Calls</p>
          <p className="text-2xl font-bold text-emerald-600 mt-2"><AnimatedCounter value={stats.filteredCalls} /></p>
          <p className="text-[11px] text-emerald-600/70 mt-0.5">In active filter</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50/75 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
          <h2 className="text-gray-900 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter &amp; Query Directory
          </h2>
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
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-md font-medium transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

            {/* ── Card 1: Search ── */}
            <div className="bg-gray-50/50 rounded-lg border border-gray-200 p-3.5 flex flex-col gap-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Search</p>
              <select
                value={filterField}
                onChange={(e) => { setFilterField(e.target.value); setSearchQuery(''); setHighlightedIndex(-1); }}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/15 focus:border-[#FF2E46] bg-white text-gray-800"
              >
                <option value="firmName">Firm Name</option>
                <option value="anyName">Any Name (All Contacts)</option>
                <option value="anyNumber">Any Number (All Contacts)</option>
                <option value="gstNo">GST Number</option>
                <option value="accountContactName">Account Name</option>
                <option value="accountContactNumber">Account Number</option>
              </select>
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search ${
                    filterField === 'firmName' ? 'firm name'
                    : filterField === 'anyName' ? 'contact name'
                    : filterField === 'anyNumber' ? 'contact number'
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
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/15 focus:border-[#FF2E46] bg-white text-gray-800"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm font-bold">×</button>
                )}
                {showDropdown && filteredOptions.length > 0 && (
                  <div className={`absolute z-50 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto ${
                    dropdownAbove ? 'bottom-full mb-1' : 'top-full mt-1'
                  }`}>
                    {filteredOptions.map((option, index) => (
                      <div
                        key={index}
                        onMouseDown={(e) => { e.preventDefault(); setSearchQuery(option); setShowDropdown(false); setHighlightedIndex(-1); }}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`px-3 py-1.5 cursor-pointer text-xs text-gray-700 border-b border-gray-100 last:border-b-0 ${index === highlightedIndex ? 'bg-[#FFE8EB] text-[#FF2E46] font-medium' : 'hover:bg-gray-50'}`}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Card 2: City & Area ── */}
            <div className="bg-gray-50/50 rounded-lg border border-gray-200 p-3.5 flex flex-col gap-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Location</p>
              <div>
                <select
                  value={cityFilter}
                  onChange={(e) => { setCityFilter(e.target.value); if (e.target.value === 'ALL') setAreaFilter('ALL'); }}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/15 focus:border-[#FF2E46] bg-white text-gray-800"
                >
                  <option value="ALL">All Cities</option>
                  {uniqueCities.map((city, i) => <option key={i} value={city}>{city}</option>)}
                </select>
              </div>
              <div>
                <select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  disabled={cityFilter === 'ALL'}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/15 focus:border-[#FF2E46] bg-white text-gray-800 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="ALL">{cityFilter === 'ALL' ? 'Select city first' : 'All Areas'}</option>
                  {uniqueAreas.map((area, i) => <option key={i} value={area}>{area}</option>)}
                </select>
              </div>
            </div>

            {/* ── Card 3: Sales Executive + Entry Filter ── */}
            {(user?.role === 'HOST' || user?.role === 'SALES_ADMIN') ? (
              <div className="bg-gray-50/50 rounded-lg border border-gray-200 p-3.5 flex flex-col gap-2">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Representative</p>
                <select
                  value={salesExecutiveFilter}
                  onChange={(e) => setSalesExecutiveFilter(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/15 focus:border-[#FF2E46] bg-white text-gray-800"
                >
                  <option value="ALL">All Sales Executives</option>
                  {salesExecutives.map((ex, i) => <option key={i} value={ex}>{ex}</option>)}
                </select>
                <div>
                  <select
                    value={entryFilter}
                    onChange={(e) => setEntryFilter(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/15 focus:border-[#FF2E46] bg-white text-gray-800"
                  >
                    <option value="ALL">All Activities</option>
                    <option value="CREATED_BY">Created By</option>
                    <option value="VISITED_BY">Visited By</option>
                    <option value="CALLED_BY">Called By</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="hidden xl:block" />
            )}

            {/* ── Card 4: Date Range ── */}
            <div className="bg-gray-50/50 rounded-lg border border-gray-200 p-3.5 flex flex-col gap-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date Period</p>
              <div>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/15 focus:border-[#FF2E46] bg-white text-gray-800"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/15 focus:border-[#FF2E46] bg-white text-gray-800"
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
