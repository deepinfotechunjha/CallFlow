import React, { useState } from 'react';
import useOrderStore from '../store/orderStore';
import useClickOutside from '../hooks/useClickOutside';

const OrderHoldModal = ({ order, onClose }) => {
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { holdOrder } = useOrderStore();
  const modalRef = useClickOutside(onClose);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!remark.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await holdOrder(order.id, remark.trim());
      onClose();
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div ref={modalRef} className="bg-white rounded-xl w-full max-w-md shadow-xl border border-[#E0E2E5] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E2E5] bg-[#F8F9FA]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <h3 className="text-base font-bold text-[#2C2C2C]">Hold Order</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-7 h-7 rounded-lg bg-white text-[#666666] hover:text-[#FF2E46] hover:bg-[#FFE8EB] flex items-center justify-center transition-colors border border-[#E0E2E5]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">
          <div className="bg-[#F8F9FA] border border-[#E0E2E5] rounded-lg p-3 mb-4 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-[#666666] tracking-wider">Target Firm</span>
            <span className="text-xs font-bold text-[#2C2C2C]">{order.salesEntry?.firmName}</span>
          </div>

          {/* Existing holds */}
          {order.holds?.length > 0 && (
            <div className="mb-4 bg-amber-50 border border-amber-200/80 rounded-lg p-3 max-h-40 overflow-y-auto">
              <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1.5">Previous Holds ({order.holds.length})</p>
              {order.holds.map(h => (
                <div key={h.id} className="text-xs text-gray-700 mb-2 last:mb-0 border-b border-amber-100 last:border-b-0 pb-1.5 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#2C2C2C]">{h.heldBy}</span>
                    <span className="text-gray-400 text-[10px]">
                      {new Date(h.heldAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-gray-600">{h.remark}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1">
                Hold Remark <span className="text-[#FF2E46]">*</span>
              </label>
              <textarea
                value={remark}
                onChange={e => setRemark(e.target.value)}
                rows={3}
                placeholder="Enter detailed reason for placing this order on hold..."
                autoFocus
                className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all placeholder:text-gray-400"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-2 px-3 bg-[#F0F2F5] text-[#2C2C2C] rounded-lg hover:bg-[#E0E2E5] text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!remark.trim() || isSubmitting}
                className="flex-1 py-2 px-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
              >
                {isSubmitting ? 'Holding...' : 'Confirm Hold'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderHoldModal;
