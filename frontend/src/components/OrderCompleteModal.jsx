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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-gray-800">🚚 Transport Order</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-600 mb-4">
            Firm: <span className="font-semibold text-gray-800">{order.salesEntry?.firmName}</span>
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transport Remark <span className="text-red-500">*</span>
              </label>
              <textarea
                value={completionRemark}
                onChange={e => setCompletionRemark(e.target.value)}
                rows={3}
                placeholder="Enter transport remarks..."
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <p className="text-xs text-gray-500">Transport time will be recorded as current time on confirm.</p>
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
                disabled={!completionRemark.trim() || isSubmitting}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 text-sm font-medium"
              >
                {isSubmitting ? 'Transporting...' : '✓ Confirm Transport'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderCompleteModal;
