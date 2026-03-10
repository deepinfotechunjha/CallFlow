import React from 'react';

const SalesEntryCard = ({ entry, onVisitClick, onCallClick, onDetailsClick }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <button
        onClick={() => onDetailsClick(entry)}
        className="text-lg font-bold text-blue-600 hover:text-blue-800 mb-2 text-left w-full"
      >
        {entry.firmName}
      </button>
      <div className="space-y-1 text-sm text-gray-600 mb-3">
        <p><span className="font-medium">GST:</span> {entry.gstNo}</p>
        <p><span className="font-medium">Contact:</span> {entry.contactPerson1Name}</p>
        <p className="text-xs text-gray-500">{entry.contactPerson1Number}</p>
        <p><span className="font-medium">City:</span> {entry.city}</p>
        <p className="font-medium text-gray-700">Logs: {entry.visitCount || 0} visits, {entry.callCount || 0} calls</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onVisitClick(entry)}
          className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium"
        >
          👁️ Visit
        </button>
        <button
          onClick={() => onCallClick(entry)}
          className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
        >
          📞 Call
        </button>
      </div>
    </div>
  );
};

export default SalesEntryCard;
