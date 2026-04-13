import React, { useState } from 'react';
import useAuthStore from '../store/authStore';

const SalesEntryCard = ({ entry, onVisitClick, onCallClick, onDetailsClick, onEditClick }) => {
  const { user } = useAuthStore();
  const canEdit = user?.role === 'HOST' || user?.role === 'SALES_ADMIN';
  const [confirmDialog, setConfirmDialog] = useState({ show: false, type: '', number: '' });

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <button
          onClick={() => onDetailsClick(entry)}
          className="text-lg font-bold text-blue-600 hover:text-blue-800 text-left flex-1"
        >
          {entry.firmName}
        </button>
        <div className="flex gap-2 ml-2">
          <button
            onClick={() => handleWhatsApp(entry.whatsappNumber || entry.contactPerson1Number)}
            className="px-2 py-1 bg-green-50 border border-green-200 rounded hover:bg-green-100 text-sm font-medium flex items-center"
          >
            <img src="/whatsapp.png" alt="WhatsApp" className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleCall(entry.contactPerson1Number)}
            className="px-2 py-1 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 text-sm font-medium flex items-center"
          >
            <img src="/call.png" alt="Call" className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="space-y-1 text-sm text-gray-600 mb-3">
        <p><span className="font-medium">GST:</span> {entry.gstNo}</p>
        <p><span className="font-medium">Contact:</span> {entry.contactPerson1Name}</p>
        <p className="text-xs text-gray-500">{entry.contactPerson1Number}</p>
        <p><span className="font-medium">City:</span> {entry.city}</p>
        <p className="font-medium text-gray-700">Logs: {entry.visitCount || 0} visits, {entry.callCount || 0} calls</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onVisitClick(entry)}
          className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium flex items-center justify-center"
          title="Log Visit"
        >
          <img src="/log-visit.png" alt="Log Visit" className="w-5 h-5" />
        </button>
        <button
          onClick={() => onCallClick(entry)}
          className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium flex items-center justify-center"
          title="Log Call"
        >
          <img src="/call-log.png" alt="Log Call" className="w-5 h-5" />
        </button>
        {canEdit && (
          <button
            onClick={() => onEditClick(entry)}
            className="flex-1 px-3 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 text-sm font-medium"
          >
            ✏️
          </button>
        )}
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
    </div>
  );
};

export default SalesEntryCard;
