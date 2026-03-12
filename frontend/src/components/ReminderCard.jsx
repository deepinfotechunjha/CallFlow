import React from 'react';

const ReminderCard = ({ entry, onCallClick, onVisitClick, onDelayClick }) => {
  const getDaysOverdue = () => {
    if (!entry.reminderDate) return 0;
    const now = new Date();
    const reminder = new Date(entry.reminderDate);
    const diff = Math.floor((now - reminder) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysOverdue = getDaysOverdue();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-800 mb-1">{entry.firmName}</h3>
          <p className="text-sm text-gray-600">{entry.city}</p>
        </div>
        {daysOverdue > 0 && (
          <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">
            {daysOverdue}d overdue
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">📞</span>
          <span className="text-gray-700">{entry.contactPerson1Number}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">👁️</span>
          <span className="text-gray-700">Visits: {entry.visitCount || 0}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">📞</span>
          <span className="text-gray-700">Calls: {entry.callCount || 0}</span>
        </div>
      </div>

      {entry.delayCount > 0 && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-yellow-700 font-semibold text-sm">
              Delayed {entry.delayCount}x
            </span>
          </div>
          <div className="text-xs text-yellow-600">
            By: {entry.delayedBy?.join(', ') || 'N/A'}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onCallClick}
          className="bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 font-medium text-sm transition-colors"
        >
          📞 Call
        </button>
        <button
          onClick={onVisitClick}
          className="bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
        >
          👁️ Visit
        </button>
        <button
          onClick={onDelayClick}
          className="bg-orange-600 text-white py-2 px-3 rounded-lg hover:bg-orange-700 font-medium text-sm transition-colors"
        >
          ⏰ Delay
        </button>
      </div>
    </div>
  );
};

export default ReminderCard;
