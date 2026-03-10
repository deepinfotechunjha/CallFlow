import React from 'react';
import useAuthStore from '../store/authStore';

const SalesEntryTable = ({ entries, onVisitClick, onCallClick, onDetailsClick, onEditClick }) => {
  const { user } = useAuthStore();
  const canEdit = user?.role === 'HOST' || user?.role === 'SALES_EXECUTIVE';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Firm Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">GST No</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">City</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Logs</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entries.map(entry => (
              <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <button
                    onClick={() => onDetailsClick(entry)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    {entry.firmName}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{entry.gstNo?.substring(0, 10)}...</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {entry.contactPerson1Name}<br/>
                  <span className="text-xs text-gray-500">{entry.contactPerson1Number}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{entry.city}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-700">
                  {entry.visitCount || 0}V, {entry.callCount || 0}C
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onVisitClick(entry)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium"
                      title="Log Visit"
                    >
                      👁️ Visit
                    </button>
                    <button
                      onClick={() => onCallClick(entry)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
                      title="Log Call"
                    >
                      📞 Call
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => onEditClick(entry)}
                        className="px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 text-sm font-medium"
                        title="Edit Entry"
                      >
                        ✏️ Edit
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesEntryTable;
