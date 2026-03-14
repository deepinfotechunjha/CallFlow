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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/share/create-sales-link`, {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm sm:max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>🔗</span> Share Sales Form
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>

          {!linkGenerated ? (
            <div className="text-center">
              <div className="mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-xl sm:text-2xl">📤</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Generate Share Link</h3>
                <p className="text-gray-600 text-xs sm:text-sm px-2">
                  Create a one-time use link that allows anyone to submit a sales entry directly to your system.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-yellow-600 text-base sm:text-lg">⚠️</span>
                  <div className="text-left">
                    <h4 className="font-medium text-yellow-800 mb-1 text-sm sm:text-base">Important Notes:</h4>
                    <ul className="text-xs sm:text-sm text-yellow-700 space-y-1">
                      <li>• Link expires after 1 hour</li>
                      <li>• Can only be used once</li>
                      <li>• Automatically deleted after use</li>
                      <li>• No authentication required</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={generateShareLink}
                disabled={isGenerating}
                className={`w-full py-2.5 sm:py-3 px-4 rounded-lg font-medium text-sm sm:text-base transition-all ${
                  isGenerating
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                    Generating...
                  </span>
                ) : (
                  'Generate Share Link'
                )}
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-xl sm:text-2xl">✅</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Link Generated Successfully!</h3>
                <p className="text-gray-600 text-xs sm:text-sm px-2">
                  Share this link with anyone who needs to submit a sales entry. It will expire in 1 hour.
                </p>
              </div>

              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Share Link:</label>
                <div className="flex gap-1 sm:gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 p-2 sm:p-3 border border-gray-300 rounded-lg bg-gray-50 text-xs sm:text-sm font-mono"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-2 sm:px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-green-600 text-base sm:text-lg">ℹ️</span>
                  <div className="text-left">
                    <h4 className="font-medium text-green-800 mb-1 text-sm sm:text-base">How it works:</h4>
                    <ul className="text-xs sm:text-sm text-green-700 space-y-1">
                      <li>• Anyone can open this link</li>
                      <li>• They'll see a simple sales entry form</li>
                      <li>• After submission, the link becomes invalid</li>
                      <li>• The entry appears in your dashboard</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setLinkGenerated(false);
                    setShareUrl('');
                  }}
                  className="flex-1 py-2.5 sm:py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
                >
                  Generate New
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 sm:py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base"
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
