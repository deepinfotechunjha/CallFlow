import React, { useState, useEffect } from 'react';
import useOrderStore from '../store/orderStore';
import useAuthStore from '../store/authStore';
import AddOrderModal from '../components/AddOrderModal';
import OrderHoldModal from '../components/OrderHoldModal';
import OrderBillModal from '../components/OrderBillModal';
import OrderCompleteModal from '../components/OrderCompleteModal';
import OrderRevertModal from '../components/OrderRevertModal';
import OrderEditModal from '../components/OrderEditModal';
import OrderDetailModal from '../components/OrderDetailModal';
import SalesShareModal from '../components/SalesShareModal';
import ExportModal from '../components/ExportModal';
import { exportOrdersToExcel } from '../utils/excelExport';
import toast from 'react-hot-toast';

const ORDER_ACTION_ROLES = ['HOST', 'ACCOUNTANT', 'SALES_ADMIN'];
const ALL_ORDER_ROLES = ['HOST', 'ACCOUNTANT', 'SALES_ADMIN'];
const PERSONAL_ORDER_ROLES = ['SALES_EXECUTIVE', 'COMPANY_PAYROLL'];

const STATUS_BUTTONS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'BILLED', label: 'Billed' },
  { value: 'COMPLETED', label: 'Transported' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_BADGE = {
  PENDING:   'bg-gray-100 text-gray-700',
  ON_HOLD:   'bg-yellow-100 text-yellow-700',
  BILLED:    'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_LABEL = {
  PENDING:   'Pending',
  ON_HOLD:   'On Hold',
  BILLED:    'Billed',
  COMPLETED: 'Transported',
  CANCELLED: 'Cancelled',
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const OrdersPage = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createdByFilter, setCreatedByFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const { orders, loading, fetchOrders, cancelOrder } = useOrderStore();
  const { user, users, fetchUsers } = useAuthStore();

  const canAction = ORDER_ACTION_ROLES.includes(user?.role);
  const canSeeAll = ALL_ORDER_ROLES.includes(user?.role);
  const canCancel = user?.role !== 'COMPANY_BASED_ACCESS';
  const isReadOnly = user?.role === 'COMPANY_BASED_ACCESS';

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
        const dataToExport = exportType === 'filtered' ? filteredOrders : orders;
        if (dataToExport.length === 0) {
          toast.error('No data to export');
          return;
        }
        await exportOrdersToExcel(dataToExport);
        toast.success(`Successfully exported ${dataToExport.length} orders to Excel`);
        setShowExportModal(false);
      } else {
        toast.error('Invalid secret password');
      }
    } catch (error) {
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (canSeeAll) fetchUsers();
  }, []);

  useEffect(() => {
    // Always fetch all orders; client-side filtering handles status
    const filters = {};
    if (dateRange.startDate) filters.startDate = dateRange.startDate;
    if (dateRange.endDate) filters.endDate = dateRange.endDate;
    fetchOrders(filters);
  }, [dateRange.startDate, dateRange.endDate]);

  const openModal = (type, order) => {
    setSelectedOrder(order);
    if (type === 'hold') setShowHoldModal(true);
    else if (type === 'bill') setShowBillModal(true);
    else if (type === 'complete') setShowCompleteModal(true);
    else if (type === 'revert') setShowRevertModal(true);
    else if (type === 'edit') setShowEditModal(true);
  };

  const closeAll = () => {
    setShowHoldModal(false);
    setShowBillModal(false);
    setShowCompleteModal(false);
    setShowRevertModal(false);
    setShowEditModal(false);
    setSelectedOrder(null);
    setShowDetailModal(false);
  };

  const openDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const closeDetail = () => {
    setShowDetailModal(false);
  };

  const handleCancel = async (order) => {
    setIsCancelling(true);
    await cancelOrder(order.id);
    setIsCancelling(false);
    setConfirmCancel(null);
  };

  const filteredOrders = orders.filter(o => {
    if (PERSONAL_ORDER_ROLES.includes(user?.role) && o.createdBy !== user?.username) return false;
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (createdByFilter !== 'ALL' && o.createdBy !== createdByFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inHolds = o.holds?.some(h => h.remark?.toLowerCase().includes(q) || h.heldBy?.toLowerCase().includes(q));
      const match =
        o.salesEntry?.firmName?.toLowerCase().includes(q) ||
        o.salesEntry?.city?.toLowerCase().includes(q) ||
        o.salesEntry?.area?.toLowerCase().includes(q) ||
        o.salesEntry?.gstNo?.toLowerCase().includes(q) ||
        o.salesEntry?.contactPerson1Name?.toLowerCase().includes(q) ||
        o.salesEntry?.contactPerson1Number?.includes(q) ||
        o.orderRemark?.toLowerCase().includes(q) ||
        o.calledBy?.toLowerCase().includes(q) ||
        o.createdBy?.toLowerCase().includes(q) ||
        o.status?.toLowerCase().includes(q) ||
        o.billingRemark?.toLowerCase().includes(q) ||
        o.billedBy?.toLowerCase().includes(q) ||
        o.completionRemark?.toLowerCase().includes(q) ||
        o.completedBy?.toLowerCase().includes(q) ||
        inHolds;
      if (!match) return false;
    }
    return true;
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.direction === 'desc') direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    if (sortConfig.direction === 'asc') return '↑';
    if (sortConfig.direction === 'desc') return '↓';
    return '↕️';
  };

  const uniqueCreators = [...new Set(orders.map(o => o.createdBy))].sort();

  const stats = {
    total: filteredOrders.length,
    pending: filteredOrders.filter(o => o.status === 'PENDING').length,
    onHold: filteredOrders.filter(o => o.status === 'ON_HOLD').length,
    billed: filteredOrders.filter(o => o.status === 'BILLED').length,
    completed: filteredOrders.filter(o => o.status === 'COMPLETED').length,
    cancelled: filteredOrders.filter(o => o.status === 'CANCELLED').length,
  };

  const clearFilters = () => {
    setStatusFilter('ALL');
    setCreatedByFilter('ALL');
    setDateRange({ startDate: '', endDate: '' });
    setSearchQuery('');
  };

  const hasFilters = statusFilter !== 'ALL' || createdByFilter !== 'ALL' || dateRange.startDate || dateRange.endDate || searchQuery.trim();

  let sortedOrders = [...filteredOrders];
  if (sortConfig.key && sortConfig.direction) {
    sortedOrders.sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'firm': aVal = a.salesEntry?.firmName || ''; bVal = b.salesEntry?.firmName || ''; break;
        case 'remark': aVal = a.orderRemark || ''; bVal = b.orderRemark || ''; break;
        case 'calledBy': aVal = a.calledBy || ''; bVal = b.calledBy || ''; break;
        case 'status': aVal = a.status || ''; bVal = b.status || ''; break;
        case 'createdBy': aVal = a.createdBy || ''; bVal = b.createdBy || ''; break;
        case 'date': aVal = new Date(a.createdAt); bVal = new Date(b.createdAt); break;
        default: return 0;
      }
      if (aVal instanceof Date) return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 bg-white p-5 sm:p-6 rounded-xl border border-[#E0E2E5] shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#FF2E46] bg-[#FFE8EB] px-2.5 py-1 rounded-md mb-2">
            Operations &bull; Order Fulfillment
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C]">
            Orders &amp; Dispatch
          </h1>
          <p className="text-sm text-[#666666] mt-1">
            Track customer purchase orders, manage billing, and update dispatch logistics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {user?.role === 'HOST' && (
            <button
              onClick={() => setShowExportModal(true)}
              disabled={isExporting}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm border transition-all ${
                isExporting
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white border-[#E0E2E5] text-[#2C2C2C] hover:border-[#FF2E46] hover:text-[#FF2E46] hover:bg-[#FFE8EB]/20 shadow-xs'
              }`}
            >
              <svg className="w-4 h-4 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {isExporting ? 'Exporting...' : 'Export Excel'}
            </button>
          )}
          {!isReadOnly && (
            <button
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm bg-[#2C2C2C] hover:bg-[#1A1A1A] text-white shadow-xs transition-all"
            >
              <svg className="w-4 h-4 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Intake
            </button>
          )}
          {!isReadOnly && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm text-white bg-[#FF2E46] hover:bg-[#FF5A71] shadow-xs hover:shadow-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Order
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-white border border-[#E0E2E5] rounded-xl p-3.5 text-center shadow-xs">
          <p className="text-2xl font-extrabold text-[#2C2C2C]">{stats.total}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[#666666] mt-1">Total</p>
        </div>
        <div className="bg-white border border-[#E0E2E5] rounded-xl p-3.5 text-center shadow-xs">
          <p className="text-2xl font-extrabold text-[#FF2E46]">{stats.pending}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[#666666] mt-1">Pending</p>
        </div>
        <div className="bg-white border border-[#E0E2E5] rounded-xl p-3.5 text-center shadow-xs">
          <p className="text-2xl font-extrabold text-amber-600">{stats.onHold}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[#666666] mt-1">On Hold</p>
        </div>
        <div className="bg-white border border-[#E0E2E5] rounded-xl p-3.5 text-center shadow-xs">
          <p className="text-2xl font-extrabold text-[#2C2C2C]">{stats.billed}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[#666666] mt-1">Billed</p>
        </div>
        <div className="bg-white border border-[#E0E2E5] rounded-xl p-3.5 text-center shadow-xs">
          <p className="text-2xl font-extrabold text-emerald-600">{stats.completed}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[#666666] mt-1">Transported</p>
        </div>
        <div className="bg-white border border-[#E0E2E5] rounded-xl p-3.5 text-center shadow-xs">
          <p className="text-2xl font-extrabold text-red-600">{stats.cancelled}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[#666666] mt-1">Cancelled</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-xs border border-[#E0E2E5] p-4 sm:p-5 mb-6 space-y-3.5">
        {/* Search + Created By + Date Range */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search orders..."
              className="w-full px-3.5 py-2 border border-[#E0E2E5] rounded-lg text-xs sm:text-sm bg-[#F8F9FA] focus:bg-white focus:ring-2 focus:ring-[#FF2E46]/20 focus:border-[#FF2E46] text-[#2C2C2C] transition-all"
            />
          </div>

          {canSeeAll && (
            <div>
              <select
                value={createdByFilter}
                onChange={e => setCreatedByFilter(e.target.value)}
                className="w-full px-3.5 py-2 border border-[#E0E2E5] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/20 focus:border-[#FF2E46] bg-white text-[#2C2C2C]"
              >
                <option value="ALL">All Users</option>
                {uniqueCreators.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          <div className={`flex items-center gap-2 ${canSeeAll ? 'sm:col-span-2 lg:col-span-2' : 'sm:col-span-1 lg:col-span-3'}`}>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={e => setDateRange(p => ({ ...p, startDate: e.target.value }))}
              className="flex-1 px-3 py-2 border border-[#E0E2E5] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/20 focus:border-[#FF2E46] bg-white text-[#2C2C2C]"
            />
            <span className="text-[#666666] text-xs font-medium">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={e => setDateRange(p => ({ ...p, endDate: e.target.value }))}
              className="flex-1 px-3 py-2 border border-[#E0E2E5] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#FF2E46]/20 focus:border-[#FF2E46] bg-white text-[#2C2C2C]"
            />
          </div>
        </div>

        {/* Status buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#F0F2F5]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#666666] mr-1">Status:</span>
          {STATUS_BUTTONS.map(({ value, label }) => {
            const active = statusFilter === value;
            return (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#FF2E46] text-white shadow-xs'
                    : 'bg-[#F8F9FA] text-[#666666] border border-[#E0E2E5] hover:border-[#FF2E46] hover:text-[#FF2E46]'
                }`}
              >
                {label}
              </button>
            );
          })}
          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto text-xs text-[#FF2E46] hover:underline font-bold">
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden xl:block">
        {loading ? (
          <div className="text-center py-16 bg-white rounded-xl border border-[#E0E2E5]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF2E46] mx-auto mb-3"></div>
            <p className="text-[#666666] font-medium text-sm">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-[#E0E2E5]">
            <p className="text-[#666666] font-semibold text-sm">No orders found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xs border border-[#E0E2E5] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E0E2E5]">
                <thead className="bg-[#2C2C2C]">
                  <tr>
                    <th className="px-3.5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-10 border-r border-[#3D3D3D]">#</th>
                    <th onClick={() => handleSort('firm')} className="px-3.5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1A1A1A] transition-colors whitespace-nowrap border-r border-[#3D3D3D]">
                      <div className="flex items-center gap-1">Firm {getSortIcon('firm')}</div>
                    </th>
                    {user?.role === 'HOST' && (
                      <th className="px-3.5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap border-r border-[#3D3D3D]">Brand</th>
                    )}
                    <th onClick={() => handleSort('remark')} className="px-3.5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1A1A1A] transition-colors whitespace-nowrap border-r border-[#3D3D3D]">
                      <div className="flex items-center gap-1">Order Remark {getSortIcon('remark')}</div>
                    </th>
                    <th onClick={() => handleSort('calledBy')} className="px-3.5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1A1A1A] transition-colors whitespace-nowrap border-r border-[#3D3D3D]">
                      <div className="flex items-center gap-1">Called By {getSortIcon('calledBy')}</div>
                    </th>
                    <th className="px-3.5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap border-r border-[#3D3D3D]">Dispatch From</th>
                    <th onClick={() => handleSort('status')} className="px-3.5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1A1A1A] transition-colors whitespace-nowrap border-r border-[#3D3D3D]">
                      <div className="flex items-center gap-1">Status {getSortIcon('status')}</div>
                    </th>
                    <th onClick={() => handleSort('createdBy')} className="px-3.5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1A1A1A] transition-colors whitespace-nowrap border-r border-[#3D3D3D]">
                      <div className="flex items-center gap-1">Created By {getSortIcon('createdBy')}</div>
                    </th>
                    <th onClick={() => handleSort('date')} className="px-3.5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1A1A1A] transition-colors whitespace-nowrap border-r border-[#3D3D3D]">
                      <div className="flex items-center gap-1">Created At {getSortIcon('date')}</div>
                    </th>
                    <th className="px-3.5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#F0F2F5]">
                  {sortedOrders.map((order, index) => {
                    return (
                    <React.Fragment key={order.id}>
                      <tr
                      className={`cursor-pointer hover:bg-[#F8F9FA] transition-colors align-top ${order.status === 'CANCELLED' ? 'opacity-70 bg-gray-50/50' : ''}`}
                      onClick={() => openDetail(order)}
                    >
                        <td className="px-3.5 py-3.5 text-xs font-medium text-gray-500">{index + 1}</td>
                        <td className="px-3.5 py-3.5">
                          <p className={`font-semibold text-xs sm:text-sm text-[#2C2C2C] ${order.status === 'CANCELLED' ? 'line-through' : ''}`}>{order.salesEntry?.firmName}</p>
                          <p className="text-xs text-[#666666] mt-0.5">{order.salesEntry?.city}{order.salesEntry?.area ? ` · ${order.salesEntry.area}` : ''}</p>
                        </td>
                        {user?.role === 'HOST' && (
                          <td className="px-3.5 py-3.5 text-xs font-semibold text-[#FF2E46] whitespace-nowrap">
                            {order.brandName || '—'}
                          </td>
                        )}
                        <td className="px-3.5 py-3.5 text-xs sm:text-sm text-[#2C2C2C] max-w-[200px]">
                          <p className="break-words whitespace-pre-wrap" title={order.orderRemark}>{order.orderRemark || '—'}</p>
                        </td>
                        <td className="px-3.5 py-3.5 text-xs sm:text-sm text-[#666666] whitespace-nowrap">{order.calledBy || '—'}</td>
                        <td className="px-3.5 py-3.5">
                          {order.dispatchFrom ? (
                            <div className="flex flex-wrap gap-1">
                              {order.dispatchFrom.split(',').map(loc => (
                                <span key={loc} className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                                  {loc.trim()}
                                </span>
                              ))}
                            </div>
                          ) : <span className="text-gray-400 text-xs">—</span>}
                        </td>
                        <td className="px-3.5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                            order.status === 'PENDING' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                            order.status === 'ON_HOLD' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            order.status === 'BILLED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {STATUS_LABEL[order.status] || order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3.5 py-3.5 text-xs sm:text-sm text-[#666666] whitespace-nowrap">{order.createdBy}</td>
                        <td className="px-3.5 py-3.5 text-xs text-[#666666] whitespace-nowrap">
                          <div>{formatDate(order.createdAt)}</div>
                        </td>
                        <td className="px-3.5 py-3.5">
                          <ActionButtons
                            order={order}
                            canAction={canAction}
                            canCancel={canCancel}
                            onHold={() => openModal('hold', order)}
                            onBill={() => openModal('bill', order)}
                            onComplete={() => openModal('complete', order)}
                            onCancel={() => setConfirmCancel(order)}
                            onRevert={() => openModal('revert', order)}
                            onEdit={() => openModal('edit', order)}
                            isHost={user?.role === 'HOST'}
                            isReadOnly={isReadOnly}
                          />
                        </td>
                      </tr>
                    </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="xl:hidden space-y-3">
        {loading ? (
          <div className="text-center py-12 bg-white rounded-xl border border-[#E0E2E5]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF2E46] mx-auto mb-3"></div>
            <p className="text-[#666666] text-sm">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-[#E0E2E5]">
            <p className="text-[#666666] text-sm font-medium">No orders found</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order.id}
              onClick={() => openDetail(order)}
              className={`cursor-pointer bg-white rounded-xl border p-4 ${order.status === 'CANCELLED' ? 'opacity-70 border-red-200 bg-red-50/20' : 'border-[#E0E2E5]'} hover:border-[#FF2E46]/40 shadow-xs transition`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className={`font-bold text-sm text-[#2C2C2C] ${order.status === 'CANCELLED' ? 'line-through' : ''}`}>{order.salesEntry?.firmName}</p>
                  <p className="text-xs text-[#666666]">{order.salesEntry?.city}{order.salesEntry?.area ? ` · ${order.salesEntry.area}` : ''}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                  order.status === 'PENDING' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                  order.status === 'ON_HOLD' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  order.status === 'BILLED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {STATUS_LABEL[order.status] || order.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#2C2C2C] mb-1.5"><span className="font-semibold text-[#666666]">Remark:</span> {order.orderRemark || '—'}</p>
              {order.brandName && user?.role === 'HOST' && <p className="text-xs text-[#FF2E46] font-semibold mb-1">Brand: {order.brandName}</p>}
              {order.calledBy && <p className="text-xs text-[#666666] mb-1">Called by: {order.calledBy}</p>}
              {order.dispatchFrom && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {order.dispatchFrom.split(',').map(loc => (
                    <span key={loc} className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {loc.trim()}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-[#666666] mb-3">By {order.createdBy} · {formatDate(order.createdAt)}</p>

              <ActionButtons
                order={order}
                canAction={canAction}
                canCancel={canCancel}
                onHold={() => openModal('hold', order)}
                onBill={() => openModal('bill', order)}
                onComplete={() => openModal('complete', order)}
                onCancel={() => setConfirmCancel(order)}
                onRevert={() => openModal('revert', order)}
                onEdit={() => openModal('edit', order)}
                isHost={user?.role === 'HOST'}
                isReadOnly={isReadOnly}
              />
            </div>
          ))
        )}
      </div>

      {confirmCancel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg border border-[#E0E2E5]">
            <h3 className="text-base font-bold text-[#2C2C2C] mb-1.5">Cancel Order?</h3>
            <p className="text-xs sm:text-sm text-[#666666] mb-1">Firm: <strong className="text-[#2C2C2C]">{confirmCancel.salesEntry?.firmName}</strong></p>
            <p className="text-xs text-[#666666] mb-5">The order will be marked as cancelled and remain visible in records.</p>
            <div className="flex gap-2.5">
              <button onClick={() => setConfirmCancel(null)} disabled={isCancelling} className="flex-1 py-2 bg-gray-100 text-[#2C2C2C] rounded-lg hover:bg-gray-200 text-xs sm:text-sm font-semibold transition-colors">Go Back</button>
              <button onClick={() => handleCancel(confirmCancel)} disabled={isCancelling} className="flex-1 py-2 bg-[#FF2E46] text-white rounded-lg hover:bg-[#FF5A71] disabled:opacity-50 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors">
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && <AddOrderModal onClose={() => setShowAddModal(false)} />}
      {showShareModal && <SalesShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          totalCount={orders.length}
          filteredCount={filteredOrders.length}
          title="Export Orders to Excel"
        />
      )}
      {showDetailModal && selectedOrder && <OrderDetailModal order={selectedOrder} onClose={closeDetail} />}
      {showHoldModal && selectedOrder && <OrderHoldModal order={selectedOrder} onClose={closeAll} />}
      {showBillModal && selectedOrder && <OrderBillModal order={selectedOrder} onClose={closeAll} />}
      {showCompleteModal && selectedOrder && <OrderCompleteModal order={selectedOrder} onClose={closeAll} />}
      {showRevertModal && selectedOrder && <OrderRevertModal order={selectedOrder} onClose={closeAll} />}
      {showEditModal && selectedOrder && <OrderEditModal order={selectedOrder} onClose={closeAll} />}
    </div>
  );
};

const ActionButtons = ({ order, canAction, canCancel, onHold, onBill, onComplete, onCancel, onRevert, onEdit, isHost, isReadOnly }) => {
  if (isReadOnly) return null;
  const { status } = order;
  const isCancelled = status === 'CANCELLED';
  const isCompleted = status === 'COMPLETED';
  const isBilled = status === 'BILLED';

  return (
    <div className="flex flex-wrap sm:flex-col gap-1.5 min-w-[90px]">
      {isHost && (
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#2C2C2C] rounded-md text-xs font-semibold text-left whitespace-nowrap transition-colors">
          Edit
        </button>
      )}
      {canAction && !isCancelled && !isCompleted && !isBilled && (
        <button onClick={(e) => { e.stopPropagation(); onHold(); }} className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-md text-xs font-semibold text-left whitespace-nowrap transition-colors">
          Hold
        </button>
      )}
      {canAction && ['PENDING', 'ON_HOLD'].includes(status) && (
        <button onClick={(e) => { e.stopPropagation(); onBill(); }} className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold text-left whitespace-nowrap transition-colors">
          Bill
        </button>
      )}
      {canAction && isBilled && (
        <button onClick={(e) => { e.stopPropagation(); onComplete(); }} className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold text-left whitespace-nowrap transition-colors">
          Transport
        </button>
      )}
      {canCancel && !isCancelled && !isCompleted && (
        <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md text-xs font-semibold text-left whitespace-nowrap transition-colors">
          Cancel
        </button>
      )}
      {isHost && isCancelled && (
        <button onClick={(e) => { e.stopPropagation(); onRevert(); }} className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-md text-xs font-semibold text-left whitespace-nowrap transition-colors">
          Revert
        </button>
      )}
    </div>
  );
};

export default OrdersPage;
