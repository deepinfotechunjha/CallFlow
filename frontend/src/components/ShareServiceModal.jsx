import React, { useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const ShareServiceModal = ({ isOpen, onClose }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [linkGenerated, setLinkGenerated] = useState(false);
  const { token } = useAuthStore();

  const generateShareLink = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/share/create-service-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShareUrl(data.shareUrl);
        setLinkGenerated(true);
        toast.success('Service share link generated successfully!');
      } else {
        toast.error(data.error || 'Failed to generate share link');
      }
    } catch (error) {
      console.error('Generate share link error:', error);
      toast.error('Failed to generate share link');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleClose = () => {
    setShareUrl('');
    setLinkGenerated(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl border border-[#E0E2E5] w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 sm:p-6">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#E0E2E5]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF2E46]"></span>
              <h2 className="text-base font-bold text-[#2C2C2C]">Share Carry-In Service Form</h2>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-lg bg-[#F0F2F5] hover:bg-[#FFE8EB] hover:text-[#FF2E46] text-[#666666] flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!linkGenerated ? (
            <div className="text-center">
              <div className="mb-5">
                <div className="w-11 h-11 bg-[#FFE8EB] text-[#FF2E46] rounded-lg flex items-center justify-center mx-auto mb-2.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-[#2C2C2C] mb-1">Generate Service Link</h3>
                <p className="text-xs text-[#666666] leading-relaxed">
                  Create a direct service intake link allowing walk-in or remote customers to submit repair requests.
                </p>
              </div>

              <div className="bg-[#F8F9FA] border border-[#E0E2E5] rounded-lg p-3.5 mb-5 text-left">
                <h4 className="font-bold text-[#2C2C2C] mb-1 text-xs uppercase tracking-wider">Service Link Policy:</h4>
                <ul className="text-xs text-[#666666] space-y-1">
                  <li>• Valid for 24 hours from creation</li>
                  <li>• Single-use submission</li>
                  <li>• Auto-populates Carry-In Service queue</li>
                </ul>
              </div>

              <button
                onClick={generateShareLink}
                disabled={isGenerating}
                className="w-full py-2.5 px-4 bg-[#FF2E46] text-white rounded-lg hover:bg-[#E02038] disabled:opacity-50 text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                    Generating Link...
                  </span>
                ) : (
                  'Generate Service Share Link'
                )}
              </button>
            </div>
          ) : (
            <div>
              <div className="text-center mb-5">
                <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-2.5 border border-emerald-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-[#2C2C2C] mb-1">Service Link Ready</h3>
                <p className="text-xs text-[#666666]">
                  Customer can access the form directly to register their service.
                </p>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1.5">Service Share Link:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-[#F8F9FA] border border-[#E0E2E5] rounded-lg text-xs font-mono text-[#2C2C2C] select-all"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3.5 py-2 bg-[#2C2C2C] text-white rounded-lg hover:bg-[#1A1A1A] transition-colors text-xs font-semibold uppercase tracking-wider whitespace-nowrap shadow-xs"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => {
                    setLinkGenerated(false);
                    setShareUrl('');
                  }}
                  className="flex-1 py-2 px-3 bg-[#F0F2F5] text-[#2C2C2C] rounded-lg hover:bg-[#E0E2E5] text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Generate New
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-2 px-3 bg-[#2C2C2C] text-white rounded-lg hover:bg-[#1A1A1A] text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareServiceModal;