import React, { useState, useEffect } from 'react';
import useOrderStore from '../store/orderStore';
import useAuthStore from '../store/authStore';
import useBrandStore from '../store/brandStore';
import useLocationStore from '../store/locationStore';
import useClickOutside from '../hooks/useClickOutside';
import OrderRemarkDisplay, { parseOrderRemark } from './OrderRemarkDisplay';

const OrderEditModal = ({ order, onClose }) => {
  const [orderRemark, setOrderRemark] = useState(order.orderRemark || '');
  const [calledBy, setCalledBy] = useState(order.calledBy || '');
  const [brandName, setBrandName] = useState(order.brandName || '');
  const [dispatchFrom, setDispatchFrom] = useState(
    order.dispatchFrom ? order.dispatchFrom.split(',').filter(Boolean) : []
  );
  const [dispatchDropdownOpen, setDispatchDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTableRemark = !!parseOrderRemark(order.orderRemark);
  const { updateOrder } = useOrderStore();
  const { users } = useAuthStore();
  const { brands, fetchBrands } = useBrandStore();
  const { locations } = useLocationStore();
  const modalRef = useClickOutside(onClose);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const toggleLocation = (name) =>
    setDispatchFrom(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!brandName || dispatchFrom.length === 0 || isSubmitting) return;
    if (!isTableRemark && !orderRemark.trim()) return;
    setIsSubmitting(true);
    try {
      await updateOrder(order.id, {
        orderRemark: isTableRemark ? order.orderRemark : orderRemark.trim(),
        calledBy: calledBy || null,
        brandName,
        dispatchFrom: dispatchFrom.join(','),
      });
      onClose();
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div ref={modalRef} className="bg-white rounded-xl w-full max-w-md shadow-xl border border-[#E0E2E5] overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E2E5] bg-[#F8F9FA]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF2E46]"></span>
            <h3 className="text-base font-bold text-[#2C2C2C]">Edit Order</h3>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto flex-1">
          <div className="bg-[#F8F9FA] border border-[#E0E2E5] rounded-lg p-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-[#666666] tracking-wider">Firm</span>
            <span className="text-xs font-bold text-[#2C2C2C]">{order.salesEntry?.firmName}</span>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1">
              Brand <span className="text-[#FF2E46]">*</span>
            </label>
            <select
              value={brandName}
              onChange={e => setBrandName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all font-medium"
              required
            >
              <option value="">Select brand</option>
              {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </div>

          {/* Order Remark */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1">
              Order Remark <span className="text-[#FF2E46]">*</span>
            </label>
            {isTableRemark ? (
              <div className="border border-[#E0E2E5] rounded-lg p-3 bg-[#F8F9FA]">
                <p className="text-[11px] text-[#666666] mb-1.5 italic">Table order — structured catalog items</p>
                <OrderRemarkDisplay remark={order.orderRemark} />
              </div>
            ) : (
              <textarea
                value={orderRemark}
                onChange={e => setOrderRemark(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all placeholder:text-gray-400"
                required
              />
            )}
          </div>

          {/* Called By */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1">
              Called By <span className="text-[#666666] font-normal text-xs">(optional)</span>
            </label>
            <select
              value={calledBy}
              onChange={e => setCalledBy(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all font-medium"
            >
              <option value="">Select user</option>
              {users.filter(u => !['ADMIN', 'ENGINEER'].includes(u.role)).map(u => (
                <option key={u.id} value={u.username}>{u.username} ({u.role})</option>
              ))}
            </select>
          </div>

          {/* Dispatch From */}
          <div className="relative">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1">
              Dispatch From <span className="text-[#FF2E46]">*</span>
            </label>
            <button
              type="button"
              onClick={() => setDispatchDropdownOpen(p => !p)}
              className={`w-full px-3 py-2 border rounded-lg text-sm text-left flex items-center justify-between bg-white transition-all ${
                dispatchFrom.length === 0 ? 'border-[#E0E2E5] text-gray-400' : 'border-[#FF2E46]/50 bg-[#FFE8EB]/20 text-[#2C2C2C] font-semibold'
              }`}
            >
              <span className="truncate">{dispatchFrom.length === 0 ? 'Select locations' : dispatchFrom.join(', ')}</span>
              <svg className={`w-4 h-4 ml-2 flex-shrink-0 text-[#666666] transition-transform ${dispatchDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {dispatchDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-[#E0E2E5] rounded-lg shadow-xl overflow-hidden py-1">
                {locations.map(loc => {
                  const selected = dispatchFrom.includes(loc.name);
                  return (
                    <button key={loc.id} type="button" onClick={() => toggleLocation(loc.name)}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-[#F8F9FA] text-xs text-left transition-colors">
                      <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'border-[#FF2E46] bg-[#FF2E46]' : 'border-gray-300'}`}>
                        {selected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </span>
                      <span className={selected ? 'font-semibold text-[#FF2E46]' : 'text-[#2C2C2C]'}>{loc.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {dispatchFrom.length === 0 && <p className="text-xs text-[#FF2E46] mt-1 font-medium">Please select at least one dispatch location</p>}
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} disabled={isSubmitting}
              className="flex-1 py-2 px-3 bg-[#F0F2F5] text-[#2C2C2C] rounded-lg hover:bg-[#E02038] hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={(!isTableRemark && !orderRemark.trim()) || !brandName || dispatchFrom.length === 0 || isSubmitting}
              className="flex-1 py-2 px-3 bg-[#FF2E46] text-white rounded-lg hover:bg-[#E02038] disabled:opacity-50 text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderEditModal;
