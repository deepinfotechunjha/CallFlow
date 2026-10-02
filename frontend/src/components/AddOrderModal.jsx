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
                  {[selectedFirm?.gstNo, selectedFirm?.city && selectedFirm?.area ? `${selectedFirm.city} · ${selectedFirm.area}` : selectedFirm?.city].filter(Boolean).join(' · ')}
                </p>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white text-gray-500 hover:text-[#2C2C2C] hover:bg-gray-100 flex items-center justify-center text-sm transition-colors border border-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-3 sm:space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">
                  Search Firm Name, Phone, or GST Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Type at least 2 characters..."
                    autoFocus
                    className="w-full px-4 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all"
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-[#FF2E46] border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-2 border border-[#E0E2E5] rounded-lg shadow-lg max-h-60 overflow-y-auto bg-white divide-y divide-[#E0E2E5]">
                    {searchResults.map(firm => (
                      <button
                        key={firm.id}
                        onClick={() => handleSelectFirm(firm)}
                        className="w-full text-left px-4 py-3 hover:bg-[#FFE8EB]/20 transition-colors"
                      >
                        <div className="font-bold text-sm text-[#2C2C2C]">{firm.firmName}</div>
                        <div className="text-xs text-[#666666] mt-0.5">
                          {firm.city}{firm.area ? ` · ${firm.area}` : ''} · {firm.contactPerson1Number}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery.trim() && !searching && searchResults.length === 0 && !selectedFirm && (
                  <p className="mt-2 text-xs text-[#666666]">No records matching "{searchQuery}"</p>
                )}
              </div>

              {selectedFirm && (
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
                    {selectedFirm.contactPerson1Name && (
                      <span><strong className="text-[#2C2C2C]">Contact:</strong> {selectedFirm.contactPerson1Name} ({selectedFirm.contactPerson1Number})</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-[#E0E2E5]">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F8F9FA] text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNext}
                  disabled={!selectedFirm}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow-xs transition-all ${
                    !selectedFirm
                      ? 'bg-[#E0E2E5] text-[#999999] cursor-not-allowed'
                      : 'bg-[#FF2E46] hover:bg-[#E02038] text-white'
                  }`}
                >
                  Next Step →
                </button>
              </div>
            </div>
          )}

          {step === 2 && selectedFirm && (
            <div className="space-y-4">
              {/* Brand */}
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">
                  Brand <span className="text-[#FF2E46]">*</span>
                </label>
                <select
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all font-semibold"
                  required
                >
                  <option value="">— Select brand —</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Order Items */}
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">
                  Order Items <span className="text-[#FF2E46]">*</span>
                </label>

                {loadingProducts ? (
                  <div className="flex items-center gap-2 text-xs text-[#666666] py-3">
                    <div className="animate-spin h-4 w-4 border-2 border-[#FF2E46] border-t-transparent rounded-full"></div>
                    Loading brand catalog...
                  </div>
                ) : hasProducts ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      placeholder="Filter product codes or configuration..."
                      className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all"
                    />

                    <div className="border border-[#E0E2E5] rounded-lg overflow-hidden shadow-xs">
                      {/* Desktop table */}
                      <div className="hidden sm:block max-h-64 overflow-y-auto">
                        <table className="min-w-full text-xs divide-y divide-[#E0E2E5]">
                          <thead className="bg-[#2C2C2C] sticky top-0 z-10">
                            <tr>
                              <th className="px-3 py-2 text-left font-bold text-white uppercase text-[11px]">Code</th>
                              <th className="px-3 py-2 text-left font-bold text-white uppercase text-[11px]">Configuration</th>
                              <th className="px-3 py-2 text-right font-bold text-white uppercase text-[11px]">Price (₹)</th>
                              <th className="px-3 py-2 text-right font-bold text-white uppercase text-[11px]">Qty</th>
                              <th className="px-3 py-2 text-right font-bold text-white uppercase text-[11px]">Total</th>
                              <th className="px-3 py-2"></th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-[#E0E2E5]">
                            {filteredProducts.map((p) => {
                              const added = orderItems.find(i => i.code === p.code);
                              const price = added ? parseFloat(added.price) || 0 : 0;
                              const qty = added ? parseInt(added.qty) || 0 : 0;
                              const total = price * qty;
                              return (
                                <tr key={p.code} className={added ? 'bg-[#FFE8EB]/20' : 'hover:bg-[#F8F9FA]'}>
                                  <td className="px-3 py-2 font-bold text-[#2C2C2C] whitespace-nowrap">{p.code}</td>
                                  <td className="px-3 py-2 text-[#666666] max-w-[120px] truncate">{p.configuration}</td>
                                  <td className="px-3 py-2 text-right">
                                    {added ? (
                                      <input type="number" min="0" value={added.price} onChange={e => updateItem(p.code, 'price', e.target.value)} placeholder="0"
                                        className="w-20 px-2 py-1 bg-white border border-[#E0E2E5] rounded-md text-xs text-right focus:ring-1 focus:ring-[#FF2E46]" />
                                    ) : <span className="text-[#999999]">—</span>}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {added ? (
                                      <input type="number" min="1" value={added.qty} onChange={e => updateItem(p.code, 'qty', e.target.value)}
                                        className="w-14 px-2 py-1 bg-white border border-[#E0E2E5] rounded-md text-xs text-right focus:ring-1 focus:ring-[#FF2E46]" />
                                    ) : <span className="text-[#999999]">—</span>}
                                  </td>
                                  <td className="px-3 py-2 text-right font-bold text-[#2C2C2C] whitespace-nowrap">
                                    {added && total > 0 ? `₹${total.toLocaleString('en-IN')}` : <span className="text-[#999999]">—</span>}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {added ? (
                                      <button type="button" onClick={() => removeItem(p.code)} className="text-[#FF2E46] hover:text-[#E02038] font-bold text-sm leading-none p-1">✕</button>
                                    ) : (
                                      <button type="button" onClick={() => addItem(p)} className="text-[#2C2C2C] hover:text-[#FF2E46] font-bold text-base leading-none p-1">+</button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

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
                      </div>
                    </div>
                  </div>
                ) : (
                  <textarea
                    value={orderRemark}
                    onChange={e => setOrderRemark(e.target.value)}
                    rows={4}
                    placeholder="Enter order descriptions and quantities..."
                    autoFocus
                    className="w-full px-4 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all"
                  />
                )}
              </div>

              {/* Called By */}
              {canSetCalledBy && (
                <div>
                  <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">
                    Order Caller <span className="text-[#666666] text-xs font-normal">(optional)</span>
                  </label>
                  <select
                    value={calledBy}
                    onChange={e => setCalledBy(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all"
                  >
                    <option value="">— Select staff member —</option>
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
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">
                  Dispatch Hubs <span className="text-[#FF2E46]">*</span>
                </label>
                {locations.length === 0 ? (
                  <p className="text-xs text-[#666666] italic">No dispatch hubs available. Add in Settings → Locations.</p>
                ) : (
                  <div className="border border-[#E0E2E5] rounded-lg overflow-hidden divide-y divide-[#E0E2E5]">
                    {locations.map(loc => {
                      const selected = dispatchFrom.includes(loc.name);
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => toggleDispatchLocation(loc.name)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left transition-colors ${
                            selected ? 'bg-[#FFE8EB]/40 font-bold text-[#FF2E46]' : 'bg-white hover:bg-[#F8F9FA] text-[#2C2C2C]'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 ${
                            selected ? 'border-[#FF2E46] bg-[#FF2E46] text-white' : 'border-[#E0E2E5]'
                          }`}>
                            {selected && '✓'}
                          </span>
                          <span className="flex items-center gap-1.5 font-medium">
                            <svg className="w-3.5 h-3.5 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {loc.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#E0E2E5]">
                <button
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F8F9FA] text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={(hasProducts ? !isTableValid : !orderRemark.trim()) || !brandName || dispatchFrom.length === 0 || isSubmitting}
                  className="flex-1 bg-[#FF2E46] hover:bg-[#E02038] text-white py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow-xs transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Order'}
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
