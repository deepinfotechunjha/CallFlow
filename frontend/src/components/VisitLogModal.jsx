import React, { useState } from 'react';
import useSalesStore from '../store/salesStore';
import useClickOutside from '../hooks/useClickOutside';

const VisitLogModal = ({ entry, onClose }) => {
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle | requesting | success | denied | error
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const { logVisit } = useSalesStore();
  const modalRef = useClickOutside(onClose);

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported on this device.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }),
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            reject(new Error('Location permission denied. Please allow location access and try again.'));
          } else if (error.code === error.TIMEOUT) {
            reject(new Error('Location request timed out. Please try again.'));
          } else {
            reject(new Error('Unable to get location. Please try again.'));
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setLocationStatus('requesting');
    setLocationError('');

    try {
      const coords = await getLocation();
      setLocation(coords);
      setLocationStatus('success');
      await logVisit(entry.id, remark, coords);
      onClose();
    } catch (error) {
      setLocationStatus('denied');
      setLocationError(error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div ref={modalRef} className="bg-white rounded-xl w-full max-w-md shadow-xl border border-[#E0E2E5] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E2E5] bg-[#F8F9FA]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF2E46]"></span>
            <h3 className="text-base font-bold text-[#2C2C2C]">Log Field Visit</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-7 h-7 rounded-lg bg-white text-[#666666] hover:text-[#FF2E46] hover:bg-[#FFE8EB] flex items-center justify-center transition-colors border border-[#E0E2E5]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">
          <div className="bg-[#F8F9FA] border border-[#E0E2E5] rounded-lg p-3 mb-4 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-[#666666] tracking-wider">Target Firm</span>
            <span className="text-xs font-bold text-[#2C2C2C]">{entry.firmName}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1">
                Visit Remark <span className="text-[#666666] font-normal text-xs">(optional)</span>
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all placeholder:text-gray-400"
                rows="3"
                placeholder="Details of client visit, stock check, order pitch..."
              />
            </div>

            {/* Location status feedback */}
            {locationStatus === 'requesting' && (
              <div className="flex items-center gap-2 text-xs font-semibold text-[#FF2E46] bg-[#FFE8EB] border border-[#FF2E46]/30 rounded-lg p-2.5">
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-[#FF2E46] border-t-transparent"></div>
                Acquiring high-accuracy GPS coordinates...
              </div>
            )}
            {locationStatus === 'success' && location && (
              <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                GPS Coordinates Captured (±{Math.round(location.accuracy)}m accuracy)
              </div>
            )}
            {locationStatus === 'denied' && (
              <div className="text-xs font-semibold text-[#FF2E46] bg-[#FFE8EB] border border-[#FF2E46]/30 rounded-lg p-2.5">
                {locationError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-2 px-3 bg-[#F0F2F5] text-[#2C2C2C] rounded-lg hover:bg-[#E02038] hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2 px-3 bg-[#FF2E46] text-white rounded-lg hover:bg-[#E02038] disabled:opacity-50 text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
              >
                {isSubmitting ? 'Acquiring GPS...' : 'Confirm Visit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VisitLogModal;
