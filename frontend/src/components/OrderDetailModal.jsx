import React from 'react';
import useClickOutside from '../hooks/useClickOutside';

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

const Row = ({ label, value }) => value ? (
  <div className="flex gap-2 text-sm">
    <span className="font-medium text-gray-600 min-w-[130px]">{label}:</span>
    <span className="text-gray-800">{value}</span>
  </div>
) : null;

const OrderDetailModal = ({ order, onClose }) => {
  const modalRef = useClickOutside(onClose);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{order.salesEntry?.firmName}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${STATUS_BADGE[order.status]}`}>
              {STATUS_LABEL[order.status] || order.status.replace('_', ' ')}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-5">

          {/* Firm Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Firm Info</p>
            <Row label="Firm" value={order.salesEntry?.firmName} />
            <Row label="GST No" value={order.salesEntry?.gstNo} />
            <Row label="Contact Person" value={order.salesEntry?.contactPerson1Name} />
            <Row label="Contact Number" value={order.salesEntry?.contactPerson1Number} />
            <Row label="City" value={`${order.salesEntry?.city}${order.salesEntry?.area ? ` · ${order.salesEntry.area}` : ''}`} />
          </div>

          {/* Order Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Order Info</p>
            <Row label="Order #" value={`#${order.id}`} />
            <Row label="Order Remark" value={order.orderRemark} />
            <Row label="Called By" value={order.calledBy} />
            <Row label="Created By" value={order.createdBy} />
            <Row label="Created At" value={formatDate(order.createdAt)} />
          </div>

          {/* Hold History */}
          {order.holds?.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-3">Hold History ({order.holds.length})</p>
              <div className="space-y-2">
                {order.holds.map(h => (
                  <div key={h.id} className="text-sm border-l-2 border-yellow-400 pl-3">
                    <p className="text-gray-800">{h.remark}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{h.heldBy} · {formatDate(h.heldAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Billing Info */}
          {order.billingRemark && (
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Billing</p>
              <Row label="Billing Remark" value={order.billingRemark} />
              <Row label="Billed By" value={order.billedBy} />
              <Row label="Billed At" value={formatDate(order.billedAt)} />
            </div>
          )}

          {/* Transport Info */}
          {order.completionRemark && (
            <div className="bg-green-50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Transport</p>
              <Row label="Transport Remark" value={order.completionRemark} />
              <Row label="Transported By" value={order.completedBy} />
              <Row label="Transported At" value={formatDate(order.completedAt)} />
            </div>
          )}

          {/* Cancellation Info */}
          {order.cancelledBy && (
            <div className="bg-red-50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">Cancellation</p>
              <Row label="Cancelled By" value={order.cancelledBy} />
              <Row label="Cancelled At" value={formatDate(order.cancelledAt)} />
            </div>
          )}

        </div>

        <div className="p-5 border-t">
          <button onClick={onClose} className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
