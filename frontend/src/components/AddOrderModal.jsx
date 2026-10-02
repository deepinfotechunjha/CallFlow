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
  const [confirmCall, setConfirmCall] = useState(null);

  // Brand product table state
  const [brandProducts, setBrandProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const dispatchDropdownRef = useRef(null);
  const { searchFirms, createOrder } = useOrderStore();
  const { user, users, fetchUsers } = useAuthStore();
  const { brands, fetchBrands, fetchBrandProducts } = useBrandStore();
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

  // When brand changes, fetch its products
  useEffect(() => {
    if (!brandName) {
      setBrandProducts([]);
      setOrderItems([]);
      setProductSearch('');
      return;
    }
    setLoadingProducts(true);
    fetchBrandProducts(brandName).then(products => {
      setBrandProducts(products);
      setOrderItems([]);
      setProductSearch('');
      setLoadingProducts(false);
    });
  }, [brandName, fetchBrandProducts]);

  const hasProducts = brandProducts.length > 0;

  const filteredProducts = productSearch.trim()
    ? brandProducts.filter(p => {
        const q = productSearch.toLowerCase();
        return p.code.toLowerCase().includes(q) || p.configuration.toLowerCase().includes(q);
      })
    : brandProducts;

  const addItem = (product) => {
    if (orderItems.find(i => i.code === product.code)) return;
    setOrderItems(prev => [...prev, { code: product.code, configuration: product.configuration, price: '', qty: 1 }]);
    setProductSearch('');
  };

  const removeItem = (code) => setOrderItems(prev => prev.filter(i => i.code !== code));

  const updateItem = (code, field, value) => {
    setOrderItems(prev => prev.map(i => i.code === code ? { ...i, [field]: value } : i));
  };

  const grandTotal = orderItems.reduce((sum, i) => {
    const price = parseFloat(i.price) || 0;
    const qty = parseInt(i.qty) || 0;
    return sum + price * qty;
  }, 0);

  const isTableValid = orderItems.length > 0 && orderItems.every(i => parseFloat(i.price) > 0 && parseInt(i.qty) > 0);

  const buildTableRemark = () => JSON.stringify({
    type: 'table',
    items: orderItems.map(i => ({
      code: i.code,
      configuration: i.configuration,
      price: parseFloat(i.price),
      qty: parseInt(i.qty),
      total: parseFloat(i.price) * parseInt(i.qty)
    })),
    grandTotal
  });

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
    setBrandProducts([]);
    setOrderItems([]);
    setProductSearch('');
  };

  const toggleDispatchLocation = (name) => {
    setDispatchFrom(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]);
  };

  const handleConfirm = async () => {
    const finalRemark = hasProducts ? (isTableValid ? buildTableRemark() : '') : orderRemark.trim();
    if (!finalRemark || !brandName || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createOrder({
        salesEntryId: selectedFirm.id,
        orderRemark: finalRemark,
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
<<<<<<< HEAD
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
=======
    <div className="fixed inset-0 bg-[#2C2C2C]/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-150">
      <div ref={modalRef} className="bg-white rounded-xl w-full max-w-2xl shadow-2xl border border-[#E0E2E5] flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-[#E0E2E5] bg-[#F8F9FA]">
          <div>
            {step === 1 ? (
              <>
                <span className="inline-block text-[#FF2E46] text-[10px] font-bold uppercase tracking-wider bg-[#FFE8EB] px-2.5 py-0.5 rounded-md mb-1 border border-[#FF2E46]/20">
                  STEP 1 OF 2
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#2C2C2C]">Search Customer / Firm</h3>
              </>
            ) : (
              <>
                <span className="inline-block text-[#FF2E46] text-[10px] font-bold uppercase tracking-wider bg-[#FFE8EB] px-2.5 py-0.5 rounded-md mb-1 border border-[#FF2E46]/20">
                  STEP 2 OF 2 • ORDER SPECIFICATIONS
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#2C2C2C] truncate max-w-[200px] sm:max-w-none">{selectedFirm?.firmName}</h3>
                <p className="text-xs text-[#666666] mt-0.5 truncate max-w-lg">
>>>>>>> 228f965 (order page ui changes+ mobile view)
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

<<<<<<< HEAD
        <div className="p-5 overflow-y-auto flex-1">
=======
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-3 sm:space-y-4">
>>>>>>> 228f965 (order page ui changes+ mobile view)
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
<<<<<<< HEAD
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Selected Firm</p>
                  <p className="font-bold text-gray-800 text-base mb-2">{selectedFirm.firmName}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                    {selectedFirm.gstNo && <span><span className="font-medium text-gray-500">GST:</span> {selectedFirm.gstNo}</span>}
                    {selectedFirm.panNo && <span><span className="font-medium text-gray-500">PAN:</span> {selectedFirm.panNo}</span>}
                    {(selectedFirm.city || selectedFirm.area) && <span><span className="font-medium text-gray-500">Location:</span> {selectedFirm.city}{selectedFirm.area ? ` · ${selectedFirm.area}` : ''}</span>}
                    {selectedFirm.address && <span><span className="font-medium text-gray-500">Address:</span> {selectedFirm.address}</span>}
=======
                <div className="bg-[#F8F9FA] border border-[#FF2E46]/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF2E46] bg-[#FFE8EB] px-2 py-0.5 rounded-md">
                      Selected Target Firm
                    </span>
                  </div>
                  <p className="font-bold text-[#2C2C2C] text-base mb-2">{selectedFirm.firmName}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#666666]">
                    {selectedFirm.gstNo && <span><strong className="text-[#2C2C2C]">GST:</strong> {selectedFirm.gstNo}</span>}
                    {selectedFirm.panNo && <span><strong className="text-[#2C2C2C]">PAN:</strong> {selectedFirm.panNo}</span>}
                    {(selectedFirm.city || selectedFirm.area) && <span><strong className="text-[#2C2C2C]">Location:</strong> {selectedFirm.city}{selectedFirm.area ? ` · ${selectedFirm.area}` : ''}</span>}
>>>>>>> 228f965 (order page ui changes+ mobile view)
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

              {/* Order Items / Remark */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Items <span className="text-red-500">*</span>
                </label>

                {loadingProducts ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    Loading products...
                  </div>
                ) : hasProducts ? (
                  <div className="space-y-2">
                    {/* Filter bar */}
                    <input
                      type="text"
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      placeholder="Filter by code or configuration..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />

<<<<<<< HEAD
                    {/* Single unified table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="max-h-64 overflow-y-auto">
                        <table className="min-w-full text-xs">
                          <thead className="bg-gray-50 sticky top-0 z-10">
=======
                    <div className="border border-[#E0E2E5] rounded-lg overflow-hidden shadow-xs">
                      {/* Desktop table */}
                      <div className="hidden sm:block max-h-64 overflow-y-auto">
                        <table className="min-w-full text-xs divide-y divide-[#E0E2E5]">
                          <thead className="bg-[#2C2C2C] sticky top-0 z-10">
>>>>>>> 228f965 (order page ui changes+ mobile view)
                            <tr>
                              <th className="px-2 py-2 text-left font-semibold text-gray-600">Code</th>
                              <th className="px-2 py-2 text-left font-semibold text-gray-600">Configuration</th>
                              <th className="px-2 py-2 text-right font-semibold text-gray-600">Price (₹)</th>
                              <th className="px-2 py-2 text-right font-semibold text-gray-600">Qty</th>
                              <th className="px-2 py-2 text-right font-semibold text-gray-600">Total</th>
                              <th className="px-2 py-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredProducts.map((p, idx) => {
                              const added = orderItems.find(i => i.code === p.code);
                              const price = added ? parseFloat(added.price) || 0 : 0;
                              const qty = added ? parseInt(added.qty) || 0 : 0;
                              const total = price * qty;
                              return (
<<<<<<< HEAD
                                <tr
                                  key={p.code}
                                  className={`border-b border-gray-100 last:border-b-0 ${
                                    added ? 'bg-green-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                  }`}
                                >
                                  <td className="px-2 py-1.5 font-medium text-gray-800 whitespace-nowrap">{p.code}</td>
                                  <td className="px-2 py-1.5 text-gray-600 max-w-[110px] truncate">{p.configuration}</td>
                                  <td className="px-2 py-1.5 text-right">
                                    {added ? (
                                      <input
                                        type="number"
                                        min="0"
                                        value={added.price}
                                        onChange={e => updateItem(p.code, 'price', e.target.value)}
                                        placeholder="0"
                                        className="w-20 px-1.5 py-1 border border-gray-300 rounded text-xs text-right focus:ring-1 focus:ring-blue-500"
                                      />
                                    ) : <span className="text-gray-300">—</span>}
=======
                                <tr key={p.code} className={added ? 'bg-[#FFE8EB]/20' : 'hover:bg-[#F8F9FA]'}>
                                  <td className="px-3 py-2 font-bold text-[#2C2C2C] whitespace-nowrap">{p.code}</td>
                                  <td className="px-3 py-2 text-[#666666] max-w-[120px] truncate">{p.configuration}</td>
                                  <td className="px-3 py-2 text-right">
                                    {added ? (
                                      <input type="number" min="0" value={added.price} onChange={e => updateItem(p.code, 'price', e.target.value)} placeholder="0"
                                        className="w-20 px-2 py-1 bg-white border border-[#E0E2E5] rounded-md text-xs text-right focus:ring-1 focus:ring-[#FF2E46]" />
                                    ) : <span className="text-[#999999]">—</span>}
>>>>>>> 228f965 (order page ui changes+ mobile view)
                                  </td>
                                  <td className="px-2 py-1.5 text-right">
                                    {added ? (
<<<<<<< HEAD
                                      <input
                                        type="number"
                                        min="1"
                                        value={added.qty}
                                        onChange={e => updateItem(p.code, 'qty', e.target.value)}
                                        className="w-14 px-1.5 py-1 border border-gray-300 rounded text-xs text-right focus:ring-1 focus:ring-blue-500"
                                      />
                                    ) : <span className="text-gray-300">—</span>}
=======
                                      <input type="number" min="1" value={added.qty} onChange={e => updateItem(p.code, 'qty', e.target.value)}
                                        className="w-14 px-2 py-1 bg-white border border-[#E0E2E5] rounded-md text-xs text-right focus:ring-1 focus:ring-[#FF2E46]" />
                                    ) : <span className="text-[#999999]">—</span>}
>>>>>>> 228f965 (order page ui changes+ mobile view)
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-semibold text-gray-800 whitespace-nowrap">
                                    {added && total > 0 ? `₹${total.toLocaleString('en-IN')}` : <span className="text-gray-300">—</span>}
                                  </td>
                                  <td className="px-2 py-1.5 text-center">
                                    {added ? (
                                      <button type="button" onClick={() => removeItem(p.code)} className="text-red-500 hover:text-red-700 font-bold text-sm leading-none">&times;</button>
                                    ) : (
                                      <button type="button" onClick={() => addItem(p)} className="text-blue-600 hover:text-blue-800 font-bold text-base leading-none">+</button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredProducts.length === 0 && (
                              <tr><td colSpan={6} className="px-3 py-4 text-center text-xs text-gray-400 italic">No products match your filter.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
<<<<<<< HEAD
                      {/* Grand total footer */}
                      <div className="bg-blue-50 border-t border-gray-200 px-3 py-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">
                          {orderItems.length} item{orderItems.length !== 1 ? 's' : ''} selected
                        </span>
                        <span className="text-sm font-bold text-blue-700">Grand Total: ₹{grandTotal.toLocaleString('en-IN')}</span>
=======

                      {/* Mobile card list */}
                      <div className="sm:hidden max-h-60 overflow-y-auto divide-y divide-[#E0E2E5]">
                        {filteredProducts.map((p) => {
                          const added = orderItems.find(i => i.code === p.code);
                          const price = added ? parseFloat(added.price) || 0 : 0;
                          const qty = added ? parseInt(added.qty) || 0 : 0;
                          const total = price * qty;
                          return (
                            <div key={p.code} className={`px-3 py-2.5 ${added ? 'bg-[#FFE8EB]/20' : 'bg-white'}`}>
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <span className="font-bold text-xs text-[#2C2C2C]">{p.code}</span>
                                  <p className="text-[11px] text-[#666666] truncate">{p.configuration}</p>
                                </div>
                                {added ? (
                                  <button type="button" onClick={() => removeItem(p.code)} className="text-[#FF2E46] font-bold text-sm p-1 flex-shrink-0">✕</button>
                                ) : (
                                  <button type="button" onClick={() => addItem(p)} className="text-[#2C2C2C] hover:text-[#FF2E46] font-bold text-lg p-1 flex-shrink-0">+</button>
                                )}
                              </div>
                              {added && (
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="flex items-center gap-1 flex-1">
                                    <span className="text-[10px] text-[#666666] uppercase font-bold">₹</span>
                                    <input type="number" min="0" value={added.price} onChange={e => updateItem(p.code, 'price', e.target.value)} placeholder="Price"
                                      className="flex-1 min-w-0 px-2 py-1 bg-white border border-[#E0E2E5] rounded-md text-xs text-right focus:ring-1 focus:ring-[#FF2E46]" />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-[#666666] uppercase font-bold">Qty</span>
                                    <input type="number" min="1" value={added.qty} onChange={e => updateItem(p.code, 'qty', e.target.value)}
                                      className="w-14 px-2 py-1 bg-white border border-[#E0E2E5] rounded-md text-xs text-right focus:ring-1 focus:ring-[#FF2E46]" />
                                  </div>
                                  <span className="text-xs font-bold text-[#FF2E46] whitespace-nowrap">
                                    {total > 0 ? `₹${total.toLocaleString('en-IN')}` : '—'}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-[#F8F9FA] border-t border-[#E0E2E5] px-3 py-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#666666]">
                          {orderItems.length} item{orderItems.length !== 1 ? 's' : ''} selected
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-[#FF2E46]">Grand Total: ₹{grandTotal.toLocaleString('en-IN')}</span>
>>>>>>> 228f965 (order page ui changes+ mobile view)
                      </div>
                    </div>

                    {orderItems.length > 0 && !isTableValid && (
                      <p className="text-xs text-red-500">Please enter price and quantity for all selected items.</p>
                    )}
                  </div>
                ) : (
                  // No products imported for this brand — show old plain textarea (unchanged)
                  <textarea
                    value={orderRemark}
                    onChange={e => setOrderRemark(e.target.value)}
                    rows={5}
                    placeholder="Enter order remarks..."
                    autoFocus
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dispatch From <span className="text-red-500">*</span>
                </label>
                {locations.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No locations configured. Add locations in Settings → Locations.</p>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {locations.map(loc => {
                      const selected = dispatchFrom.includes(loc.name);
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => toggleDispatchLocation(loc.name)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors border-b border-gray-100 last:border-b-0 ${
                            selected ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-gray-50'
                          }`}
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
                  disabled={(hasProducts ? !isTableValid : !orderRemark.trim()) || !brandName || dispatchFrom.length === 0 || isSubmitting}
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
