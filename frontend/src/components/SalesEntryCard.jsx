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
    <div className="bg-white rounded-xl shadow-xs border border-[#E0E2E5] p-4 hover:border-[#FF2E46]/40 transition-all">
      <div className="flex justify-between items-start mb-2.5">
        <button
          onClick={() => onDetailsClick(entry)}
          className="text-sm font-bold text-[#2C2C2C] hover:text-[#FF2E46] text-left flex-1 transition-colors"
        >
          {entry.firmName}
        </button>
        <div className="flex gap-1.5 ml-2">
          <button
            onClick={() => handleWhatsApp(entry.whatsappNumber || entry.contactPerson1Number)}
            className="px-2 py-1 bg-[#FFE8EB] text-[#FF2E46] border border-[#FF2E46]/20 rounded-md hover:bg-[#FF2E46] hover:text-white text-xs font-semibold transition-colors flex items-center"
            title="WhatsApp"
          >
            <img src="/whatsapp.png" alt="WhatsApp" className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleCall(entry.contactPerson1Number)}
            className="px-2 py-1 bg-[#F0F2F5] text-[#2C2C2C] border border-[#E0E2E5] rounded-md hover:bg-[#2C2C2C] hover:text-white text-xs font-semibold transition-colors flex items-center"
            title="Call"
          >
            <img src="/call.png" alt="Call" className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="space-y-1 text-xs text-[#666666] mb-3">
        <p><span className="font-semibold text-[#2C2C2C]">GST:</span> {entry.gstNo || '-'}</p>
        <p><span className="font-semibold text-[#2C2C2C]">Contact:</span> {entry.contactPerson1Name} ({entry.contactPerson1Number})</p>
        <p><span className="font-semibold text-[#2C2C2C]">City:</span> {entry.city || '-'}</p>
        <p className="font-semibold text-[#FF2E46] pt-0.5">
          Activity: {entry.visitCount || 0} visits • {entry.callCount || 0} calls
        </p>
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={() => onVisitClick(entry)}
          className="flex-1 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          title="Log Visit"
        >
          <img src="/log-visit.png" alt="Log Visit" className="w-3.5 h-3.5" />
          Visit
        </button>
        <button
          onClick={() => onCallClick(entry)}
          className="flex-1 py-1.5 bg-[#FFE8EB] border border-[#FF2E46]/30 text-[#FF2E46] hover:bg-[#FFD6DC] rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
          title="Log Call"
        >
          <img src="/call-log.png" alt="Log Call" className="w-3.5 h-3.5" />
          Call
        </button>
        {canEdit && (
          <button
            onClick={() => onEditClick(entry)}
            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#2C2C2C] border border-gray-200 rounded-lg text-xs font-semibold transition-colors"
            title="Edit Entry"
          >
            <svg className="w-3.5 h-3.5 text-[#2C2C2C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
      </div>

      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-xl border border-[#E0E2E5]">
            {confirmDialog.type === 'call-unavailable' ? (
              <>
                <h3 className="text-sm font-bold text-[#2C2C2C] mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Desktop Calling
                </h3>
                <p className="text-xs text-[#666666] mb-4">
                  Direct dialing is only supported on mobile devices. Number: <strong className="text-[#2C2C2C]">{confirmDialog.number}</strong>
                </p>
                <button
                  onClick={() => setConfirmDialog({ show: false, type: '', number: '' })}
                  className="w-full py-2 bg-[#2C2C2C] hover:bg-[#1A1A1A] text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  OK
                </button>
              </>
            ) : (
              <>
                <h3 className="text-sm font-bold text-[#2C2C2C] mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {confirmDialog.type === 'whatsapp' ? 'Open WhatsApp?' : 'Make Call?'}
                </h3>
                <p className="text-xs text-[#666666] mb-4">
                  {confirmDialog.type === 'whatsapp' 
                    ? `Open WhatsApp chat with ${confirmDialog.number}?`
                    : `Initiate call to ${confirmDialog.number}?`}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDialog({ show: false, type: '', number: '' })}
                    className="flex-1 py-1.5 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAction}
                    className="flex-1 py-1.5 bg-[#FF2E46] hover:bg-[#E02038] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
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
