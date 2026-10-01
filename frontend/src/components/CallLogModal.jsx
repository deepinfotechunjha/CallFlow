import React, { useState } from 'react';
import useSalesStore from '../store/salesStore';
import useClickOutside from '../hooks/useClickOutside';

const CallLogModal = ({ entry, onClose }) => {
  const [callType, setCallType] = useState('OUTGOING');
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { logCall } = useSalesStore();
  const modalRef = useClickOutside(onClose);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await logCall(entry.id, callType, remark);
      onClose();
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2C2C2C]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div ref={modalRef} className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-[#E0E2E5] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E2E5] bg-[#F8F9FA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFE8EB] text-[#FF2E46] flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#FF2E46] tracking-wider uppercase">COMMUNICATIONS</span>
              <h3 className="text-base font-bold text-[#2C2C2C]">Log Call Activity</h3>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg bg-white text-gray-500 hover:text-[#2C2C2C] hover:bg-gray-100 flex items-center justify-center text-sm transition-colors border border-gray-200"
          >
            ✕
          </button>
        </div>
        <div className="p-5">
          <div className="bg-[#F8F9FA] border border-[#E0E2E5] rounded-lg p-3 mb-4 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Target Firm</span>
            <span className="text-sm font-bold text-[#2C2C2C]">{entry.firmName}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Call Direction <span className="text-[#FF2E46]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setCallType('OUTGOING')}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    callType === 'OUTGOING'
                      ? 'bg-[#2C2C2C] text-white border-[#2C2C2C] shadow-xs'
                      : 'bg-white text-gray-700 border-[#E0E2E5] hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Outgoing
                </button>
                <button
                  type="button"
                  onClick={() => setCallType('RECEIVED')}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    callType === 'RECEIVED'
                      ? 'bg-[#2C2C2C] text-white border-[#2C2C2C] shadow-xs'
                      : 'bg-white text-gray-700 border-[#E0E2E5] hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  Incoming
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Call Remark <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all placeholder:text-gray-400"
                rows="3"
                placeholder="Notes about discussion, customer response, action items..."
              />
            </div>
            <div className="flex gap-2.5 pt-2 border-t border-[#E0E2E5]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 bg-white border border-[#E0E2E5] text-[#2C2C2C] rounded-lg hover:bg-[#F8F9FA] text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 bg-[#FF2E46] text-white rounded-lg hover:bg-[#E02038] disabled:opacity-50 text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
              >
                {isSubmitting ? 'Logging...' : 'Confirm Call'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CallLogModal;
