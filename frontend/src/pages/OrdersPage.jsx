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

const STATUS_BADGE = {
  PENDING:   'bg-gray-100 text-gray-700',
  ON_HOLD:   'bg-yellow-100 text-yellow-700',
  BILLED:    'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
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

  const { orders, loading, fetchOrders, cancelOrder } = useOrderStore();
  const { user, users, fetchUsers } = useAuthStore();

  const canAction = ORDER_ACTION_ROLES.includes(user?.role);
  const canSeeAll = ALL_ORDER_ROLES.includes(user?.role);
  const canCancel = true;

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

  // Refetch when filters change (runs on mount too, replacing the initial fetch)
  useEffect(() => {
    const filters = {};
    if (statusFilter !== 'ALL') filters.status = statusFilter;
    if (dateRange.startDate) filters.startDate = dateRange.startDate;
    if (dateRange.endDate) filters.endDate = dateRange.endDate;
    fetchOrders(filters);
  }, [statusFilter, dateRange.startDate, dateRange.endDate]);

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

  // Client-side createdBy filter (server already scopes by role)
  const filteredOrders = orders.filter(o => {
    if (createdByFilter !== 'ALL' && o.createdBy !== createdByFilter) return false;
    return true;
  });

  const uniqueCreators = [...new Set(orders.map(o => o.createdBy))].sort();

  // Stats
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
  };

  const hasFilters = statusFilter !== 'ALL' || createdByFilter !== 'ALL' || dateRange.startDate || dateRange.endDate;

  return (
    <div className="max-w-7xl mx-auto p-4">
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
          <button
            onClick={() => setShowShareModal(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 font-medium text-sm shadow-sm transition-all flex items-center gap-2"
          >
            🔗 Share
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium text-sm shadow-sm transition-all"
          >
            + Add Entry
          </button>
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
          <p className="text-xs text-green-600 mt-0.5">Completed</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-red-700">{stats.cancelled}</p>
          <p className="text-xs text-red-600 mt-0.5">Cancelled</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">🔍 Filters</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Status */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="BILLED">Billed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Created By — only for roles that see all orders */}
          {canSeeAll && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Created By</label>
              <select
                value={createdByFilter}
                onChange={e => setCreatedByFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="ALL">All Users</option>
                {uniqueCreators.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range */}
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Date Range</label>
            <div className="flex items-center gap-2">
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
        </div>

        {hasFilters && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        )}
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['#', 'Firm', 'Order Remark', 'Called By', 'Status', 'Created By', 'Created At', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map(order => (
                    <React.Fragment key={order.id}>
                      <tr className={`hover:bg-gray-50 transition-colors ${order.status === 'CANCELLED' ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3 text-sm text-gray-500">{order.id}</td>
                        <td className="px-4 py-3">
                          <p className={`font-medium text-sm text-gray-800 ${order.status === 'CANCELLED' ? 'line-through' : ''}`}>
                            {order.salesEntry?.firmName}
                          </p>
                          <p className="text-xs text-gray-500">{order.salesEntry?.city}{order.salesEntry?.area ? ` · ${order.salesEntry.area}` : ''}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                          <p className="truncate" title={order.orderRemark}>{order.orderRemark}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.calledBy || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-600'}`}>
                            {order.status.replace('_', ' ')}
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
                        <td className="px-4 py-3">
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
                          />
                        </td>
                      </tr>

                      {/* Holds expansion row */}
                      {expandedHolds[order.id] && order.holds?.length > 0 && (
                        <tr className="bg-yellow-50">
                          <td colSpan={8} className="px-6 py-3">
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

                      {/* Billing / Completion info row */}
                      {(order.status === 'BILLED' || order.status === 'COMPLETED') && (
                        <tr className="bg-blue-50">
                          <td colSpan={8} className="px-6 py-2 text-xs text-gray-600">
                            {order.billingRemark && (
                              <span className="mr-4">🧾 <strong>Billing:</strong> {order.billingRemark} — {order.billedBy} @ {formatDate(order.billedAt)}</span>
                            )}
                            {order.status === 'COMPLETED' && order.completionRemark && (
                              <span>✅ <strong>Completion:</strong> {order.completionRemark} — {order.completedBy} @ {formatDate(order.completedAt)}</span>
                            )}
                          </td>
                        </tr>
                      )}

                      {/* Cancelled By info row */}
                      {order.status === 'CANCELLED' && order.cancelledBy && (
                        <tr className="bg-red-50">
                          <td colSpan={8} className="px-6 py-2 text-xs text-red-700">
                            ✕ <strong>Cancelled by:</strong> {order.cancelledBy} @ {formatDate(order.cancelledAt)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
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
                  <p className={`font-semibold text-gray-800 ${order.status === 'CANCELLED' ? 'line-through' : ''}`}>
                    {order.salesEntry?.firmName}
                  </p>
                  <p className="text-xs text-gray-500">{order.salesEntry?.city}{order.salesEntry?.area ? ` · ${order.salesEntry.area}` : ''}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[order.status] || ''}`}>
                  {order.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-sm text-gray-700 mb-1"><span className="font-medium">Remark:</span> {order.orderRemark}</p>
              {order.calledBy && <p className="text-xs text-gray-500 mb-1">Called by: {order.calledBy}</p>}
              <p className="text-xs text-gray-500 mb-3">By {order.createdBy} · {formatDate(order.createdAt)}</p>

              {/* Holds */}
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

              {/* Billing info */}
              {(order.status === 'BILLED' || order.status === 'COMPLETED') && order.billingRemark && (
                <div className="bg-blue-50 rounded-lg p-2 mb-2 text-xs text-gray-600">
                  🧾 <strong>Billing:</strong> {order.billingRemark} — {order.billedBy}
                  {order.status === 'COMPLETED' && order.completionRemark && (
                    <div className="mt-1">✅ <strong>Completion:</strong> {order.completionRemark} — {order.completedBy}</div>
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
              />
            </div>
          ))
        )}
      </div>

      {/* Cancel Confirm Dialog */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Cancel Order?</h3>
            <p className="text-sm text-gray-600 mb-1">
              Firm: <strong>{confirmCancel.salesEntry?.firmName}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-5">The order will be marked as cancelled and remain visible.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCancel(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                Go Back
              </button>
              <button
                onClick={() => handleCancel(confirmCancel)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
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

// Extracted action buttons component to keep JSX clean
const ActionButtons = ({ order, canAction, canCancel, onHold, onBill, onComplete, onCancel, onRevert, isHost }) => {
  const { status } = order;
  const isCancelled = status === 'CANCELLED';
  const isCompleted = status === 'COMPLETED';

  return (
    <div className="flex flex-wrap gap-1.5">
      {/* Hold — action roles, not cancelled/completed */}
      {canAction && !isCancelled && !isCompleted && (
        <button
          onClick={onHold}
          className="px-2.5 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-xs font-medium"
        >
          ⏸ Hold
        </button>
      )}

      {/* Bill — action roles, only PENDING or ON_HOLD */}
      {canAction && ['PENDING', 'ON_HOLD'].includes(status) && (
        <button
          onClick={onBill}
          className="px-2.5 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-xs font-medium"
        >
          🧾 Bill
        </button>
      )}

      {/* Complete — action roles, only BILLED */}
      {canAction && status === 'BILLED' && (
        <button
          onClick={onComplete}
          className="px-2.5 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-xs font-medium"
        >
          ✅ Complete
        </button>
      )}

      {/* Cancel — all order page roles, not already cancelled/completed */}
      {canCancel && !isCancelled && !isCompleted && (
        <button
          onClick={onCancel}
          className="px-2.5 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-xs font-medium"
        >
          ✕ Cancel
        </button>
      )}

      {/* Revert — HOST only, only cancelled */}
      {isHost && isCancelled && (
        <button
          onClick={onRevert}
          className="px-2.5 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-xs font-medium"
        >
          🔄 Revert
        </button>
      )}
    </div>
  );
};

export default OrdersPage;
