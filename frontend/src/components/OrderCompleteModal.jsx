import React, { useState } from 'react';
import useOrderStore from '../store/orderStore';
import useClickOutside from '../hooks/useClickOutside';

const OrderCompleteModal = ({ order, onClose }) => {
  const [completionRemark, setCompletionRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { completeOrder } = useOrderStore();
  const modalRef = useClickOutside(onClose);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!completionRemark.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await completeOrder(order.id, completionRemark.trim());
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
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <h3 className="text-base font-bold text-[#2C2C2C]">Transport Order</h3>
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
            <span className="text-[11px] font-semibold uppercase text-[#666666] tracking-wider">Firm Name</span>
            <span className="text-xs font-bold text-[#2C2C2C]">{order.salesEntry?.firmName}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1">
                Transport Remark / Tracking <span className="text-[#FF2E46]">*</span>
              </label>
              <textarea
                value={completionRemark}
                onChange={e => setCompletionRemark(e.target.value)}
                rows={3}
                placeholder="Enter transport details, vehicle/tracking number..."
                autoFocus
                className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all placeholder:text-gray-400"
              />
            </div>
            <p className="text-[11px] text-[#666666] bg-[#F8F9FA] p-2 rounded-md border border-[#E0E2E5]">
              Timestamp will be automatically recorded upon confirmation.
            </p>
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
                disabled={!completionRemark.trim() || isSubmitting}
                className="flex-1 py-2 px-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
              >
                {isSubmitting ? 'Transporting...' : 'Confirm Transport'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderCompleteModal;
