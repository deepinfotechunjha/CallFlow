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
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Access denied. Only HOST users can manage categories.
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Category Settings</h1>

      {/* Call Categories Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Call Categories</h2>
          <button
            onClick={() => openAddModal('call')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium text-sm sm:text-base w-full sm:w-auto"
          >
            + Add Call Category
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category Name
              </th>
              <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                  No categories found. Add your first category!
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                    {category.name}
                  </td>
                  <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {new Date(category.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                    <button
                      onClick={() => openEditModal(category, 'call')}
                      className="text-blue-600 hover:text-blue-900 mr-2 sm:mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id, 'call')}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Service Categories Section */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Service Categories</h2>
          <button
            onClick={() => openAddModal('service')}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium text-sm sm:text-base w-full sm:w-auto"
          >
            + Add Service Category
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category Name
                </th>
                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {serviceCategories.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    No service categories found. Add your first service category!
                  </td>
                </tr>
              ) : (
                serviceCategories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {new Date(category.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                      <button
                        onClick={() => openEditModal(category, 'service')}
                        className="text-blue-600 hover:text-blue-900 mr-2 sm:mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id, 'service')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={addModalRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
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
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder={modalType === 'call' ? 'e.g., Installation' : 'e.g., Laptop Service'}
                  required
                  autoFocus
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium text-sm"
                >
                  Add Category
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 text-sm"
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
          <div ref={editModalRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
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
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                  autoFocus
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium text-sm"
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
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 text-sm"
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
