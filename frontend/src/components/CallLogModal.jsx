import React, { useState } from 'react';
import useSalesStore from '../store/salesStore';
import useClickOutside from '../hooks/useClickOutside';

const CallLogModal = ({ entry, onClose }) => {
  const [callType, setCallType] = useState('OUTGOING');
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { logCall } = useSalesStore();
  const modalRef = useClickOutside(onClose);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await logCall(entry.id, callType, remark);
      onClose();
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Log Call - {entry.firmName}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Call Type *</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="RECEIVED"
                  checked={callType === 'RECEIVED'}
                  onChange={(e) => setCallType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Received</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="OUTGOING"
                  checked={callType === 'OUTGOING'}
                  onChange={(e) => setCallType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Outgoing</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Remark (optional)</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
              rows="3"
              placeholder="Add call notes..."
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-400 font-medium text-sm"
            >
              {isSubmitting ? 'Logging...' : 'Confirm Call'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CallLogModal;
