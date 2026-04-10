import React, { useState, useEffect, useRef } from 'react';
import useOrderStore from '../store/orderStore';
import useAuthStore from '../store/authStore';
import useClickOutside from '../hooks/useClickOutside';

const CALLED_BY_ROLES = ['HOST', 'ACCOUNTANT', 'SALES_ADMIN'];

const AddOrderModal = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [orderRemark, setOrderRemark] = useState('');
  const [calledBy, setCalledBy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { searchFirms, createOrder } = useOrderStore();
  const { user, users, fetchUsers } = useAuthStore();
  const modalRef = useClickOutside(onClose);
  const searchTimeout = useRef(null);

  const canSetCalledBy = CALLED_BY_ROLES.includes(user?.role);

  useEffect(() => {
    if (canSetCalledBy) fetchUsers();
  }, [canSetCalledBy, fetchUsers]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSelectedFirm(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!val.trim()) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchFirms(val.trim());
      setSearchResults(results);
      setSearching(false);
    }, 350);
  };

  const handleSelectFirm = (firm) => {
    setSelectedFirm(firm);
    setSearchQuery(firm.firmName);
    setSearchResults([]);
  };

  const handleNext = () => {
    if (!selectedFirm) return;
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setOrderRemark('');
    setCalledBy('');
  };

  const handleConfirm = async () => {
    if (!orderRemark.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createOrder({
        salesEntryId: selectedFirm.id,
        orderRemark: orderRemark.trim(),
        calledBy: canSetCalledBy && calledBy ? calledBy : undefined
      });
      onClose();
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-xl w-full max-w-2xl shadow-xl min-h-[520px]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-gray-800">
            {step === 1 ? '🔍 Search Firm' : '📋 Review & Confirm Order'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-5">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search by Firm Name, Phone, or GST No
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Type to search..."
                    autoFocus
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-1 border border-gray-200 rounded-lg shadow-md max-h-60 overflow-y-auto">
                    {searchResults.map(firm => (
                      <button
                        key={firm.id}
                        onClick={() => handleSelectFirm(firm)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-sm text-gray-800">{firm.firmName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {firm.city}{firm.area ? ` · ${firm.area}` : ''} · {firm.contactPerson1Number}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery.trim() && !searching && searchResults.length === 0 && (
                  <p className="mt-2 text-sm text-gray-500">No firms found for "{searchQuery}"</p>
                )}
              </div>

              {selectedFirm && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Selected Firm</p>
                  <p className="font-bold text-gray-800 text-base mb-2">{selectedFirm.firmName}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                    {selectedFirm.gstNo && <span><span className="font-medium text-gray-500">GST:</span> {selectedFirm.gstNo}</span>}
                    {selectedFirm.panNo && <span><span className="font-medium text-gray-500">PAN:</span> {selectedFirm.panNo}</span>}
                    {(selectedFirm.city || selectedFirm.area) && <span><span className="font-medium text-gray-500">Location:</span> {selectedFirm.city}{selectedFirm.area ? ` · ${selectedFirm.area}` : ''}</span>}
                    {selectedFirm.address && <span><span className="font-medium text-gray-500">Address:</span> {selectedFirm.address}</span>}
                    {selectedFirm.contactPerson1Name && <span><span className="font-medium text-gray-500">Contact 1:</span> {selectedFirm.contactPerson1Name}</span>}
                    {selectedFirm.contactPerson1Number && <span><span className="font-medium text-gray-500">Mobile 1:</span> {selectedFirm.contactPerson1Number}</span>}
                    {selectedFirm.contactPerson2Name && <span><span className="font-medium text-gray-500">Contact 2:</span> {selectedFirm.contactPerson2Name}</span>}
                    {selectedFirm.contactPerson2Number && <span><span className="font-medium text-gray-500">Mobile 2:</span> {selectedFirm.contactPerson2Number}</span>}
                    {selectedFirm.email && <span className="col-span-2"><span className="font-medium text-gray-500">Email:</span> {selectedFirm.email}</span>}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNext}
                  disabled={!selectedFirm}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 text-sm font-medium"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {step === 2 && selectedFirm && (
            <div className="space-y-4">
              {/* Firm details review */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Firm Details</p>
                <p className="text-xs text-gray-700 truncate">
                  <span className="font-semibold text-gray-800">{selectedFirm.firmName}</span>
                  {selectedFirm.gstNo && <> &nbsp;·&nbsp; GST: {selectedFirm.gstNo}</>}
                  {(selectedFirm.city || selectedFirm.area) && <> &nbsp;·&nbsp; {selectedFirm.city}{selectedFirm.area ? ` · ${selectedFirm.area}` : ''}</>}
                  {selectedFirm.contactPerson1Number && <> &nbsp;·&nbsp; 📞 {selectedFirm.contactPerson1Number}</>}
                </p>
              </div>

              {/* Order Remark */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={orderRemark}
                  onChange={e => setOrderRemark(e.target.value)}
                  rows={10}
                  placeholder="Enter order remarks..."
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Called By — only for privileged roles */}
              {canSetCalledBy && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Called By <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <select
                    value={calledBy}
                    onChange={e => setCalledBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">— Select user —</option>
                    {users.map(u => (
                      <option key={u.id} value={u.username}>
                        {u.username} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  ← Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!orderRemark.trim() || isSubmitting}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 text-sm font-medium"
                >
                  {isSubmitting ? 'Creating...' : '✓ Confirm Order'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddOrderModal;
