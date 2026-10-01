import React, { useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const SalesShareModal = ({ isOpen, onClose }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [linkGenerated, setLinkGenerated] = useState(false);
  const { token } = useAuthStore();

  const generateShareLink = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/share/create-sales-link`, {
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

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `Deep Infotech - Sales Entry Form\n\nPlease fill out our partner sales form:\n${shareUrl}\n\nSecure link - expires in 1 hour.`
    );
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
    toast.success('WhatsApp opened!');
  };

  const shareViaMessenger = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Deep Infotech - Sales Entry Form',
        text: 'Please fill out our sales entry form',
        url: shareUrl
      }).then(() => {
        toast.success('Shared successfully!');
      }).catch(() => {
        const messengerUrl = `https://www.messenger.com/new?text=${encodeURIComponent(shareUrl)}`;
        window.open(messengerUrl, '_blank');
        toast.success('Messenger opened!');
      });
    } else {
      const messengerUrl = `https://www.messenger.com/new?text=${encodeURIComponent(shareUrl)}`;
      window.open(messengerUrl, '_blank');
      toast.success('Messenger opened!');
    }
  };

  const shareViaNativeAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Deep Infotech - Sales Entry Form',
          text: 'Please fill out our sales entry form using this secure link',
          url: shareUrl
        });
        toast.success('Shared successfully!');
      } catch (error) {
        if (error.name !== 'AbortError') {
          toast.error('Share failed');
        }
      }
    } else {
      copyToClipboard();
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
              <h2 className="text-base font-bold text-[#2C2C2C]">Share Sales Form</h2>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-[#2C2C2C] mb-1">Generate Public Link</h3>
                <p className="text-xs text-[#666666] leading-relaxed">
                  Create a secure one-time link that allows partners and dealers to submit entries directly to your CallFlow database.
                </p>
              </div>

              <div className="bg-[#F8F9FA] border border-[#E0E2E5] rounded-lg p-3.5 mb-5 text-left">
                <h4 className="font-bold text-[#2C2C2C] mb-1 text-xs uppercase tracking-wider">Security Notice:</h4>
                <ul className="text-xs text-[#666666] space-y-1">
                  <li>• Valid for 1 hour from generation</li>
                  <li>• Single-use only (invalidated on submit)</li>
                  <li>• No login credentials needed by client</li>
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
                  'Generate Share Link'
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
                <h3 className="text-sm font-bold text-[#2C2C2C] mb-1">Link Generated</h3>
                <p className="text-xs text-[#666666]">
                  Share this secure single-use link with your client.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1.5">Share Link:</label>
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

              <div className="mb-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-2">Instant Channels:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={shareViaWhatsApp}
                    className="flex flex-col items-center justify-center p-2.5 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    <img src="/whatsapp.png" alt="WhatsApp" className="w-5 h-5 mb-1" />
                    <span className="text-[11px] font-semibold text-[#2C2C2C]">WhatsApp</span>
                  </button>

                  <button
                    onClick={shareViaMessenger}
                    className="flex flex-col items-center justify-center p-2.5 border border-sky-200 rounded-lg hover:bg-sky-50 transition-colors"
                  >
                    <div className="w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center mb-1 text-white">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259L10.732 8.1l3.13 3.259L19.752 8.1l-6.559 6.863z"/>
                      </svg>
                    </div>
                    <span className="text-[11px] font-semibold text-[#2C2C2C]">Messenger</span>
                  </button>

                  <button
                    onClick={shareViaNativeAPI}
                    className="flex flex-col items-center justify-center p-2.5 border border-[#E0E2E5] rounded-lg hover:bg-[#F0F2F5] transition-colors"
                  >
                    <svg className="w-5 h-5 text-[#2C2C2C] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <span className="text-[11px] font-semibold text-[#2C2C2C]">More</span>
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

export default SalesShareModal;
