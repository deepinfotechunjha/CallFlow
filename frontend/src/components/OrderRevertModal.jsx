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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-gray-800">🔄 Revert Cancelled Order</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-600 mb-4">
            Firm: <span className="font-semibold text-gray-800">{order.salesEntry?.firmName}</span>
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
            Cancelled by <strong>{order.cancelledBy}</strong> on{' '}
            {order.cancelledAt ? new Date(order.cancelledAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Revert to Status <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                {['PENDING', 'ON_HOLD', 'BILLED'].map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={s}
                      checked={targetStatus === s}
                      onChange={() => handleStatusChange(s)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">{s.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {config.label} {config.required && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={remark}
                onChange={e => setRemark(e.target.value)}
                rows={2}
                placeholder={config.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secret Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={secretPassword}
                  onChange={e => setSecretPassword(e.target.value)}
                  placeholder="Enter your secret password"
                  autoFocus
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
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
                disabled={!canSubmit}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 text-sm font-medium"
              >
                {isSubmitting ? 'Reverting...' : '🔄 Revert Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderRevertModal;
