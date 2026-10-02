import React, { useEffect } from 'react';
import useClickOutside from '../hooks/useClickOutside';
import { animateModalSpring } from '../utils/animations';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  const modalRef = useClickOutside(() => onCancel());
  
  useEffect(() => {
    if (isOpen && modalRef.current) {
      animateModalSpring(modalRef.current);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div ref={modalRef} className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md shadow-xl border border-[#E0E2E5]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-[#FFE8EB] text-[#FF2E46] flex items-center justify-center border border-[#FF2E46]/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-[#2C2C2C]">{title}</h2>
        </div>
        <p className="text-xs text-[#666666] mb-5 leading-relaxed">{message}</p>
        
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 bg-[#F0F2F5] text-[#2C2C2C] py-2 px-3 rounded-lg hover:bg-[#E0E2E5] text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#FF2E46] text-white py-2 px-3 rounded-lg hover:bg-[#E02038] text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
