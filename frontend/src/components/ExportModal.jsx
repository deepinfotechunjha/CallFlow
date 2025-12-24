import React, { useState } from 'react';
import useClickOutside from '../hooks/useClickOutside';

const ExportModal = ({ isOpen, onClose, onExport, totalCount, filteredCount, title = "Export Data" }) => {
  const [step, setStep] = useState(1);
  const [exportType, setExportType] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const modalRef = useClickOutside(() => onClose());

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-lg p-6 w-full max-w-md">
        {step === 1 ? (
          <>
            <h2 className="text-xl font-bold mb-4">{title}</h2>
            <p className="text-gray-600 mb-4">Choose what data to export:</p>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="exportType"
                  value="filtered"
                  checked={exportType === 'filtered'}
                  onChange={(e) => {
                    setExportType(e.target.value);
                    setError('');
                  }}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-semibold text-gray-800">Export Filtered Data</div>
                  <div className="text-sm text-gray-600">
                    Export current view with applied filters ({filteredCount} items)
                  </div>
                </div>
              </label>

              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="exportType"
                  value="all"
                  checked={exportType === 'all'}
                  onChange={(e) => {
                    setExportType(e.target.value);
                    setError('');
                  }}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-semibold text-gray-800">Export All Data</div>
                  <div className="text-sm text-gray-600">
                    Export complete dataset ({totalCount} items)
                  </div>
                </div>
              </label>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">Verify Secret Password</h2>
            <p className="text-gray-600 mb-4">
              Enter your secret password to proceed with export:
            </p>

            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleExport()}
              placeholder="Enter secret password"
              className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep(1);
                  setPassword('');
                  setError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Back
              </button>
              <button
                onClick={handleExport}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Export
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExportModal;
