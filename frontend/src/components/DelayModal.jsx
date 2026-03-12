import React, { useState } from 'react';
import useClickOutside from '../hooks/useClickOutside';

const DelayModal = ({ entry, onClose, onSubmit }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const modalRef = useClickOutside(onClose);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDate) return;
    onSubmit(new Date(selectedDate));
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">⏰ Delay Reminder - {entry.firmName}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select New Reminder Date *</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getMinDate()}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Current delay count: <span className="font-semibold">{entry.delayCount || 0}x</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!selectedDate}
              className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 disabled:bg-orange-400 font-medium text-sm"
            >
              Confirm Delay
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DelayModal;
