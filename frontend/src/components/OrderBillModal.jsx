import React, { useState } from 'react';
import useOrderStore from '../store/orderStore';
import useClickOutside from '../hooks/useClickOutside';
import OrderRemarkDisplay from './OrderRemarkDisplay';

const OrderBillModal = ({ order, onClose }) => {
  const [step, setStep] = useState(1);
  const [billingRemark, setBillingRemark] = useState('');
  const [completionRemark, setCompletionRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { billOrder, completeOrder } = useOrderStore();
  const modalRef = useClickOutside(onClose);

  const handleBill = async () => {
    if (!billingRemark.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await billOrder(order.id, billingRemark.trim());
      setIsSubmitting(false);
      onClose();
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
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
      <div ref={modalRef} className="bg-white rounded-xl w-full max-w-md shadow-xl border border-[#E0E2E5] p-5 sm:p-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E0E2E5]">
          <h3 className="text-base font-bold text-[#2C2C2C]">
            {step === 1 ? 'Bill Order' : 'Transport Order'}
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-[#F0F2F5] hover:bg-[#FFE8EB] hover:text-[#FF2E46] text-[#666666] flex items-center justify-center transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3.5">
          <p className="text-xs text-[#666666]">
            Firm: <strong className="text-[#2C2C2C]">{order.salesEntry?.firmName}</strong>
          </p>
          {order.orderRemark && (
            <div className="bg-[#F8F9FA] border border-[#E0E2E5] rounded-lg p-3">
              <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1">Order Remark</p>
              <OrderRemarkDisplay remark={order.orderRemark} />
            </div>
          )}

          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2.5 py-0.5 rounded-md font-semibold text-[11px] ${step === 1 ? 'bg-[#FF2E46] text-white shadow-xs' : 'bg-[#2C2C2C] text-white'}`}>
              1. Billing
            </span>
            <span className="text-[#E0E2E5]">→</span>
            <span className={`px-2.5 py-0.5 rounded-md font-semibold text-[11px] ${step === 2 ? 'bg-[#FF2E46] text-white shadow-xs' : 'bg-[#F0F2F5] text-[#666666]'}`}>
              2. Transport
            </span>
          </div>

          {step === 1 && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">
                  Billing Remark <span className="text-[#FF2E46]">*</span>
                </label>
                <textarea
                  value={billingRemark}
                  onChange={e => setBillingRemark(e.target.value)}
                  rows={3}
                  placeholder="Enter invoice number / billing details..."
                  autoFocus
                  className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBill}
                  disabled={!billingRemark.trim() || isSubmitting}
                  className="flex-1 py-2 bg-[#FF2E46] hover:bg-[#E02038] text-white rounded-lg font-semibold text-xs uppercase tracking-wider shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Billing...' : 'Save & Continue'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 pt-1">
              <div className="bg-[#FFE8EB] border border-[#FF2E46]/20 rounded-lg p-2.5 text-xs font-semibold text-[#FF2E46]">
                Order Billed — enter transport tracking details
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">
                  Transport Remark <span className="text-[#FF2E46]">*</span>
                </label>
                <textarea
                  value={completionRemark}
                  onChange={e => setCompletionRemark(e.target.value)}
                  rows={3}
                  placeholder="Courier name, LR number, vehicle number..."
                  autoFocus
                  className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!completionRemark.trim() || isSubmitting}
                  className="flex-1 py-2 bg-[#FF2E46] hover:bg-[#E02038] text-white rounded-lg font-semibold text-xs uppercase tracking-wider shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Completing...' : 'Finalize Transport'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderBillModal;
