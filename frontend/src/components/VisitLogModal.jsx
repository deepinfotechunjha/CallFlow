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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Log Visit - {entry.firmName}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Remark (optional)</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
              rows="3"
              placeholder="Add visit notes..."
            />
          </div>

          {/* Location status feedback */}
          {locationStatus === 'requesting' && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Getting your location...
            </div>
          )}
          {locationStatus === 'success' && location && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
              ✓ Location captured (±{Math.round(location.accuracy)}m)
            </div>
          )}
          {locationStatus === 'denied' && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              ✗ {locationError}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-green-400 font-medium text-sm"
            >
              {isSubmitting ? 'Getting location...' : 'Confirm Visit'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VisitLogModal;
