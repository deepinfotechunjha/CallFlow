import React, { useState, useEffect, useRef } from 'react';
import useOrderStore from '../store/orderStore';
import useAuthStore from '../store/authStore';
import useBrandStore from '../store/brandStore';
import useLocationStore from '../store/locationStore';
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
  const [brandName, setBrandName] = useState('');
  const [dispatchFrom, setDispatchFrom] = useState([]);
  const [dispatchDropdownOpen, setDispatchDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmCall, setConfirmCall] = useState(null); // { name, number }

  const dispatchDropdownRef = useRef(null);

  const { searchFirms, createOrder } = useOrderStore();
  const { user, users, fetchUsers } = useAuthStore();
  const { brands, fetchBrands } = useBrandStore();
  const { locations, fetchLocations } = useLocationStore();
  const modalRef = useClickOutside(confirmCall ? () => {} : onClose);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (!dispatchDropdownOpen) return;
    const handler = (e) => {
      if (dispatchDropdownRef.current && !dispatchDropdownRef.current.contains(e.target)) {
        setDispatchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dispatchDropdownOpen]);

  const canSetCalledBy = CALLED_BY_ROLES.includes(user?.role);

  useEffect(() => {
    if (canSetCalledBy) fetchUsers();
    fetchBrands();
    fetchLocations();
  }, [canSetCalledBy, fetchUsers, fetchBrands, fetchLocations]);

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
    setBrandName('');
    setDispatchFrom([]);
    setDispatchDropdownOpen(false);
  };

  const toggleDispatchLocation = (name) => {
    setDispatchFrom(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]);
  };

  const handleConfirm = async () => {
    if (!orderRemark.trim() || !brandName || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createOrder({
        salesEntryId: selectedFirm.id,
        orderRemark: orderRemark.trim(),
        brandName,
        calledBy: canSetCalledBy && calledBy ? calledBy : undefined,
        dispatchFrom: dispatchFrom.join(',')
      });
      onClose();
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            {step === 1 ? (
              <h3 className="text-lg font-bold text-gray-800">🔍 Search Firm</h3>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-800">{selectedFirm?.firmName}</h3>
                <p className="text-sm text-gray-500 mt-0.5 truncate max-w-lg">
                  {[selectedFirm?.gstNo, selectedFirm?.city && selectedFirm?.area ? `${selectedFirm.city} · ${selectedFirm.area}` : selectedFirm?.city].filter(Boolean).join(' · ')}
                  {selectedFirm?.contactPerson1Number && <> · {selectedFirm.contactPerson1Number} <button type="button" onClick={() => setConfirmCall({ name: selectedFirm.contactPerson1Name || 'Contact 1', number: selectedFirm.contactPerson1Number })} className="inline text-green-600 hover:text-green-800">📞</button></>}
                  {selectedFirm?.contactPerson2Number && <> · {selectedFirm.contactPerson2Number} <button type="button" onClick={() => setConfirmCall({ name: selectedFirm.contactPerson2Name || 'Contact 2', number: selectedFirm.contactPerson2Number })} className="inline text-green-600 hover:text-green-800">📞</button></>}
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
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
                    {selectedFirm.contactPerson1Name && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-gray-500">C1:</span> {selectedFirm.contactPerson1Name}
                        {selectedFirm.contactPerson1Number && <> ({selectedFirm.contactPerson1Number}) <button type="button" onClick={() => setConfirmCall({ name: selectedFirm.contactPerson1Name, number: selectedFirm.contactPerson1Number })} className="text-green-600 hover:text-green-800">📞</button></>}
                      </span>
                    )}
                    {selectedFirm.contactPerson2Name && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-gray-500">C2:</span> {selectedFirm.contactPerson2Name}
                        {selectedFirm.contactPerson2Number && <> ({selectedFirm.contactPerson2Number}) <button type="button" onClick={() => setConfirmCall({ name: selectedFirm.contactPerson2Name, number: selectedFirm.contactPerson2Number })} className="text-green-600 hover:text-green-800">📞</button></>}
                      </span>
                    )}
                    {selectedFirm.accountContactName && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-gray-500">Acc:</span> {selectedFirm.accountContactName}
                        {selectedFirm.accountContactNumber && <> ({selectedFirm.accountContactNumber}) <button type="button" onClick={() => setConfirmCall({ name: selectedFirm.accountContactName, number: selectedFirm.accountContactNumber })} className="text-green-600 hover:text-green-800">📞</button></>}
                      </span>
                    )}
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
              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand <span className="text-red-500">*</span>
                </label>
                <select
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="">— Select brand —</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
                {!brandName && <p className="text-xs text-red-500 mt-1">Please select a brand</p>}
              </div>

              {/* Order Remark */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={orderRemark}
                  onChange={e => setOrderRemark(e.target.value)}
                  rows={14}
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
                    {users.filter(u => !['ADMIN', 'ENGINEER'].includes(u.role)).map(u => (
                      <option key={u.id} value={u.username}>
                        {u.username} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dispatch From */}
              <div ref={dispatchDropdownRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dispatch From <span className="text-red-500">*</span>
                </label>
                {locations.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No locations configured. Add locations in Settings → Locations.</p>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setDispatchDropdownOpen(prev => !prev)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm text-left flex items-center justify-between bg-white transition-all ${
                        dispatchFrom.length === 0 ? 'border-gray-300 text-gray-400' : 'border-blue-500 text-gray-800'
                      }`}
                    >
                      <span className="truncate">
                        {dispatchFrom.length === 0
                          ? '— Select locations —'
                          : dispatchFrom.map(n => `📦 ${n}`).join(', ')}
                      </span>
                      <svg className={`w-4 h-4 ml-2 flex-shrink-0 text-gray-400 transition-transform ${dispatchDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {dispatchDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                        {locations.map(loc => {
                          const selected = dispatchFrom.includes(loc.name);
                          return (
                            <button
                              key={loc.id}
                              type="button"
                              onClick={() => toggleDispatchLocation(loc.name)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-left transition-colors"
                            >
                              <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                selected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                              }`}>
                                {selected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </span>
                              <span className={selected ? 'font-medium text-blue-700' : 'text-gray-700'}>📦 {loc.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
                {dispatchFrom.length === 0 && locations.length > 0 && (
                  <p className="text-xs text-red-500 mt-1">Please select at least one dispatch location</p>
                )}
              </div>

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
                  disabled={!orderRemark.trim() || !brandName || dispatchFrom.length === 0 || isSubmitting}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 text-sm font-medium"
                >
                  {isSubmitting ? 'Creating...' : '✓ Confirm Order'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Call confirmation dialog */}
      {confirmCall && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4" onClick={e => e.stopPropagation()}>
          <div className="bg-white rounded-xl p-6 max-w-xs w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <p className="text-base font-bold text-gray-800 mb-1">📞 Are you sure you want to call?</p>
            <p className="text-sm text-gray-700 mb-5 font-medium">{confirmCall.name} ({confirmCall.number})</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCall(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => { window.location.href = `tel:${confirmCall.number}`; setConfirmCall(null); }}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                Yes, Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddOrderModal;
