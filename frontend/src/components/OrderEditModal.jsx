import React, { useState, useEffect } from 'react';
import useOrderStore from '../store/orderStore';
import useAuthStore from '../store/authStore';
import useBrandStore from '../store/brandStore';
import useLocationStore from '../store/locationStore';
import useClickOutside from '../hooks/useClickOutside';

const OrderEditModal = ({ order, onClose }) => {
  const [orderRemark, setOrderRemark] = useState(order.orderRemark || '');
  const [calledBy, setCalledBy] = useState(order.calledBy || '');
  const [brandName, setBrandName] = useState(order.brandName || '');
  const [dispatchFrom, setDispatchFrom] = useState(
    order.dispatchFrom ? order.dispatchFrom.split(',').filter(Boolean) : []
  );
  const [dispatchDropdownOpen, setDispatchDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!orderRemark.trim() || !brandName || dispatchFrom.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateOrder(order.id, {
        orderRemark: orderRemark.trim(),
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-gray-800">✏️ Edit Order</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-gray-600">Firm: <span className="font-semibold text-gray-800">{order.salesEntry?.firmName}</span></p>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand <span className="text-red-500">*</span></label>
            <select
              value={brandName}
              onChange={e => setBrandName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
              required
            >
              <option value="">— Select brand —</option>
              {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </div>

          {/* Order Remark */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Remark <span className="text-red-500">*</span></label>
            <textarea
              value={orderRemark}
              onChange={e => setOrderRemark(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Called By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Called By <span className="text-gray-400 text-xs">(optional)</span></label>
            <select
              value={calledBy}
              onChange={e => setCalledBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">— Select user —</option>
              {users.filter(u => !['ADMIN', 'ENGINEER'].includes(u.role)).map(u => (
                <option key={u.id} value={u.username}>{u.username} ({u.role})</option>
              ))}
            </select>
          </div>

          {/* Dispatch From */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dispatch From <span className="text-red-500">*</span></label>
            <button
              type="button"
              onClick={() => setDispatchDropdownOpen(p => !p)}
              className={`w-full px-3 py-2 border rounded-lg text-sm text-left flex items-center justify-between bg-white ${dispatchFrom.length === 0 ? 'border-gray-300 text-gray-400' : 'border-blue-500 text-gray-800'}`}
            >
              <span className="truncate">{dispatchFrom.length === 0 ? '— Select locations —' : dispatchFrom.map(n => `📦 ${n}`).join(', ')}</span>
              <svg className={`w-4 h-4 ml-2 flex-shrink-0 text-gray-400 transition-transform ${dispatchDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {dispatchDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {locations.map(loc => {
                  const selected = dispatchFrom.includes(loc.name);
                  return (
                    <button key={loc.id} type="button" onClick={() => toggleLocation(loc.name)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-left">
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                        {selected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </span>
                      <span className={selected ? 'font-medium text-blue-700' : 'text-gray-700'}>📦 {loc.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {dispatchFrom.length === 0 && <p className="text-xs text-red-500 mt-1">Please select at least one dispatch location</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isSubmitting}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={!orderRemark.trim() || !brandName || dispatchFrom.length === 0 || isSubmitting}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 text-sm font-medium">
              {isSubmitting ? 'Saving...' : '✓ Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderEditModal;
