import React, { useState } from 'react';
import useAuthStore from '../store/authStore';

const SalesEntryTable = ({ entries, onVisitClick, onCallClick, onDetailsClick, onEditClick, salesLogs = [], salesExecutiveFilter = 'ALL', dateRange = {}, entryFilter = 'ALL' }) => {
  const { user } = useAuthStore();
  const canEdit = user?.role === 'HOST' || user?.role === 'SALES_ADMIN';
  const [confirmDialog, setConfirmDialog] = useState({ show: false, type: '', number: '' });

  const isDateFilterActive = dateRange.startDate || dateRange.endDate;

  const isInDateRange = (dateString) => {
    if (!dateString || !isDateFilterActive) return true;
    const d = new Date(dateString);
    if (dateRange.startDate) {
      const start = new Date(dateRange.startDate);
      start.setHours(0, 0, 0, 0);
      if (d < start) return false;
    }
    if (dateRange.endDate) {
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  };

  const getFilteredLogCount = (entryId, logType) =>
    salesLogs.filter(l =>
      l.salesEntryId === entryId &&
      l.logType === logType &&
      (entryFilter === 'CREATED_BY' || salesExecutiveFilter === 'ALL' || l.loggedBy === salesExecutiveFilter) &&
      isInDateRange(l.loggedAt)
    ).length;

  const handleWhatsApp = (number) => {
    setConfirmDialog({ show: true, type: 'whatsapp', number });
  };

  const handleCall = (number) => {
    // Check if device is mobile/tablet
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 1024;
    
    if (isMobile) {
      setConfirmDialog({ show: true, type: 'call', number });
    } else {
      setConfirmDialog({ show: true, type: 'call-unavailable', number });
    }
  };

  const confirmAction = () => {
    const { type, number } = confirmDialog;
    if (type === 'whatsapp') {
      window.open(`https://wa.me/${number.replace(/[^0-9]/g, '')}`, '_blank');
    } else if (type === 'call') {
      window.location.href = `tel:${number}`;
    }
    setConfirmDialog({ show: false, type: '', number: '' });
  };

  return (
    <>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">LogF</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Quick Contact</th>
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
                <td className="px-4 py-3 text-sm font-medium">
                  <span className="text-teal-700">{getFilteredLogCount(entry.id, 'VISIT')}V</span>, <span className="text-pink-700">{getFilteredLogCount(entry.id, 'CALL')}C</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleWhatsApp(entry.whatsappNumber || entry.contactPerson1Number)}
                      className="px-3 py-1 bg-green-50 border border-green-200 rounded hover:bg-green-100 text-sm font-medium flex items-center gap-1"
                      title="WhatsApp"
                    >
                      <img src="/whatsapp.png" alt="WhatsApp" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCall(entry.contactPerson1Number)}
                      className="px-3 py-1 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 text-sm font-medium flex items-center gap-1"
                      title="Call"
                    >
                      <img src="/call.png" alt="Call" className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onVisitClick(entry)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium flex items-center justify-center"
                      title="Log Visit"
                    >
                      <img src="/log-visit.png" alt="Log Visit" className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onCallClick(entry)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium flex items-center justify-center"
                      title="Log Call"
                    >
                      <img src="/call-log.png" alt="Log Call" className="w-5 h-5" />
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => onEditClick(entry)}
                        className="px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 text-sm font-medium"
                        title="Edit Entry"
                      >
                        ✏️
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

    {confirmDialog.show && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
          {confirmDialog.type === 'call-unavailable' ? (
            <>
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                📞 Call Feature
              </h3>
              <p className="text-gray-600 mb-6">
                This feature is only available on mobile devices.
              </p>
              <button
                onClick={() => setConfirmDialog({ show: false, type: '', number: '' })}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                OK
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {confirmDialog.type === 'whatsapp' ? '💬 Open WhatsApp?' : '📞 Make Call?'}
              </h3>
              <p className="text-gray-600 mb-6">
                {confirmDialog.type === 'whatsapp' 
                  ? `Open WhatsApp chat with ${confirmDialog.number}?`
                  : `Call ${confirmDialog.number}?`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDialog({ show: false, type: '', number: '' })}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Confirm
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
};

export default SalesEntryTable;
