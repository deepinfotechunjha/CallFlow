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
    <div className="bg-white rounded-xl shadow-xs border border-[#E0E2E5] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#2C2C2C]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Firm Name</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">GST No</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">City</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Logs</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Filtered</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Quick Connect</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E0E2E5]">
            {entries.map((entry, idx) => (
              <tr key={entry.id} className={`hover:bg-[#F8F9FA] transition-colors ${idx % 2 === 0 ? 'bg-[#F8F9FA]/50' : 'bg-white'}`}>
                <td className="px-4 py-3 border-r border-[#E0E2E5]">
                  <button
                    onClick={() => onDetailsClick(entry)}
                    className="text-[#2C2C2C] hover:text-[#FF2E46] font-semibold text-xs text-left transition-colors"
                  >
                    {entry.firmName}
                  </button>
                </td>
                <td className="px-4 py-3 text-xs font-mono text-[#666666] border-r border-[#E0E2E5]">{entry.gstNo || '-'}</td>
                <td className="px-4 py-3 text-xs text-[#2C2C2C] border-r border-[#E0E2E5]">
                  <div className="font-semibold">{entry.contactPerson1Name || '-'}</div>
                  <span className="text-[11px] text-[#666666]">{entry.contactPerson1Number}</span>
                </td>
                <td className="px-4 py-3 text-xs text-[#666666] font-medium border-r border-[#E0E2E5]">{entry.city}</td>
                <td className="px-4 py-3 text-xs font-bold text-[#2C2C2C] border-r border-[#E0E2E5]">
                  <span className="inline-flex items-center gap-1 bg-[#F0F2F5] px-2 py-0.5 rounded-md text-[11px]">
                    {entry.visitCount || 0}V &bull; {entry.callCount || 0}C
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-bold border-r border-[#E0E2E5]">
                  <span className="text-[#FF2E46]">{getFilteredLogCount(entry.id, 'VISIT')}V</span>, <span className="text-[#2C2C2C]">{getFilteredLogCount(entry.id, 'CALL')}C</span>
                </td>
                <td className="px-4 py-3 border-r border-[#E0E2E5]">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleWhatsApp(entry.whatsappNumber || entry.contactPerson1Number)}
                      className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 text-xs font-medium flex items-center gap-1 transition-colors"
                      title="WhatsApp"
                    >
                      <img src="/whatsapp.png" alt="WhatsApp" className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCall(entry.contactPerson1Number)}
                      className="px-2 py-1 bg-[#FFE8EB] border border-[#FF2E46]/30 rounded-md hover:bg-[#FF2E46]/20 text-xs font-medium flex items-center gap-1 transition-colors"
                      title="Call"
                    >
                      <img src="/call.png" alt="Call" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onVisitClick(entry)}
                      className="px-2 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-md hover:bg-purple-100 text-xs font-semibold flex items-center justify-center transition-colors shadow-xs"
                      title="Log Visit"
                    >
                      <img src="/log-visit.png" alt="Log Visit" className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onCallClick(entry)}
                      className="px-2 py-1 bg-[#FFE8EB] border border-[#FF2E46]/30 text-[#FF2E46] rounded-md hover:bg-[#FFD6DC] text-xs font-semibold flex items-center justify-center transition-colors shadow-xs"
                      title="Log Call"
                    >
                      <img src="/call-log.png" alt="Log Call" className="w-3.5 h-3.5" />
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => onEditClick(entry)}
                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-[#2C2C2C] border border-gray-200 rounded-md text-xs font-semibold transition-colors"
                        title="Edit Entry"
                      >
                        <svg className="w-3.5 h-3.5 text-[#2C2C2C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
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
                Direct phone dialing is supported on mobile devices. Number: <strong className="text-[#2C2C2C]">{confirmDialog.number}</strong>
              </p>
              <button
                onClick={() => setConfirmDialog({ show: false, type: '', number: '' })}
                className="w-full py-2 bg-[#2C2C2C] hover:bg-[#1A1A1A] text-white rounded-lg font-semibold text-xs transition-colors"
              >
                Understood
              </button>
            </>
          ) : (
            <>
              <h3 className="text-sm font-bold text-[#2C2C2C] mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {confirmDialog.type === 'whatsapp' ? 'Launch WhatsApp' : 'Place Call'}
              </h3>
              <p className="text-xs text-[#666666] mb-4">
                {confirmDialog.type === 'whatsapp' 
                  ? `Open WhatsApp conversation with ${confirmDialog.number}?`
                  : `Initiate phone call with ${confirmDialog.number}?`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDialog({ show: false, type: '', number: '' })}
                  className="flex-1 py-1.5 bg-[#F0F2F5] hover:bg-[#E02038] hover:text-white text-[#2C2C2C] rounded-lg font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className="flex-1 py-1.5 bg-[#FF2E46] hover:bg-[#E02038] text-white rounded-lg font-semibold text-xs shadow-xs transition-colors"
                >
                  Proceed
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
