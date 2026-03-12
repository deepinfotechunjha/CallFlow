import React, { useState } from 'react';
import useSalesStore from '../store/salesStore';
import useClickOutside from '../hooks/useClickOutside';

const VisitLogModal = ({ entry, onClose }) => {
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, requesting, success, denied, error
  const [location, setLocation] = useState(null);
  const { logVisit } = useSalesStore();
  const modalRef = useClickOutside(onClose);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }

    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setLocationStatus('success');
      },
      (error) => {
        console.error('Location error:', error);
        setLocationStatus('denied');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await logVisit(entry.id, remark, location);
      onClose();
    } catch (error) {
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
          
          {/* Location Capture */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">📍 Location</span>
              {locationStatus === 'success' && (
                <span className="text-xs text-green-600 font-medium">✓ Captured</span>
              )}
              {locationStatus === 'denied' && (
                <span className="text-xs text-red-600 font-medium">✗ Denied</span>
              )}
            </div>
            
            {locationStatus === 'idle' && (
              <button
                type="button"
                onClick={captureLocation}
                className="w-full bg-blue-100 text-blue-700 py-2 rounded hover:bg-blue-200 text-sm font-medium"
              >
                📍 Capture Location
              </button>
            )}
            
            {locationStatus === 'requesting' && (
              <div className="text-center py-2 text-sm text-gray-600">
                <div className="animate-pulse">🔍 Getting location...</div>
              </div>
            )}
            
            {locationStatus === 'success' && location && (
              <div className="text-xs text-gray-600 space-y-1">
                <div>Lat: {location.latitude.toFixed(6)}</div>
                <div>Long: {location.longitude.toFixed(6)}</div>
                <div>Accuracy: ±{Math.round(location.accuracy)}m</div>
                <button
                  type="button"
                  onClick={captureLocation}
                  className="text-blue-600 hover:underline mt-1"
                >
                  Recapture
                </button>
              </div>
            )}
            
            {locationStatus === 'denied' && (
              <div className="text-xs text-red-600">
                Location permission denied. Visit will be logged without location.
                <button
                  type="button"
                  onClick={captureLocation}
                  className="text-blue-600 hover:underline ml-2"
                >
                  Try Again
                </button>
              </div>
            )}
            
            {locationStatus === 'error' && (
              <div className="text-xs text-red-600">
                Location not supported on this device.
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-green-400 font-medium text-sm"
            >
              {isSubmitting ? 'Logging...' : 'Confirm Visit'}
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
