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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold">{entry.firmName} - Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : details ? (
          <>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">📋 Firm Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <p><span className="font-medium">GST:</span> {details.gstNo}</p>
                <p><span className="font-medium">Email:</span> {details.email || 'N/A'}</p>
                <p><span className="font-medium">Contact-1:</span> {details.contactPerson1Name} ({details.contactPerson1Number})</p>
                {details.whatsappNumber && (
                  <p><span className="font-medium">WhatsApp:</span> {details.whatsappNumber}</p>
                )}
                {details.contactPerson2Name && (
                  <p><span className="font-medium">Contact-2:</span> {details.contactPerson2Name} ({details.contactPerson2Number})</p>
                )}
                {details.accountContactName && (
                  <p><span className="font-medium">Account:</span> {details.accountContactName} ({details.accountContactNumber})</p>
                )}
                <p className="md:col-span-2"><span className="font-medium">Address:</span> {details.address}, {details.city} - {details.pincode}</p>
                {details.landmark && <p><span className="font-medium">Landmark:</span> {details.landmark}</p>}
                {details.area && <p><span className="font-medium">Area:</span> {details.area}</p>}
              </div>
            </div>

            {details.address && (
              <div className="bg-white rounded-lg mb-6 overflow-hidden border border-gray-200">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">📍 Location</h3>
                  <p className="text-xs text-gray-500">Based on the provided address</p>
                </div>
                <iframe
                  title={`Map - ${details.firmName}`}
                  src={getEmbedMapUrl(details.address, details.city, details.pincode)}
                  className="w-full h-52"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => window.open(getMapUrl(details.address, details.city, details.pincode), '_blank')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm"
                  >
                    Open in Google Maps
                  </button>
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">ℹ️ Entry Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <p><span className="font-medium">Created By:</span> {details.createdBy}</p>
                <p><span className="font-medium">Created On:</span> {new Date(details.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-3">📅 Activity Timeline</h3>
              {details.logs && details.logs.length > 0 ? (
                <div className="space-y-3">
                  {details.logs.map(log => {
                    const whatsappNumber = details?.whatsappNumber || details?.contactPerson1Number;
                    const callNumber = details?.contactPerson1Number;
                    return (
                    <div key={log.id} className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {log.logType === 'VISIT' ? '👁️ Visit' : `📞 Call (${log.callType})`}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            By: {log.loggedBy} • {new Date(log.loggedAt).toLocaleString()}
                          </p>
                          {log.remark && (
                            <p className="text-sm text-gray-700 mt-2 italic">"{log.remark}"</p>
                          )}
                          
                          {/* Debug info */}
                          <div className="text-xs text-gray-400 mt-1">
                            Lat: {log.latitude || 'null'} | Long: {log.longitude || 'null'}
                          </div>
                          
                          {log.logType === 'VISIT' && log.latitude && log.longitude && (
                            <div className="mt-2">
                              <a
                                href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                              >
                                📍 View Location
                                {log.locationAccuracy && (
                                  <span className="text-gray-600">(±{Math.round(log.locationAccuracy)}m)</span>
                                )}
                              </a>
                            </div>
                          )}
                        </div>

                        {(whatsappNumber || callNumber) && (
                          <div className="flex gap-2 items-start">
                            {whatsappNumber && (
                              <button
                                onClick={() => handleWhatsApp(whatsappNumber)}
                                className="px-3 py-1 bg-green-50 border border-green-200 rounded hover:bg-green-100 text-sm font-medium flex items-center gap-1"
                                title="WhatsApp"
                              >
                                <img src="/whatsapp.png" alt="WhatsApp" className="w-4 h-4" />
                              </button>
                            )}
                            {callNumber && (
                              <button
                                onClick={() => handleCall(callNumber)}
                                className="px-3 py-1 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 text-sm font-medium flex items-center gap-1"
                                title="Call"
                              >
                                <img src="/call.png" alt="Call" className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No activity logs yet</p>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={onClose}
                className="w-full bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 font-medium"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 py-8">Failed to load details</p>
        )}
      </div>

      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div
            className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
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

export default SalesEntryDetailsModal;
