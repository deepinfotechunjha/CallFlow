import React, { useState, useEffect } from 'react';
import useSalesStore from '../store/salesStore';
import useClickOutside from '../hooks/useClickOutside';

const SalesEntryDetailsModal = ({ entry, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ show: false, type: '', number: '' });
  const { getEntryDetails } = useSalesStore();
  const modalRef = useClickOutside(onClose);

  const getMapUrl = (address, city, pincode) => {
    const query = `${address}${city ? `, ${city}` : ''}${pincode ? `, ${pincode}` : ''}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const getEmbedMapUrl = (address, city, pincode) => {
    const query = `${address}${city ? `, ${city}` : ''}${pincode ? `, ${pincode}` : ''}`;
    return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  };

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

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await getEntryDetails(entry.id);
        setDetails(data);
      } catch (error) {
        console.error('Failed to fetch details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [entry.id, getEntryDetails]);

  return (
    <div className="fixed inset-0 bg-[#2C2C2C]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div ref={modalRef} className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E0E2E5]">
        <div className="flex justify-between items-start pb-4 mb-4 border-b border-[#E0E2E5]">
          <div>
            <span className="inline-block text-[#FF2E46] text-[10px] font-bold uppercase tracking-wider bg-[#FFE8EB] px-2.5 py-0.5 rounded-md mb-1 border border-[#FF2E46]/20">
              CLIENT DOSSIER
            </span>
            <h2 className="text-xl font-bold text-[#2C2C2C]">{entry.firmName}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg bg-white text-gray-500 hover:text-[#2C2C2C] hover:bg-gray-100 flex items-center justify-center text-sm transition-colors border border-gray-200"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-3 border-[#FF2E46] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : details ? (
          <>
            <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E0E2E5] mb-5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#2C2C2C] mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Firm Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <p><strong className="text-[#2C2C2C]">GST:</strong> <span className="font-mono font-semibold">{details.gstNo}</span></p>
                <p><strong className="text-[#2C2C2C]">Email:</strong> {details.email || 'N/A'}</p>

                <div className="flex items-center justify-between col-span-1 md:col-span-2 pt-2 border-t border-[#E0E2E5]">
                  <div>
                    <strong className="text-[#2C2C2C]">Contact 1:</strong> {details.contactPerson1Name} ({details.contactPerson1Number})
                  </div>
                  {details.contactPerson1Number && (
                    <button
                      onClick={() => handleCall(details.contactPerson1Number)}
                      className="px-3 py-1 bg-[#2C2C2C] text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5"
                      title="Call Contact-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call
                    </button>
                  )}
                </div>

                {details.whatsappNumber && (
                  <div className="flex items-center justify-between col-span-1 md:col-span-2 pt-2 border-t border-[#E0E2E5]">
                    <div>
                      <strong className="text-[#2C2C2C]">WhatsApp:</strong> {details.whatsappNumber}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleWhatsApp(details.whatsappNumber)}
                        className="px-3 py-1 bg-[#FFE8EB] text-[#FF2E46] border border-[#FF2E46]/20 rounded-lg text-xs font-semibold hover:bg-[#FF2E46] hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Chat
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {details.address && (
              <div className="bg-white rounded-xl mb-5 overflow-hidden border border-[#E0E2E5] shadow-xs">
                <div className="bg-[#F8F9FA] px-4 py-2.5 border-b border-[#E0E2E5] flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#2C2C2C] flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Location Map
                    </h3>
                    <p className="text-[11px] text-[#666666]">{details.address}, {details.city} {details.pincode}</p>
                  </div>
                  <button
                    onClick={() => window.open(getMapUrl(details.address, details.city, details.pincode), '_blank')}
                    className="px-3 py-1.5 bg-[#2C2C2C] hover:bg-black text-white text-xs font-semibold rounded-lg transition-all"
                  >
                    Open Maps ↗
                  </button>
                </div>
                <iframe
                  title={`Map - ${details.firmName}`}
                  src={getEmbedMapUrl(details.address, details.city, details.pincode)}
                  className="w-full h-44 border-0"
                  loading="lazy"
                />
              </div>
            )}

            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#2C2C2C] mb-2.5 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Activity Logs
              </h3>
              {details.logs && details.logs.length > 0 ? (
                <div className="space-y-2 max-h-44 overflow-y-auto divide-y divide-[#E0E2E5] border border-[#E0E2E5] rounded-lg p-3 bg-white">
                  {details.logs.map(log => (
                    <div key={log.id} className="pt-2 first:pt-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-[#2C2C2C]">
                            {log.logType === 'VISIT' ? 'Field Visit' : `Outbound Call (${log.callType})`}
                          </p>
                          <p className="text-[11px] text-[#666666]">
                            By {log.loggedBy} • {new Date(log.loggedAt).toLocaleDateString()}
                          </p>
                          {log.remark && (
                            <p className="text-xs text-[#2C2C2C] mt-1 italic">"{log.remark}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#666666] text-center py-4 bg-[#F8F9FA] rounded-lg border border-[#E0E2E5]">No activity recorded yet</p>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-[#E0E2E5]">
              <button
                onClick={onClose}
                className="w-full py-2 bg-[#2C2C2C] hover:bg-black text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-all"
              >
                Close Dossier
              </button>
            </div>
          </>
        ) : (
          <p className="text-center text-xs text-[#666666] py-8">Failed to load details</p>
        )}
      </div>

      {confirmDialog.show && (
        <div className="fixed inset-0 bg-[#2C2C2C]/60 backdrop-blur-xs flex items-center justify-center z-60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-2xl border border-[#E0E2E5]">
            <h3 className="text-base font-bold text-[#2C2C2C] mb-1">
              {confirmDialog.type === 'whatsapp' ? 'Open WhatsApp?' : 'Make Phone Call?'}
            </h3>
            <p className="text-xs text-[#666666] mb-4 font-mono">
              Contact: {confirmDialog.number}
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmDialog({ show: false, type: '', number: '' })}
                className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F8F9FA] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className="flex-1 py-2 bg-[#FF2E46] hover:bg-[#E02038] text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesEntryDetailsModal;
