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
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚫</span>
            <span>Access denied. Only HOST users can manage categories.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">Category Settings 📊</h1>
          <p className="text-gray-600">Manage call and service categories for your system</p>
        </div>
      </div>

      {/* Call Categories Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Call Categories 📞</h2>
            <p className="text-gray-600">Categories for customer service calls</p>
          </div>
          <button
            onClick={() => openAddModal('call')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium text-sm sm:text-base w-full sm:w-auto shadow-sm transition-all"
          >
            + Add Call Category
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Mobile Card View */}
          <div className="lg:hidden">
            <div className="divide-y divide-gray-200">
              {categories.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="text-4xl mb-4">📞</div>
                  <p className="text-lg font-medium">No categories found</p>
                  <p className="text-sm">Add your first call category!</p>
                </div>
              ) : (
                categories.map((category, index) => (
                  <div key={category.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">📞</span>
                          <div className="text-sm font-semibold text-gray-900">{category.name}</div>
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-500 mb-1">Created At</div>
                      <div className="text-sm text-gray-600">{new Date(category.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(category, 'call')}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex-1 sm:flex-none"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id, 'call')}
                        className="bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-700 transition-colors flex-1 sm:flex-none"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sr.No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      <div className="text-4xl mb-4">📞</div>
                      <p className="text-lg font-medium">No categories found</p>
                      <p className="text-sm">Add your first call category!</p>
                    </td>
                  </tr>
                ) : (
                  categories.map((category, index) => (
                    <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📞</span>
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(category, 'call')}
                            className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id, 'call')}
                            className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-700 transition-colors"
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Service Categories 🔧</h2>
            <p className="text-gray-600">Categories for carry-in service requests</p>
          </div>
          <button
            onClick={() => openAddModal('service')}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 font-medium text-sm sm:text-base w-full sm:w-auto shadow-sm transition-all"
          >
            + Add Service Category
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Mobile Card View */}
          <div className="lg:hidden">
            <div className="divide-y divide-gray-200">
              {serviceCategories.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="text-4xl mb-4">🔧</div>
                  <p className="text-lg font-medium">No service categories found</p>
                  <p className="text-sm">Add your first service category!</p>
                </div>
              ) : (
                serviceCategories.map((category, index) => (
                  <div key={category.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">🔧</span>
                          <div className="text-sm font-semibold text-gray-900">{category.name}</div>
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-500 mb-1">Created At</div>
                      <div className="text-sm text-gray-600">{new Date(category.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(category, 'service')}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex-1 sm:flex-none"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id, 'service')}
                        className="bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-700 transition-colors flex-1 sm:flex-none"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sr.No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviceCategories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      <div className="text-4xl mb-4">🔧</div>
                      <p className="text-lg font-medium">No service categories found</p>
                      <p className="text-sm">Add your first service category!</p>
                    </td>
                  </tr>
                ) : (
                  serviceCategories.map((category, index) => (
                    <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🔧</span>
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(category, 'service')}
                            className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id, 'service')}
                            className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-700 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={addModalRef} className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-bold mb-4">
              Add New {modalType === 'call' ? 'Call' : 'Service'} Category
            </h2>
            <form onSubmit={handleAddCategory}>
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium mb-1">Category Name *</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder={modalType === 'call' ? 'e.g., Installation' : 'e.g., Laptop Service'}
                  required
                  autoFocus
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium text-sm transition-all"
                >
                  Add Category
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={editModalRef} className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-bold mb-4">
              Edit {modalType === 'call' ? 'Call' : 'Service'} Category
            </h2>
            <form onSubmit={handleEditCategory}>
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium mb-1">Category Name *</label>
                <input
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                  autoFocus
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium text-sm transition-all"
                >
                  Update Category
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCategory(null);
                    setEditCategoryName('');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                >
                  Cancel
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
