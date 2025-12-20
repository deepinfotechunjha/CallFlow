import React, { useState, useEffect } from 'react';
import useCallStore from '../store/callStore';
import useAuthStore from '../store/authStore';
import useCategoryStore from '../store/categoryStore';
import useClickOutside from '../hooks/useClickOutside';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const AddCallForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    address: '',
    problem: '',
    category: '',
    assignedTo: '',
    engineerRemark: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerFound, setCustomerFound] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateCall, setDuplicateCall] = useState(null);
  
  const { addCall, findCustomerByPhone } = useCallStore();
  const { user, users } = useAuthStore();
  const { categories, fetchCategories } = useCategoryStore();
  const canAssign = user?.role === 'HOST' || user?.role === 'ADMIN';

  const modalRef = useClickOutside(() => {
    if (!showDuplicateModal) onClose();
  });
  const duplicateModalRef = useClickOutside(() => {
    setShowDuplicateModal(false);
    setIsSubmitting(false);
  });

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [categories.length, fetchCategories]);

  const handlePhoneChange = async (phone) => {
    setFormData(prev => ({ ...prev, phone }));

    if (phone.length >= 10) {
      const existingCustomer = await findCustomerByPhone(phone);
      if (existingCustomer) {
        setFormData(prev => ({
          ...prev,
          customerName: existingCustomer.name || prev.customerName,
          email: existingCustomer.email || '',
          address: existingCustomer.address || ''
        }));
        setCustomerFound(true);
      } else {
        setCustomerFound(false);
      }
    } else {
      setCustomerFound(false);
    }
  };

  const checkForDuplicate = async () => {
    try {
      const response = await apiClient.post('/calls/check-duplicate', {
        phone: formData.phone,
        category: formData.category
      });
      
      if (response.data.duplicate) {
        setDuplicateCall(response.data.existingCall);
        setShowDuplicateModal(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Check for duplicates first
      const isDuplicate = await checkForDuplicate();
      if (isDuplicate) {
        setIsSubmitting(false);
        return;
      }
      
      // No duplicate, proceed with adding call
      await addCall({
        ...formData,
        createdBy: user.username,
        status: 'PENDING'
      });

      onClose();
    } catch (error) {
      console.error('Error adding call:', error);
      setIsSubmitting(false);
    }
  };

  const handleUpdateExisting = async () => {
    try {
      await apiClient.put(`/calls/${duplicateCall.id}/increment`);
      toast.success('Existing call updated - marked as called again');
      setShowDuplicateModal(false);
      onClose();
    } catch (error) {
      toast.error('Failed to update existing call');
    }
  };

  const handleAddNew = async () => {
    try {
      await addCall({
        ...formData,
        createdBy: user.username,
        status: 'PENDING'
      });
      setShowDuplicateModal(false);
      onClose();
    } catch (error) {
      toast.error('Failed to add new call');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold">Add New Call</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1">Phone Number *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
            {customerFound && <p className="text-green-600 text-xs sm:text-sm">✓ Customer found! Fields auto-filled (you can edit them)</p>}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1">Customer Name *</label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
              rows="2"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1">Problem Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1">Problem Description *</label>
            <textarea
              value={formData.problem}
              onChange={(e) => setFormData(prev => ({ ...prev, problem: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
              rows="3"
              required
            />
          </div>

          {canAssign && (
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Assign To</label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select Engineer</option>
                {users.filter(u => u.role === 'ENGINEER' || u.role === 'ADMIN').map(u => (
                  <option key={u.id} value={u.username}>{u.username} ({u.role})</option>
                ))}
              </select>
            </div>
          )}

          {formData.assignedTo && (
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Engineer Instructions</label>
              <textarea
                value={formData.engineerRemark}
                onChange={(e) => setFormData(prev => ({ ...prev, engineerRemark: e.target.value }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                rows="2"
                placeholder="Optional instructions for the assigned engineer..."
                readOnly={!canAssign}
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium text-sm"
            >
              {isSubmitting ? 'Adding...' : 'Add Call'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
        
        {/* Duplicate Detection Modal */}
        {showDuplicateModal && duplicateCall && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
            <div ref={duplicateModalRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="text-base sm:text-lg font-bold mb-4 text-orange-600">Similar Call Found!</h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-xs sm:text-sm text-gray-600 mb-2">Existing call details:</p>
                <p className="text-xs sm:text-sm break-words"><strong>Call ID:</strong> #{duplicateCall.id}</p>
                <p className="text-xs sm:text-sm break-words"><strong>Customer:</strong> {duplicateCall.customerName}</p>
                <p className="text-xs sm:text-sm break-words"><strong>Phone:</strong> {duplicateCall.phone}</p>
                <p className="text-xs sm:text-sm break-words"><strong>Category:</strong> {duplicateCall.category}</p>
                <p className="text-xs sm:text-sm break-words"><strong>Problem:</strong> {duplicateCall.problem}</p>
                <p className="text-xs sm:text-sm"><strong>Status:</strong> {duplicateCall.status}</p>
                <p className="text-xs sm:text-sm break-words"><strong>Created:</strong> {new Date(duplicateCall.createdAt).toLocaleString()}</p>
                {duplicateCall.assignedTo && <p className="text-xs sm:text-sm break-words"><strong>Assigned to:</strong> {duplicateCall.assignedTo}</p>}
                {duplicateCall.callCount > 1 && (
                  <p className="text-xs sm:text-sm text-orange-600 font-medium">Called {duplicateCall.callCount}x</p>
                )}
              </div>
              
              <p className="text-xs sm:text-sm text-gray-700 mb-6">
                A similar call exists for this customer in the same category. What would you like to do?
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleUpdateExisting}
                  className="flex-1 bg-orange-600 text-white py-2 px-2 sm:px-4 rounded hover:bg-orange-700 font-medium text-xs sm:text-sm"
                >
                  🔄 Update Existing
                </button>
                <button
                  onClick={handleAddNew}
                  className="flex-1 bg-blue-600 text-white py-2 px-2 sm:px-4 rounded hover:bg-blue-700 font-medium text-xs sm:text-sm"
                >
                  ➕ Add New
                </button>
                <button
                  onClick={() => {
                    setShowDuplicateModal(false);
                    setIsSubmitting(false);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-2 sm:px-4 rounded hover:bg-gray-400 text-xs sm:text-sm"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddCallForm;