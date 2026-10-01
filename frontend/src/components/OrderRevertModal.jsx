import React, { useState } from 'react';
import useOrderStore from '../store/orderStore';
import useClickOutside from '../hooks/useClickOutside';

const REMARK_CONFIG = {
  ON_HOLD:  { label: 'Hold Remark',       placeholder: 'Enter hold reason...', required: true },
  BILLED:   { label: 'Billing Remark',    placeholder: 'Enter billing details...', required: true },
  PENDING:  { label: 'Revert Remark',     placeholder: 'Optional note...', required: false },
};

const OrderRevertModal = ({ order, onClose }) => {
  const [secretPassword, setSecretPassword] = useState('');
  const [targetStatus, setTargetStatus] = useState('PENDING');
  const [remark, setRemark] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { revertOrder } = useOrderStore();
  const modalRef = useClickOutside(onClose);

  const config = REMARK_CONFIG[targetStatus];
  const canSubmit = secretPassword.trim() && (!config.required || remark.trim()) && !isSubmitting;

  const handleStatusChange = (s) => {
    setTargetStatus(s);
    setRemark('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await revertOrder(order.id, secretPassword, targetStatus, remark.trim() || undefined);
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
            <span className="w-2 h-2 rounded-full bg-[#FF2E46]"></span>
            <h3 className="text-base font-bold text-[#2C2C2C]">Revert Cancelled Order</h3>
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
          <div className="bg-[#F8F9FA] border border-[#E0E2E5] rounded-lg p-3 mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-[#666666] tracking-wider">Target Firm</span>
            <span className="text-xs font-bold text-[#2C2C2C]">{order.salesEntry?.firmName}</span>
          </div>

          <div className="bg-[#FFE8EB]/50 border border-[#FF2E46]/20 rounded-lg p-2.5 mb-4 text-xs text-[#FF2E46]">
            <span className="font-bold">Cancelled by {order.cancelledBy || 'System'}</span> on{' '}
            {order.cancelledAt ? new Date(order.cancelledAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1.5">
                Revert to Status <span className="text-[#FF2E46]">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['PENDING', 'ON_HOLD', 'BILLED'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStatusChange(s)}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                      targetStatus === s
                        ? 'bg-[#2C2C2C] text-white border-[#2C2C2C] shadow-xs'
                        : 'bg-white text-[#2C2C2C] border-[#E0E2E5] hover:bg-[#F8F9FA]'
                    }`}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1">
                {config.label} {config.required && <span className="text-[#FF2E46]">*</span>}
              </label>
              <textarea
                value={remark}
                onChange={e => setRemark(e.target.value)}
                rows={2}
                placeholder={config.placeholder}
                className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1">
                Secret Password <span className="text-[#FF2E46]">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={secretPassword}
                  onChange={e => setSecretPassword(e.target.value)}
                  placeholder="Enter secret authorization password"
                  autoFocus
                  className="w-full px-3 py-2 pr-12 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#2C2C2C] text-xs font-semibold"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-2 px-3 bg-[#F0F2F5] text-[#2C2C2C] rounded-lg hover:bg-[#E02038] hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 py-2 px-3 bg-[#FF2E46] text-white rounded-lg hover:bg-[#E02038] disabled:opacity-50 text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
              >
                {isSubmitting ? 'Reverting...' : 'Revert Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderRevertModal;
