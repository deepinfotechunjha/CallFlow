import React, { useState } from 'react';
import useClickOutside from '../hooks/useClickOutside';

const BulkDeleteModal = ({ isOpen, onClose, onConfirm, selectedCount }) => {
  const [step, setStep] = useState(1);
  const [secretPassword, setSecretPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const modalRef = useClickOutside(() => {
    if (!isDeleting) {
      handleClose();
    }
  });

  const handleClose = () => {
    setStep(1);
    setSecretPassword('');
    setIsDeleting(false);
    onClose();
  };

  const handleFirstConfirm = () => {
    setStep(2);
  };

  const handleFinalConfirm = async () => {
    if (!secretPassword.trim()) return;
    setIsDeleting(true);
    try {
      await onConfirm(secretPassword);
      handleClose();
    } catch (error) {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        {step === 1 ? (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Confirm Bulk Deletion</h2>
              <p className="text-gray-700">
                You are about to permanently delete <span className="font-bold text-red-600">{selectedCount}</span> completed call{selectedCount > 1 ? 's' : ''}.
              </p>
              <p className="text-sm text-red-500 mt-2 font-semibold">
                This action is IRREVERSIBLE!
              </p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📋</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    An Excel backup will be automatically downloaded before deletion.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleFirstConfirm}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-semibold transition-colors"
              >
                Continue
              </button>
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Enter Secret Password</h2>
              <p className="text-gray-600">
                Enter your secret password to confirm deletion
              </p>
            </div>

            <div className="mb-6">
              <input
                type="password"
                value={secretPassword}
                onChange={(e) => setSecretPassword(e.target.value)}
                placeholder="Secret Password"
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                disabled={isDeleting}
                onKeyPress={(e) => e.key === 'Enter' && handleFinalConfirm()}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleFinalConfirm}
                disabled={!secretPassword.trim() || isDeleting}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                  isDeleting || !secretPassword.trim()
                    ? 'bg-red-400 text-white cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
              <button
                onClick={handleClose}
                disabled={isDeleting}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BulkDeleteModal;
