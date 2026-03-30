import React, { useState } from 'react';
import useOrderStore from '../store/orderStore';
import useClickOutside from '../hooks/useClickOutside';

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
      setStep(2);
      setIsSubmitting(false);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-gray-800">
            {step === 1 ? '🧾 Bill Order' : '✅ Complete Order'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Firm: <span className="font-semibold text-gray-800">{order.salesEntry?.firmName}</span>
          </p>

          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2 py-1 rounded-full font-medium ${step === 1 ? 'bg-blue-600 text-white' : 'bg-green-100 text-green-700'}`}>
              1. Billing
            </span>
            <span className="text-gray-300">→</span>
            <span className={`px-2 py-1 rounded-full font-medium ${step === 2 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
              2. Completion
            </span>
          </div>

          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Remark <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={billingRemark}
                  onChange={e => setBillingRemark(e.target.value)}
                  rows={3}
                  placeholder="Enter billing remarks..."
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBill}
                  disabled={!billingRemark.trim() || isSubmitting}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 text-sm font-medium"
                >
                  {isSubmitting ? 'Billing...' : 'Next → Complete'}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                ✓ Billed — now add completion details
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Completion Remark <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={completionRemark}
                  onChange={e => setCompletionRemark(e.target.value)}
                  rows={3}
                  placeholder="Enter completion remarks..."
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <p className="text-xs text-gray-500">Completion time will be recorded as current time on confirm.</p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Close
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!completionRemark.trim() || isSubmitting}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 text-sm font-medium"
                >
                  {isSubmitting ? 'Completing...' : '✓ Confirm Complete'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderBillModal;
