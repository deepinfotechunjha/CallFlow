import React, { useState, useEffect } from 'react';
import useOrderStore from '../store/orderStore';
import useAuthStore from '../store/authStore';
import AddOrderModal from '../components/AddOrderModal';
import OrderHoldModal from '../components/OrderHoldModal';
import OrderBillModal from '../components/OrderBillModal';
import OrderCompleteModal from '../components/OrderCompleteModal';
import OrderRevertModal from '../components/OrderRevertModal';
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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [expandedHolds, setExpandedHolds] = useState({});
  const [confirmCancel, setConfirmCancel] = useState(null);

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
  };

  const closeAll = () => {
    setShowHoldModal(false);
    setShowBillModal(false);
    setShowCompleteModal(false);
    setShowRevertModal(false);
    setSelectedOrder(null);
  };

  const handleCancel = async (order) => {
    setConfirmCancel(null);
    await cancelOrder(order.id);
  };

  const toggleHolds = (id) => setExpandedHolds(prev => ({ ...prev, [id]: !prev[id] }));

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
    <div className="w-full p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">Orders 📦</h1>
          <p className="text-gray-600">Hello <span className="font-semibold text-blue-600">{user?.username}</span>, manage your orders</p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'HOST' && (
            <button
              onClick={() => setShowExportModal(true)}
              disabled={isExporting}
              className={`px-5 py-3 rounded-xl font-medium text-sm shadow-sm transition-all flex items-center gap-2 ${
                isExporting
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
              }`}
            >
              {isExporting ? '⏳ Exporting...' : '📊 Export'}
            </button>
          )}
          {!isReadOnly && (
            <button
              onClick={() => setShowShareModal(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 font-medium text-sm shadow-sm transition-all flex items-center gap-2"
            >
              🔗 Share
            </button>
          )}
          {!isReadOnly && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium text-sm shadow-sm transition-all"
            >
              + Add Entry
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-blue-700">{stats.total}</p>
          <p className="text-xs text-blue-600 mt-0.5">Total</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-gray-700">{stats.pending}</p>
          <p className="text-xs text-gray-600 mt-0.5">Pending</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-yellow-700">{stats.onHold}</p>
          <p className="text-xs text-yellow-600 mt-0.5">On Hold</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-indigo-700">{stats.billed}</p>
          <p className="text-xs text-indigo-600 mt-0.5">Billed</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-green-700">{stats.completed}</p>
          <p className="text-xs text-green-600 mt-0.5">Transported</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-red-700">{stats.cancelled}</p>
          <p className="text-xs text-red-600 mt-0.5">Cancelled</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6 space-y-4">

        {/* Search + Created By + Date Range */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search orders..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {canSeeAll && (
            <div>
              <select
                value={createdByFilter}
                onChange={e => setCreatedByFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={e => setDateRange(p => ({ ...p, endDate: e.target.value }))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status buttons */}
        <div className="flex flex-wrap gap-2">
          {STATUS_BUTTONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
          {hasFilters && (
            <button onClick={clearFilters} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 ml-auto">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-400 text-lg">No orders found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500">#</th>
                    <th onClick={() => handleSort('firm')} className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500 cursor-pointer hover:bg-blue-700 whitespace-nowrap">Firm {getSortIcon('firm')}</th>
                    {user?.role === 'HOST' && <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500 whitespace-nowrap">Brand</th>}
                    <th onClick={() => handleSort('remark')} className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500 cursor-pointer hover:bg-blue-700 whitespace-nowrap">Order Remark {getSortIcon('remark')}</th>
                    <th onClick={() => handleSort('calledBy')} className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500 cursor-pointer hover:bg-blue-700 whitespace-nowrap">Called By {getSortIcon('calledBy')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500 whitespace-nowrap">Dispatch From</th>
                    <th onClick={() => handleSort('status')} className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500 cursor-pointer hover:bg-blue-700 whitespace-nowrap">Status {getSortIcon('status')}</th>
                    <th onClick={() => handleSort('createdBy')} className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500 cursor-pointer hover:bg-blue-700 whitespace-nowrap">Created By {getSortIcon('createdBy')}</th>
                    <th onClick={() => handleSort('date')} className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500 cursor-pointer hover:bg-blue-700 whitespace-nowrap">Created At {getSortIcon('date')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedOrders.map((order, index) => (
                    <React.Fragment key={order.id}>
                      <tr className={`hover:bg-gray-50 transition-colors ${order.status === 'CANCELLED' ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3">
                          <p className={`font-medium text-sm text-gray-800 ${order.status === 'CANCELLED' ? 'line-through' : ''}`}>{order.salesEntry?.firmName}</p>
                          <p className="text-xs text-gray-500">{order.salesEntry?.city}{order.salesEntry?.area ? ` · ${order.salesEntry.area}` : ''}</p>
                        </td>
                        {user?.role === 'HOST' && (
                          <td className="px-4 py-3 text-xs font-medium text-teal-700">
                            {order.brandName || '—'}
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                          <p className="truncate" title={order.orderRemark}>{order.orderRemark}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.calledBy || '—'}</td>
                        <td className="px-4 py-3">
                          {order.dispatchFrom ? (
                            <div className="flex flex-wrap gap-1">
                              {order.dispatchFrom.split(',').map(loc => (
                                <span key={loc} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                  📦 {loc}
                                </span>
                              ))}
                            </div>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABEL[order.status] || order.status.replace('_', ' ')}
                          </span>
                          {order.holds?.length > 0 && (
                            <button
                              onClick={() => toggleHolds(order.id)}
                              className="ml-2 text-xs text-yellow-600 hover:underline"
                            >
                              {expandedHolds[order.id] ? '▲' : '▼'} {order.holds.length} hold{order.holds.length > 1 ? 's' : ''}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.createdBy}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                        <td className="px-4 py-3" >
                          <ActionButtons
                            order={order}
                            canAction={canAction}
                            canCancel={canCancel}
                            onHold={() => openModal('hold', order)}
                            onBill={() => openModal('bill', order)}
                            onComplete={() => openModal('complete', order)}
                            onCancel={() => setConfirmCancel(order)}
                            onRevert={() => openModal('revert', order)}
                            isHost={user?.role === 'HOST'}
                            isReadOnly={isReadOnly}
                          />
                        </td>
                      </tr>

                      {expandedHolds[order.id] && order.holds?.length > 0 && (
                        <tr className="bg-yellow-50">
                          <td colSpan={user?.role === 'HOST' ? 10 : 9} className="px-6 py-3">
                            <p className="text-xs font-semibold text-yellow-700 mb-2">Hold History</p>
                            <div className="space-y-1">
                              {order.holds.map(h => (
                                <div key={h.id} className="text-xs text-gray-700 flex gap-3">
                                  <span className="font-medium text-yellow-700 whitespace-nowrap">{h.heldBy}</span>
                                  <span className="text-gray-400 whitespace-nowrap">{formatDate(h.heldAt)}</span>
                                  <span>{h.remark}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}

                      {(order.status === 'BILLED' || order.status === 'COMPLETED') && (
                        <tr className="bg-blue-50">
                          <td colSpan={user?.role === 'HOST' ? 10 : 9} className="px-6 py-2 text-xs text-gray-600">
                            {order.billingRemark && (
                              <span className="mr-4">🧾 <strong>Billing:</strong> {order.billingRemark} — {order.billedBy} @ {formatDate(order.billedAt)}</span>
                            )}
                            {order.status === 'COMPLETED' && order.completionRemark && (
                              <span>🚚 <strong>Transport:</strong> {order.completionRemark} — {order.completedBy} @ {formatDate(order.completedAt)}</span>
                            )}
                          </td>
                        </tr>
                      )}

                      {/* Cancelled By info row */}
                      {order.status === 'CANCELLED' && order.cancelledBy && (
                        <tr className="bg-red-50">
                          <td colSpan={user?.role === 'HOST' ? 10 : 9} className="px-6 py-2 text-xs text-red-700">
                            ✕ <strong>Cancelled by:</strong> {order.cancelledBy} @ {formatDate(order.cancelledAt)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No orders found</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order.id}
              className={`bg-white rounded-xl border shadow-sm p-4 ${order.status === 'CANCELLED' ? 'opacity-60 border-red-200' : 'border-gray-200'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className={`font-semibold text-gray-800 ${order.status === 'CANCELLED' ? 'line-through' : ''}`}>{order.salesEntry?.firmName}</p>
                  <p className="text-xs text-gray-500">{order.salesEntry?.city}{order.salesEntry?.area ? ` · ${order.salesEntry.area}` : ''}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[order.status] || ''}`}>
                  {STATUS_LABEL[order.status] || order.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-sm text-gray-700 mb-1"><span className="font-medium">Remark:</span> {order.orderRemark}</p>
              {order.brandName && user?.role === 'HOST' && <p className="text-xs text-teal-700 font-medium mb-1">Brand: {order.brandName}</p>}
              {order.calledBy && <p className="text-xs text-gray-500 mb-1">Called by: {order.calledBy}</p>}
              {order.dispatchFrom && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {order.dispatchFrom.split(',').map(loc => (
                    <span key={loc} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      📦 {loc}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mb-3">By {order.createdBy} · {formatDate(order.createdAt)}</p>

              {order.holds?.length > 0 && (
                <div className="mb-3">
                  <button
                    onClick={() => toggleHolds(order.id)}
                    className="text-xs text-yellow-600 font-medium hover:underline"
                  >
                    {expandedHolds[order.id] ? '▲ Hide' : '▼ Show'} {order.holds.length} hold{order.holds.length > 1 ? 's' : ''}
                  </button>
                  {expandedHolds[order.id] && (
                    <div className="mt-2 bg-yellow-50 rounded-lg p-2 space-y-1">
                      {order.holds.map(h => (
                        <div key={h.id} className="text-xs text-gray-700">
                          <span className="font-medium text-yellow-700">{h.heldBy}</span>
                          <span className="text-gray-400 ml-1">{formatDate(h.heldAt)}</span>
                          <p>{h.remark}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(order.status === 'BILLED' || order.status === 'COMPLETED') && order.billingRemark && (
                <div className="bg-blue-50 rounded-lg p-2 mb-2 text-xs text-gray-600">
                  🧾 <strong>Billing:</strong> {order.billingRemark} — {order.billedBy}
                  {order.status === 'COMPLETED' && order.completionRemark && (
                    <div className="mt-1">🚚 <strong>Transport:</strong> {order.completionRemark} — {order.completedBy}</div>
                  )}
                </div>
              )}

              {/* Cancelled info */}
              {order.status === 'CANCELLED' && order.cancelledBy && (
                <div className="bg-red-50 rounded-lg p-2 mb-2 text-xs text-red-700">
                  ✕ <strong>Cancelled by:</strong> {order.cancelledBy} @ {formatDate(order.cancelledAt)}
                </div>
              )}

              <ActionButtons
                order={order}
                canAction={canAction}
                canCancel={canCancel}
                onHold={() => openModal('hold', order)}
                onBill={() => openModal('bill', order)}
                onComplete={() => openModal('complete', order)}
                onCancel={() => setConfirmCancel(order)}
                onRevert={() => openModal('revert', order)}
                isHost={user?.role === 'HOST'}
                isReadOnly={isReadOnly}
              />
            </div>
          ))
        )}
      </div>

      {confirmCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Cancel Order?</h3>
            <p className="text-sm text-gray-600 mb-1">Firm: <strong>{confirmCancel.salesEntry?.firmName}</strong></p>
            <p className="text-sm text-gray-500 mb-5">The order will be marked as cancelled and remain visible.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmCancel(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">Go Back</button>
              <button onClick={() => handleCancel(confirmCancel)} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">Yes, Cancel</button>
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
      {showHoldModal && selectedOrder && <OrderHoldModal order={selectedOrder} onClose={closeAll} />}
      {showBillModal && selectedOrder && <OrderBillModal order={selectedOrder} onClose={closeAll} />}
      {showCompleteModal && selectedOrder && <OrderCompleteModal order={selectedOrder} onClose={closeAll} />}
      {showRevertModal && selectedOrder && <OrderRevertModal order={selectedOrder} onClose={closeAll} />}
    </div>
  );
};

const ActionButtons = ({ order, canAction, canCancel, onHold, onBill, onComplete, onCancel, onRevert, isHost, isReadOnly }) => {
  if (isReadOnly) return null;
  const { status } = order;
  const isCancelled = status === 'CANCELLED';
  const isCompleted = status === 'COMPLETED';
  const isBilled = status === 'BILLED';

  return (
    <div className="flex gap-1.5">
      {canAction && !isCancelled && !isCompleted && !isBilled && (
        <button onClick={onHold} className="px-2.5 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-xs font-medium">
          ⏸ Hold
        </button>
      )}
      {canAction && ['PENDING', 'ON_HOLD'].includes(status) && (
        <button onClick={onBill} className="px-2.5 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-xs font-medium">
          🧾 Bill
        </button>
      )}
      {canAction && isBilled && (
        <button onClick={onComplete} className="px-2.5 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-xs font-medium">
          🚚 Transport
        </button>
      )}
      {canCancel && !isCancelled && !isCompleted && (
        <button onClick={onCancel} className="px-2.5 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-xs font-medium">
          ✕ Cancel
        </button>
      )}
      {isHost && isCancelled && (
        <button onClick={onRevert} className="px-2.5 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-xs font-medium">
          🔄 Revert
        </button>
      )}
    </div>
  );
};

export default OrdersPage;
