import React, { useState, useEffect } from 'react';
import useClickOutside from '../hooks/useClickOutside';
import { animateModalSpring } from '../utils/animations';

const ExportModal = ({ isOpen, onClose, onExport, totalCount, filteredCount, title = "Export Data" }) => {
  const [step, setStep] = useState(1);
  const [exportType, setExportType] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const modalRef = useClickOutside(() => onClose());

  useEffect(() => {
    if (isOpen && modalRef.current) {
      animateModalSpring(modalRef.current);
    }
  }, [isOpen, step]);

  if (!isOpen) return null;

  const handleContinue = () => {
    if (!exportType) {
      setError('Please select an export option');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleExport = () => {
    if (!password.trim()) {
      setError('Please enter your secret password');
      return;
    }
    onExport(exportType, password);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div ref={modalRef} className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md border border-[#E0E2E5] shadow-xl">
        {step === 1 ? (
          <>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#E0E2E5]">
              <div>
                <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-[#FF2E46] bg-[#FFE8EB] px-2 py-0.5 rounded-md mb-1 border border-[#FF2E46]/20">
                  Excel Reporting
                </span>
                <h2 className="text-base font-bold text-[#2C2C2C]">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-[#F0F2F5] hover:bg-[#FFE8EB] hover:text-[#FF2E46] text-[#666666] flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-xs text-[#666666] mb-3.5">Choose which dataset scope to generate into Excel:</p>
            
            <div className="space-y-2.5 mb-5">
              <label className={`flex items-start p-3.5 border rounded-lg cursor-pointer transition-all ${
                exportType === 'filtered' ? 'border-[#FF2E46] bg-[#FFE8EB]/20 shadow-xs' : 'border-[#E0E2E5] hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="exportType"
                  value="filtered"
                  checked={exportType === 'filtered'}
                  onChange={(e) => {
                    setExportType(e.target.value);
                    setError('');
                  }}
                  className="mt-0.5 mr-3 text-[#FF2E46] focus:ring-[#FF2E46] accent-[#FF2E46]"
                />
                <div>
                  <div className="font-semibold text-xs text-[#2C2C2C]">Export Filtered Data</div>
                  <div className="text-[11px] text-[#666666] mt-0.5">
                    Exports current view with applied filters ({filteredCount} items)
                  </div>
                </div>
              </label>

              <label className={`flex items-start p-3.5 border rounded-lg cursor-pointer transition-all ${
                exportType === 'all' ? 'border-[#FF2E46] bg-[#FFE8EB]/20 shadow-xs' : 'border-[#E0E2E5] hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="exportType"
                  value="all"
                  checked={exportType === 'all'}
                  onChange={(e) => {
                    setExportType(e.target.value);
                    setError('');
                  }}
                  className="mt-0.5 mr-3 text-[#FF2E46] focus:ring-[#FF2E46] accent-[#FF2E46]"
                />
                <div>
                  <div className="font-semibold text-xs text-[#2C2C2C]">Export All Data</div>
                  <div className="text-[11px] text-[#666666] mt-0.5">
                    Exports complete dataset ({totalCount} items)
                  </div>
                </div>
              </label>
            </div>

            {error && (
              <div className="mb-3.5 p-2.5 bg-[#FFE8EB] border border-[#FF2E46]/30 rounded-lg text-[#FF2E46] text-xs font-medium">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 px-3 bg-[#F0F2F5] hover:bg-[#E0E2E5] text-[#2C2C2C] rounded-lg font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                className="flex-1 py-2 px-3 bg-[#FF2E46] hover:bg-[#E02038] text-white rounded-lg font-semibold text-xs shadow-xs transition-colors"
              >
                Next Step →
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#E0E2E5]">
              <div>
                <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-[#FF2E46] bg-[#FFE8EB] px-2 py-0.5 rounded-md mb-1 border border-[#FF2E46]/20">
                  Authorization
                </span>
                <h2 className="text-base font-bold text-[#2C2C2C]">Security Verification</h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-[#F0F2F5] hover:bg-[#FFE8EB] hover:text-[#FF2E46] text-[#666666] flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-[#666666] mb-3.5">
              Enter your master security password to authorize downloading confidential data.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1.5">
                Secret Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleExport()}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-[#E0E2E5] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FF2E46]/20 focus:border-[#FF2E46] text-[#2C2C2C] transition-all"
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-3.5 p-2.5 bg-[#FFE8EB] border border-[#FF2E46]/30 rounded-lg text-[#FF2E46] text-xs font-medium">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-2 px-3 bg-[#F0F2F5] hover:bg-[#E02038] hover:text-white text-[#2C2C2C] rounded-lg font-semibold text-xs transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleExport}
                className="flex-1 py-2 px-3 bg-[#FF2E46] hover:bg-[#E02038] text-white rounded-lg font-semibold text-xs shadow-xs transition-colors"
              >
                Download Excel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExportModal;
