import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import useCategoryStore from '../store/categoryStore';
import useServiceCategoryStore from '../store/serviceCategoryStore';
import useSocket from '../hooks/useSocket';
import useClickOutside from '../hooks/useClickOutside';

const CategorySettings = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [modalType, setModalType] = useState('call'); // 'call' or 'service'
  
  const { user } = useAuthStore();
  const { categories, fetchCategories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  const { serviceCategories, fetchServiceCategories, addServiceCategory, updateServiceCategory, deleteServiceCategory } = useServiceCategoryStore();
  
  // Initialize WebSocket connection
  useSocket();

  const addModalRef = useClickOutside(() => {
    if (showAddModal) {
      setShowAddModal(false);
      setNewCategoryName('');
    }
  });
  const editModalRef = useClickOutside(() => {
    if (showEditModal) {
      setShowEditModal(false);
      setEditingCategory(null);
      setEditCategoryName('');
    }
  });

  useEffect(() => {
    if (user?.role === 'HOST') {
      if (categories.length === 0) fetchCategories();
      if (serviceCategories.length === 0) fetchServiceCategories();
    }
  }, [user?.role, categories.length, serviceCategories.length, fetchCategories, fetchServiceCategories]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    try {
      if (modalType === 'call') {
        await addCategory(newCategoryName.trim());
      } else {
        await addServiceCategory(newCategoryName.trim());
      }
      setNewCategoryName('');
      setShowAddModal(false);
    } catch (error) {
      // Error handled in store
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    if (!editCategoryName.trim() || !editingCategory) return;
    
    try {
      if (modalType === 'call') {
        await updateCategory(editingCategory.id, editCategoryName.trim());
      } else {
        await updateServiceCategory(editingCategory.id, editCategoryName.trim());
      }
      setEditingCategory(null);
      setEditCategoryName('');
      setShowEditModal(false);
    } catch (error) {
      // Error handled in store
    }
  };

  const handleDeleteCategory = async (id, type) => {
    if (!confirm('Are you sure you want to delete this category? This will deactivate it.')) {
      return;
    }
    
    try {
      if (type === 'call') {
        await deleteCategory(id);
      } else {
        await deleteServiceCategory(id);
      }
    } catch (error) {
      // Error handled in store
    }
  };

  const openEditModal = (category, type) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setModalType(type);
    setShowEditModal(true);
  };

  const openAddModal = (type) => {
    setModalType(type);
    setShowAddModal(true);
  };

  if (user?.role !== 'HOST') {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-[#FFE8EB] border border-[#FF2E46]/30 text-[#FF2E46] px-5 py-4 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-semibold text-sm">Access denied. Only HOST users can manage categories.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <span className="inline-block text-[#FF2E46] text-xs font-bold uppercase tracking-widest bg-[#FFE8EB] px-2.5 py-0.5 rounded-md mb-2 border border-[#FF2E46]/20">
            SYSTEM TAXONOMY
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C2C2C] tracking-tight">Category Settings</h1>
          <p className="text-[#666666] text-sm mt-1">Configure service and support categories for smooth workflow routing</p>
        </div>
      </div>

      {/* Call Categories Section */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#2C2C2C] flex items-center gap-2">
              <svg className="w-5 h-5 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Categories
            </h2>
            <p className="text-xs text-[#666666]">Classifications for incoming customer service calls</p>
          </div>
          <button
            onClick={() => openAddModal('call')}
            className="inline-flex items-center justify-center gap-2 bg-[#FF2E46] hover:bg-[#E02038] text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Call Category
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-[#E0E2E5] overflow-hidden">
          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-[#E0E2E5]">
            {categories.length === 0 ? (
              <div className="p-8 text-center text-[#666666]">
                <p className="text-sm font-semibold text-[#2C2C2C]">No categories found</p>
                <p className="text-xs text-[#666666] mt-1">Add your first call category</p>
              </div>
            ) : (
              categories.map((category, index) => (
                <div key={category.id} className="p-4 hover:bg-[#F8F9FA] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#FF2E46] bg-[#FFE8EB] px-2 py-0.5 rounded-md">#{index + 1}</span>
                      <span className="text-sm font-bold text-[#2C2C2C]">{category.name}</span>
                    </div>
                  </div>
                  <div className="text-xs text-[#666666] mb-3">
                    Created: {new Date(category.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(category, 'call')}
                      className="flex-1 bg-[#2C2C2C] text-white py-1.5 rounded-lg text-xs font-semibold hover:bg-[#1A1A1A] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id, 'call')}
                      className="flex-1 bg-[#FFE8EB] text-[#FF2E46] border border-[#FF2E46]/30 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#FF2E46] hover:text-white transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E0E2E5]">
              <thead className="bg-[#2C2C2C]">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D] w-20">Sr.No</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Category Name</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Created At</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E0E2E5]">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-[#666666]">
                      <p className="text-sm font-semibold text-[#2C2C2C]">No categories found</p>
                      <p className="text-xs text-[#666666] mt-1">Add your first call category</p>
                    </td>
                  </tr>
                ) : (
                  categories.map((category, index) => (
                    <tr key={category.id} className="hover:bg-[#F8F9FA] transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-[#666666]">
                        {index + 1}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-sm font-semibold text-[#2C2C2C]">{category.name}</span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-[#666666]">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(category, 'call')}
                            className="bg-[#2C2C2C] text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-[#1A1A1A] transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id, 'call')}
                            className="bg-[#FFE8EB] text-[#FF2E46] border border-[#FF2E46]/30 px-3 py-1 rounded-md text-xs font-semibold hover:bg-[#FF2E46] hover:text-white transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Service Categories Section */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#2C2C2C] flex items-center gap-2">
              <svg className="w-5 h-5 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Service Categories
            </h2>
            <p className="text-xs text-[#666666]">Categories for workshop and carry-in service orders</p>
          </div>
          <button
            onClick={() => openAddModal('service')}
            className="inline-flex items-center justify-center gap-2 bg-[#2C2C2C] hover:bg-[#1A1A1A] text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Service Category
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-[#E0E2E5] overflow-hidden">
          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-[#E0E2E5]">
            {serviceCategories.length === 0 ? (
              <div className="p-8 text-center text-[#666666]">
                <p className="text-sm font-semibold text-[#2C2C2C]">No service categories found</p>
                <p className="text-xs text-[#666666] mt-1">Add your first service category</p>
              </div>
            ) : (
              serviceCategories.map((category, index) => (
                <div key={category.id} className="p-4 hover:bg-[#F8F9FA] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#2C2C2C] bg-[#F0F2F5] px-2 py-0.5 rounded-md">#{index + 1}</span>
                      <span className="text-sm font-bold text-[#2C2C2C]">{category.name}</span>
                    </div>
                  </div>
                  <div className="text-xs text-[#666666] mb-3">
                    Created: {new Date(category.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(category, 'service')}
                      className="flex-1 bg-[#2C2C2C] text-white py-1.5 rounded-lg text-xs font-semibold hover:bg-[#1A1A1A] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id, 'service')}
                      className="flex-1 bg-[#FFE8EB] text-[#FF2E46] border border-[#FF2E46]/30 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#FF2E46] hover:text-white transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E0E2E5]">
              <thead className="bg-[#2C2C2C]">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D] w-20">Sr.No</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Category Name</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Created At</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E0E2E5]">
                {serviceCategories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-[#666666]">
                      <p className="text-sm font-semibold text-[#2C2C2C]">No service categories found</p>
                      <p className="text-xs text-[#666666] mt-1">Add your first service category</p>
                    </td>
                  </tr>
                ) : (
                  serviceCategories.map((category, index) => (
                    <tr key={category.id} className="hover:bg-[#F8F9FA] transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-[#666666]">
                        {index + 1}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-sm font-semibold text-[#2C2C2C]">{category.name}</span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-[#666666]">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(category, 'service')}
                            className="bg-[#2C2C2C] text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-[#1A1A1A] transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id, 'service')}
                            className="bg-[#FFE8EB] text-[#FF2E46] border border-[#FF2E46]/30 px-3 py-1 rounded-md text-xs font-semibold hover:bg-[#FF2E46] hover:text-white transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div ref={addModalRef} className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-[#E0E2E5]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E0E2E5]">
              <h2 className="text-base font-bold text-[#2C2C2C]">
                Add New {modalType === 'call' ? 'Call' : 'Service'} Category
              </h2>
              <button
                onClick={() => { setShowAddModal(false); setNewCategoryName(''); }}
                className="text-[#666666] hover:text-[#2C2C2C] p-1 rounded-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">
                  Category Name <span className="text-[#FF2E46]">*</span>
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  placeholder={modalType === 'call' ? 'e.g., Installation' : 'e.g., Laptop Service'}
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setNewCategoryName(''); }}
                  className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#FF2E46] hover:bg-[#E02038] text-white py-2 rounded-lg font-semibold text-xs shadow-xs transition-colors"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div ref={editModalRef} className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-[#E0E2E5]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E0E2E5]">
              <h2 className="text-base font-bold text-[#2C2C2C]">
                Edit {modalType === 'call' ? 'Call' : 'Service'} Category
              </h2>
              <button
                onClick={() => { setShowEditModal(false); setEditingCategory(null); setEditCategoryName(''); }}
                className="text-[#666666] hover:text-[#2C2C2C] p-1 rounded-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">
                  Category Name <span className="text-[#FF2E46]">*</span>
                </label>
                <input
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingCategory(null); setEditCategoryName(''); }}
                  className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#FF2E46] hover:bg-[#E02038] text-white py-2 rounded-lg font-semibold text-xs shadow-xs transition-colors"
                >
                  Update Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySettings;
