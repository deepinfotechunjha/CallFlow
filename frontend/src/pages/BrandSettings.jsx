import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useBrandStore from '../store/brandStore';
import useSocket from '../hooks/useSocket';
import useClickOutside from '../hooks/useClickOutside';
import apiClient from '../api/apiClient';

const BrandSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { brands, fetchBrands, addBrand, updateBrand, deleteBrand } = useBrandStore();
  useSocket();

  // Gate state
  const [hasAccess, setHasAccess] = useState(false);
  const [gatePassword, setGatePassword] = useState('');
  const [showGate, setShowGate] = useState(true);
  const [showWrongGate, setShowWrongGate] = useState(false);

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

  const gateRef = useClickOutside(() => { if (showGate) window.history.back(); });
  const addModalRef = useClickOutside(() => { setShowAddModal(false); setNewBrandName(''); });
  const editModalRef = useClickOutside(() => { setShowEditModal(false); setEditingBrand(null); setEditBrandName(''); });
  const actionRef = useClickOutside(() => {
    setShowActionSecret(false);
    setActionPassword('');
    setPendingAction(null);
    setIsConfirming(false);
  });

  useEffect(() => {
    if (hasAccess) fetchBrands();
  }, [hasAccess, fetchBrands]);

  const verifyGate = async () => {
    if (!gatePassword.trim()) return;
    try {
      const res = await apiClient.post('/auth/verify-secret', { secretPassword: gatePassword });
      if (res.data.success && res.data.hasAccess) {
        setHasAccess(true);
        setShowGate(false);
      } else {
        setShowGate(false);
        setGatePassword('');
        setShowWrongGate(true);
      }
    } catch {
      setShowGate(false);
      setGatePassword('');
      setShowWrongGate(true);
    }
  };

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
        // Re-open action modal for retry
        setShowActionSecret(true);
      }
    } finally {
      setIsConfirming(false);
    }
  };

  if (user?.role !== 'HOST') {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
          Access denied. Only HOST users can manage brands.
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto">
        {showGate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div ref={gateRef} className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Brand Settings Access</h2>
              <p className="text-gray-600 mb-4">Enter your secret password to access brand settings:</p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Secret Password *</label>
                <input
                  type="password"
                  value={gatePassword}
                  onChange={e => setGatePassword(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && verifyGate()}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter secret password"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button onClick={verifyGate} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium">Verify</button>
                <button onClick={() => window.history.back()} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">Cancel</button>
              </div>
            </div>
          </div>
        )}
        {showWrongGate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-red-600">Invalid Secret</h2>
              <p className="text-gray-700 mb-6">The secret you entered is incorrect.</p>
              <div className="flex gap-2">
                <button onClick={() => { setShowWrongGate(false); setShowGate(true); }} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium">Retry</button>
                <button onClick={() => { setShowWrongGate(false); window.history.back(); }} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Brand Settings 🏷️</h1>
          <p className="text-gray-600">Manage brands for company-based access control</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium text-sm sm:text-base w-full sm:w-auto shadow-sm transition-all"
        >
          + Add Brand
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Mobile */}
        <div className="lg:hidden divide-y divide-gray-200">
          {brands.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="text-4xl mb-4">🏷️</div>
              <p className="text-lg font-medium">No brands found</p>
              <p className="text-sm">Add your first brand!</p>
            </div>
          ) : brands.map((brand, index) => (
            <div key={brand.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                <span className="text-lg">🏷️</span>
                <span className="text-sm font-semibold text-gray-900">{brand.name}</span>
              </div>
              <div className="text-xs text-gray-500 mb-3">{new Date(brand.createdAt).toLocaleDateString()}</div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(brand)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-blue-700">Edit</button>
                <button onClick={() => confirmDelete(brand)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-red-700">Delete</button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr.No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {brands.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    <div className="text-4xl mb-4">🏷️</div>
                    <p className="text-lg font-medium">No brands found</p>
                    <p className="text-sm">Add your first brand!</p>
                  </td>
                </tr>
              ) : brands.map((brand, index) => (
                <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏷️</span>
                      <span className="text-sm font-medium text-gray-900">{brand.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(brand.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(brand)} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700 transition-colors">Edit</button>
                      <button onClick={() => confirmDelete(brand)} className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-700 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={addModalRef} className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Add New Brand</h2>
            <form onSubmit={submitAdd}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Brand Name *</label>
                <input
                  type="text"
                  value={newBrandName}
                  onChange={e => setNewBrandName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g., Samsung"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium text-sm">Add Brand</button>
                <button type="button" onClick={() => { setShowAddModal(false); setNewBrandName(''); }} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 text-sm font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingBrand && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={editModalRef} className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Edit Brand</h2>
            <form onSubmit={submitEdit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Brand Name *</label>
                <input
                  type="text"
                  value={editBrandName}
                  onChange={e => setEditBrandName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium text-sm">Update Brand</button>
                <button type="button" onClick={() => { setShowEditModal(false); setEditingBrand(null); setEditBrandName(''); }} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 text-sm font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Secret Modal */}
      {showActionSecret && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={actionRef} className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Action</h2>
            <p className="text-gray-600 mb-4">Enter your secret password to confirm:</p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Secret Password *</label>
              <input
                type="password"
                value={actionPassword}
                onChange={e => setActionPassword(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && executeAction()}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Enter secret password"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={executeAction}
                disabled={isConfirming}
                className={`flex-1 py-2 rounded font-medium ${isConfirming ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {isConfirming ? 'Processing...' : 'Confirm'}
              </button>
              <button
                onClick={() => { setShowActionSecret(false); setActionPassword(''); setPendingAction(null); setIsConfirming(false); }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandSettings;
