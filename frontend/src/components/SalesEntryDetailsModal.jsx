import React, { useState, useEffect } from 'react';
import useSalesStore from '../store/salesStore';
import useClickOutside from '../hooks/useClickOutside';

const SalesEntryDetailsModal = ({ entry, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getEntryDetails } = useSalesStore();
  const modalRef = useClickOutside(onClose);

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

            <div>
              <h3 className="font-semibold text-gray-800 mb-3">📅 Activity Timeline</h3>
              {details.logs && details.logs.length > 0 ? (
                <div className="space-y-3">
                  {details.logs.map(log => (
                    <div key={log.id} className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-start justify-between">
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
                        </div>
                      </div>
                    </div>
                  ))}
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
    </div>
  );
};

export default SalesEntryDetailsModal;
