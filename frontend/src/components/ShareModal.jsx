import React, { useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const ShareModal = ({ isOpen, onClose }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [linkGenerated, setLinkGenerated] = useState(false);
  const { token } = useAuthStore();

  const generateShareLink = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/share/create-link`, {
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
        toast.success('Share link generated successfully!');
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm sm:max-w-md max-h-[95vh] overflow-y-auto border border-[#E0E2E5]">
        <div className="p-5 sm:p-6">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#E0E2E5]">
            <h2 className="text-base font-bold text-[#2C2C2C] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF2E46]"></span>
              Share Call Form
            </h2>
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
              <div className="mb-4">
                <div className="w-11 h-11 bg-[#FFE8EB] text-[#FF2E46] rounded-lg flex items-center justify-center mx-auto mb-2.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-[#2C2C2C] mb-1">Generate Public Intake Link</h3>
                <p className="text-[#666666] text-xs">
                  Create a secure, one-time link that allows customers or staff to submit ticket details directly.
                </p>
              </div>

              <div className="bg-[#F8F9FA] border border-[#E0E2E5] rounded-lg p-3.5 mb-4 text-left text-xs text-[#666666] space-y-1">
                <p className="font-bold text-[#2C2C2C]">Security &amp; Policy:</p>
                <p>&bull; Link expires automatically after 24 hours</p>
                <p>&bull; Can be submitted only once</p>
                <p>&bull; Directly logs to CallFlow database</p>
              </div>

              <button
                onClick={generateShareLink}
                disabled={isGenerating}
                className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs text-white bg-[#FF2E46] hover:bg-[#E02038] shadow-xs disabled:opacity-50 transition-colors"
              >
                {isGenerating ? 'Generating Secure Link...' : 'Generate Share Link'}
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4 text-center">
                <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-2.5 border border-emerald-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-[#2C2C2C] mb-1">Link Generated Successfully</h3>
                <p className="text-[#666666] text-xs">
                  Copy and send this link to the customer.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1.5">
                  Shareable Link:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-[#E0E2E5] rounded-lg bg-[#F8F9FA] text-xs text-[#2C2C2C] font-mono focus:outline-none"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3.5 py-2 bg-[#2C2C2C] hover:bg-[#1A1A1A] text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    Copy Link
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setLinkGenerated(false);
                    setShareUrl('');
                  }}
                  className="flex-1 py-2 px-3 border border-[#E0E2E5] text-[#2C2C2C] rounded-lg hover:bg-[#F8F9FA] font-semibold text-xs transition-colors"
                >
                  Generate Another
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-2 px-3 bg-[#FF2E46] text-white rounded-lg hover:bg-[#E02038] font-semibold text-xs transition-colors shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;