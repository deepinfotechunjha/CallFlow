import React from 'react';

const ReminderTable = ({ reminders, onCallClick, onVisitClick, onDelayClick }) => {
  const getDaysOverdue = (reminderDate) => {
    if (!reminderDate) return 0;
    const now = new Date();
    const reminder = new Date(reminderDate);
    const diff = Math.floor((now - reminder) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Firm Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                City
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Visits
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Calls
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Overdue
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Delays
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reminders.map((entry) => {
              const daysOverdue = getDaysOverdue(entry.reminderDate);
              return (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-800">{entry.firmName}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{entry.city}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{entry.contactPerson1Number}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                      {entry.visitCount || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                      {entry.callCount || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">
                      {daysOverdue}d
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {entry.delayCount > 0 ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="inline-flex items-center justify-center bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full">
                          {entry.delayCount}x
                        </span>
                        <span className="text-xs text-gray-500 truncate max-w-[100px]" title={entry.delayedBy?.join(', ')}>
                          {entry.delayedBy?.[entry.delayedBy.length - 1] || 'N/A'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onCallClick(entry)}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 font-medium text-xs transition-colors"
                        title="Log Call"
                      >
                        📞
                      </button>
                      <button
                        onClick={() => onVisitClick(entry)}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium text-xs transition-colors"
                        title="Log Visit"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => onDelayClick(entry)}
                        className="bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 font-medium text-xs transition-colors"
                        title="Delay Reminder"
                      >
                        ⏰
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReminderTable;
