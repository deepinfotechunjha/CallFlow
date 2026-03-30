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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-gray-800">⏸ Hold Order</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-600 mb-4">
            Firm: <span className="font-semibold text-gray-800">{order.salesEntry?.firmName}</span>
          </p>

          {/* Existing holds */}
          {order.holds?.length > 0 && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-h-40 overflow-y-auto">
              <p className="text-xs font-semibold text-yellow-700 mb-2">Previous Holds ({order.holds.length})</p>
              {order.holds.map(h => (
                <div key={h.id} className="text-xs text-gray-700 mb-2 last:mb-0 border-b border-yellow-100 last:border-b-0 pb-1 last:pb-0">
                  <span className="font-medium">{h.heldBy}</span>
                  <span className="text-gray-400 ml-1">
                    {new Date(h.heldAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <p className="mt-0.5">{h.remark}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hold Remark <span className="text-red-500">*</span>
              </label>
              <textarea
                value={remark}
                onChange={e => setRemark(e.target.value)}
                rows={3}
                placeholder="Reason for hold..."
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!remark.trim() || isSubmitting}
                className="flex-1 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-yellow-300 text-sm font-medium"
              >
                {isSubmitting ? 'Holding...' : '⏸ Confirm Hold'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderHoldModal;
