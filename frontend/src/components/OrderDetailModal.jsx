import React from 'react';
import useClickOutside from '../hooks/useClickOutside';
import OrderRemarkDisplay from './OrderRemarkDisplay';

const STATUS_BADGE = {
  PENDING:   'bg-[#FFE8EB] text-[#FF2E46] border border-[#FF2E46]/30',
  ON_HOLD:   'bg-[#F0F2F5] text-[#2C2C2C] border border-[#E0E2E5]',
  BILLED:    'bg-[#2C2C2C] text-white',
  COMPLETED: 'bg-[#2C2C2C] text-white',
  CANCELLED: 'bg-[#FFE8EB] text-[#FF2E46]',
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
  <div className="flex gap-2 text-xs">
    <span className="font-bold text-[#666666] min-w-[120px] uppercase tracking-wider">{label}:</span>
    <span className="text-[#2C2C2C] font-semibold">{value}</span>
  </div>
) : null;

const OrderDetailModal = ({ order, onClose }) => {
  const modalRef = useClickOutside(onClose);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div ref={modalRef} className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl border border-[#E0E2E5]">
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#E0E2E5]">
          <div>
            <span className="inline-block text-[#FF2E46] text-xs font-bold uppercase tracking-widest bg-[#FFE8EB] px-2.5 py-0.5 rounded-md mb-1 border border-[#FF2E46]/20">
              ORDER #{order.id}
            </span>
            <h3 className="text-lg font-bold text-[#2C2C2C]">{order.salesEntry?.firmName}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold mt-1.5 ${STATUS_BADGE[order.status]}`}>
              {STATUS_LABEL[order.status] || order.status?.replace('_', ' ')}
            </span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-[#F0F2F5] hover:bg-[#FFE8EB] hover:text-[#FF2E46] text-[#666666] flex items-center justify-center transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-3.5">
          {/* Firm Info */}
          <div className="bg-[#F8F9FA] rounded-lg p-3.5 space-y-2 border border-[#E0E2E5]">
            <p className="text-[11px] font-bold text-[#FF2E46] uppercase tracking-wider mb-1.5">Firm Details</p>
            <Row label="Firm" value={order.salesEntry?.firmName} />
            <Row label="Brand" value={order.brandName} />
            <Row label="GST No" value={order.salesEntry?.gstNo} />
            <Row label="Contact" value={`${order.salesEntry?.contactPerson1Name} (${order.salesEntry?.contactPerson1Number})`} />
            <Row label="City" value={`${order.salesEntry?.city}${order.salesEntry?.area ? ` · ${order.salesEntry.area}` : ''}`} />
          </div>

          {/* Order Info */}
          <div className="bg-[#F8F9FA] rounded-lg p-3.5 space-y-2 border border-[#E0E2E5]">
            <p className="text-[11px] font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">Order Specifications</p>
            <div className="flex gap-2 text-xs">
              <span className="font-bold text-[#666666] min-w-[120px] uppercase tracking-wider">Remark:</span>
              <div className="text-[#2C2C2C] flex-1"><OrderRemarkDisplay remark={order.orderRemark} /></div>
            </div>
            <Row label="Caller" value={order.calledBy} />
            <Row label="Dispatch Hub" value={order.dispatchFrom?.split(',').map(loc => loc.trim()).filter(Boolean).join(', ')} />
            <Row label="Created By" value={order.createdBy} />
            <Row label="Created At" value={formatDate(order.createdAt)} />
          </div>

          {/* Hold History */}
          {order.holds?.length > 0 && (
            <div className="bg-[#FFE8EB]/40 rounded-lg p-3.5 border border-[#FF2E46]/20">
              <p className="text-[11px] font-bold text-[#FF2E46] uppercase tracking-wider mb-1.5">Hold History ({order.holds.length})</p>
              <div className="space-y-2">
                {order.holds.map(h => (
                  <div key={h.id} className="text-xs border-l-2 border-[#FF2E46] pl-2.5">
                    <p className="text-[#2C2C2C] font-semibold">{h.remark}</p>
                    <p className="text-[11px] text-[#666666] mt-0.5">{h.heldBy} · {formatDate(h.heldAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Billing Info */}
          {order.billingRemark && (
            <div className="bg-[#F8F9FA] rounded-lg p-3.5 space-y-2 border border-[#E0E2E5]">
              <p className="text-[11px] font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">Billing Information</p>
              <Row label="Billing Remark" value={order.billingRemark} />
              <Row label="Billed By" value={order.billedBy} />
              <Row label="Billed At" value={formatDate(order.billedAt)} />
            </div>
          )}

          {/* Transport Info */}
          {order.completionRemark && (
            <div className="bg-[#F8F9FA] rounded-lg p-3.5 space-y-2 border border-[#E0E2E5]">
              <p className="text-[11px] font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">Transport Details</p>
              <Row label="Transport Remark" value={order.completionRemark} />
              <Row label="Transported By" value={order.completedBy} />
              <Row label="Transported At" value={formatDate(order.completedAt)} />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#E0E2E5] bg-[#F8F9FA]">
          <button onClick={onClose} className="w-full py-2 bg-[#2C2C2C] hover:bg-[#1A1A1A] text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
