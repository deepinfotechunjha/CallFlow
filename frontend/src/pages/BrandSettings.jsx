import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useBrandStore from '../store/brandStore';
import useSocket from '../hooks/useSocket';
import useClickOutside from '../hooks/useClickOutside';
import apiClient from '../api/apiClient';
import BrandProductImportModal from '../components/BrandProductImportModal';

const BrandSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { brands, fetchBrands, addBrand, updateBrand, deleteBrand } = useBrandStore();
  useSocket();

  const [importingBrand, setImportingBrand] = useState(null);

  // Action secret modal
  const [showActionSecret, setShowActionSecret] = useState(false);
  const [actionPassword, setActionPassword] = useState('');
  const [pendingAction, setPendingAction] = useState(null); // { type, data }
  const [isConfirming, setIsConfirming] = useState(false);

  // Add/Edit modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [editingBrand, setEditingBrand] = useState(null);
  const [editBrandName, setEditBrandName] = useState('');

  const addModalRef = useClickOutside(() => { setShowAddModal(false); setNewBrandName(''); });
  const editModalRef = useClickOutside(() => { setShowEditModal(false); setEditingBrand(null); setEditBrandName(''); });
  const actionRef = useClickOutside(() => {
    setShowActionSecret(false);
    setActionPassword('');
    setPendingAction(null);
    setIsConfirming(false);
  });

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const openAdd = () => { setNewBrandName(''); setShowAddModal(true); };
  const openEdit = (brand) => { setEditingBrand(brand); setEditBrandName(brand.name); setShowEditModal(true); };

  const submitAdd = (e) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    setShowAddModal(false);
    setPendingAction({ type: 'add', data: { name: newBrandName.trim() } });
    setShowActionSecret(true);
  };

  const submitEdit = (e) => {
    e.preventDefault();
    if (!editBrandName.trim() || !editingBrand) return;
    setShowEditModal(false);
    setPendingAction({ type: 'edit', data: { id: editingBrand.id, name: editBrandName.trim() } });
    setShowActionSecret(true);
  };

  const confirmDelete = (brand) => {
    if (!confirm(`Delete brand "${brand.name}"? Users assigned to this brand will still have it in their JWT until they re-login.`)) return;
    setPendingAction({ type: 'delete', data: { id: brand.id } });
    setShowActionSecret(true);
  };

  const executeAction = async () => {
    if (!actionPassword.trim() || isConfirming) return;
    setIsConfirming(true);
    try {
      if (pendingAction.type === 'add') {
        await addBrand(pendingAction.data.name, actionPassword);
      } else if (pendingAction.type === 'edit') {
        await updateBrand(pendingAction.data.id, pendingAction.data.name, actionPassword);
      } else if (pendingAction.type === 'delete') {
        const result = await deleteBrand(pendingAction.data.id, actionPassword);
        if (result?.warning) alert(`⚠️ ${result.warning}`);
      }
      setShowActionSecret(false);
      setActionPassword('');
      setPendingAction(null);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Action failed';
      if (msg.includes('Invalid secret')) {
        setShowActionSecret(false);
        setActionPassword('');
        alert('Invalid secret password. Please try again.');
        setShowActionSecret(true);
      }
    } finally {
      setIsConfirming(false);
    }
  };

  if (user?.role !== 'HOST') {
    return (
      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-4">
        <div className="bg-[#FFE8EB] border border-[#FF2E46]/30 text-[#FF2E46] px-4 py-3 rounded-xl flex items-center gap-3">
          <span className="font-semibold text-xs sm:text-sm">Access denied. Only HOST users can manage brands.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-white p-5 sm:p-6 rounded-xl border border-[#E0E2E5] shadow-xs">
        <div>
          <span className="inline-block text-[#FF2E46] text-[11px] font-bold uppercase tracking-widest bg-[#FFE8EB] px-2.5 py-1 rounded-md mb-2 border border-[#FF2E46]/20">
            COMPANY PARTNERS
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C]">Brand Settings</h1>
          <p className="text-[#666666] text-xs sm:text-sm mt-1">Manage brand partnerships for company-based data segregation</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 bg-[#FF2E46] hover:bg-[#FF5A71] text-white px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-all w-full sm:w-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Brand
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-[#E0E2E5] overflow-hidden">
        {/* Mobile View */}
        <div className="lg:hidden divide-y divide-[#E0E2E5]">
          {brands.length === 0 ? (
            <div className="p-8 text-center text-[#666666]">
              <p className="text-sm font-semibold text-[#2C2C2C]">No brands found</p>
              <p className="text-xs text-[#666666] mt-1">Add your first brand partnership!</p>
            </div>
          ) : (
            brands.map((brand, index) => (
              <div key={brand.id} className="p-4 hover:bg-[#F8F9FA] transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-bold text-[#FF2E46] bg-[#FFE8EB] px-2 py-0.5 rounded-md">#{index + 1}</span>
                  <span className="text-sm font-bold text-[#2C2C2C]">{brand.name}</span>
                </div>
                <div className="text-xs text-[#666666] mb-3">
                  Created: {new Date(brand.createdAt).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(brand)} className="flex-1 bg-gray-100 text-[#2C2C2C] py-1.5 rounded-md text-xs font-semibold hover:bg-gray-200 transition-colors">Edit</button>
                  <button onClick={() => setImportingBrand(brand)} className="flex-1 bg-blue-50 text-blue-700 border border-blue-200 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-100 transition-colors">Products</button>
                  <button onClick={() => confirmDelete(brand)} className="flex-1 bg-red-50 text-red-700 border border-red-200 py-1.5 rounded-md text-xs font-semibold hover:bg-red-100 transition-colors">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E0E2E5]">
            <thead className="bg-[#2C2C2C]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D] w-16">Sr.No</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Brand Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Created At</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#F0F2F5]">
              {brands.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-[#666666]">
                    <p className="text-sm font-semibold text-[#2C2C2C]">No brands found</p>
                    <p className="text-xs text-[#666666] mt-1">Add your first brand partnership!</p>
                  </td>
                </tr>
              ) : (
                brands.map((brand, index) => (
                  <tr key={brand.id} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs font-semibold text-[#666666]">{index + 1}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-xs sm:text-sm font-bold text-[#2C2C2C]">{brand.name}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-[#666666]">{new Date(brand.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(brand)} className="bg-gray-100 hover:bg-gray-200 text-[#2C2C2C] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors">Edit</button>
                        <button onClick={() => setImportingBrand(brand)} className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors">Products</button>
                        <button onClick={() => confirmDelete(brand)} className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-red-100 transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {importingBrand && (
        <BrandProductImportModal
          brand={importingBrand}
          onClose={() => setImportingBrand(null)}
        />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div ref={addModalRef} className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md shadow-lg border border-[#E0E2E5]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E0E2E5]">
              <h2 className="text-base font-bold text-[#2C2C2C]">Add New Brand</h2>
              <button
                onClick={() => { setShowAddModal(false); setNewBrandName(''); }}
                className="text-[#666666] hover:text-[#2C2C2C] text-lg font-bold leading-none p-1"
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitAdd} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Brand Name <span className="text-[#FF2E46]">*</span></label>
                <input
                  type="text"
                  value={newBrandName}
                  onChange={e => setNewBrandName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  placeholder="e.g., Samsung"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-2.5 pt-3 border-t border-[#E0E2E5]">
                <button type="button" onClick={() => { setShowAddModal(false); setNewBrandName(''); }} className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs sm:text-sm font-semibold transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-[#FF2E46] hover:bg-[#FF5A71] text-white py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-all">Next</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingBrand && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div ref={editModalRef} className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md shadow-lg border border-[#E0E2E5]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E0E2E5]">
              <h2 className="text-base font-bold text-[#2C2C2C]">Edit Brand</h2>
              <button
                onClick={() => { setShowEditModal(false); setEditingBrand(null); setEditBrandName(''); }}
                className="text-[#666666] hover:text-[#2C2C2C] text-lg font-bold leading-none p-1"
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Brand Name <span className="text-[#FF2E46]">*</span></label>
                <input
                  type="text"
                  value={editBrandName}
                  onChange={e => setEditBrandName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-2.5 pt-3 border-t border-[#E0E2E5]">
                <button type="button" onClick={() => { setShowEditModal(false); setEditingBrand(null); setEditBrandName(''); }} className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs sm:text-sm font-semibold transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-[#FF2E46] hover:bg-[#FF5A71] text-white py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-all">Next</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Secret Modal */}
      {showActionSecret && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div ref={actionRef} className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md shadow-lg border border-[#E0E2E5]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E0E2E5]">
              <h2 className="text-base font-bold text-[#2C2C2C]">Security Confirmation</h2>
              <button
                onClick={() => { setShowActionSecret(false); setActionPassword(''); setPendingAction(null); setIsConfirming(false); }}
                className="text-[#666666] hover:text-[#2C2C2C] text-lg font-bold leading-none p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs sm:text-sm text-[#666666] mb-4">Please enter your HOST secret password to confirm this brand change:</p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Secret Password <span className="text-[#FF2E46]">*</span></label>
              <input
                type="password"
                value={actionPassword}
                onChange={e => setActionPassword(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && executeAction()}
                className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                placeholder="Enter secret password"
                autoFocus
              />
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => { setShowActionSecret(false); setActionPassword(''); setPendingAction(null); setIsConfirming(false); }}
                className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs sm:text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                disabled={isConfirming}
                className={`flex-1 py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-all ${
                  isConfirming ? 'bg-[#FF5A71] text-white cursor-not-allowed' : 'bg-[#FF2E46] text-white hover:bg-[#FF5A71]'
                }`}
              >
                {isConfirming ? 'Authorizing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandSettings;
