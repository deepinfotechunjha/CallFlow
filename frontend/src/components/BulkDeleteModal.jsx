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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div ref={modalRef} className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md shadow-xl border border-[#E0E2E5]">
        {step === 1 ? (
          <>
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-[#FFE8EB] text-[#FF2E46] rounded-lg flex items-center justify-center mx-auto mb-3 border border-[#FF2E46]/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-[#2C2C2C] mb-1">Confirm Bulk Deletion</h2>
              <p className="text-xs text-[#666666]">
                You are about to permanently delete <span className="font-bold text-[#FF2E46]">{selectedCount}</span> completed call{selectedCount > 1 ? 's' : ''}.
              </p>
              <p className="text-[11px] text-[#FF2E46] mt-1 font-bold uppercase tracking-wider">
                This action is irreversible
              </p>
            </div>

            <div className="bg-[#F8F9FA] border border-[#E0E2E5] rounded-lg p-3 mb-5">
              <p className="text-xs text-[#666666] leading-relaxed text-center">
                An Excel archive backup will be automatically downloaded before deletion starts.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 bg-[#F0F2F5] text-[#2C2C2C] py-2 px-3 rounded-lg hover:bg-[#E0E2E5] text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFirstConfirm}
                className="flex-1 bg-[#FF2E46] text-white py-2 px-3 rounded-lg hover:bg-[#E02038] text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-[#F0F2F5] text-[#2C2C2C] rounded-lg flex items-center justify-center mx-auto mb-3 border border-[#E0E2E5]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-[#2C2C2C] mb-1">Authorization Password</h2>
              <p className="text-xs text-[#666666]">
                Enter your secret password to authorize permanent deletion
              </p>
            </div>

            <div className="mb-5">
              <input
                type="password"
                value={secretPassword}
                onChange={(e) => setSecretPassword(e.target.value)}
                placeholder="Secret Password"
                className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all placeholder:text-gray-400"
                disabled={isDeleting}
                onKeyPress={(e) => e.key === 'Enter' && handleFinalConfirm()}
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleClose}
                disabled={isDeleting}
                className="flex-1 bg-[#F0F2F5] text-[#2C2C2C] py-2 px-3 rounded-lg hover:bg-[#E0E2E5] text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalConfirm}
                disabled={!secretPassword.trim() || isDeleting}
                className="flex-1 bg-[#FF2E46] text-white py-2 px-3 rounded-lg hover:bg-[#E02038] disabled:opacity-50 text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BulkDeleteModal;
