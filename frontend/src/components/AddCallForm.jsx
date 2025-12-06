import React, { useState } from 'react';
import useCallStore from '../store/callStore';
import useAuthStore from '../store/authStore';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const PROBLEM_CATEGORIES = [
  'Technical Issue', 'Billing', 'Product Inquiry', 'Complaint', 'Support', 'Other'
];

const AddCallForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    address: '',
    problem: '',
    category: '',
    assignedTo: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerFound, setCustomerFound] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateCall, setDuplicateCall] = useState(null);
  
  const { addCall, findCustomerByPhone } = useCallStore();
  const { user, users } = useAuthStore();
  const canAssign = user?.role === 'HOST' || user?.role === 'ADMIN';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add New Call</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            {customerFound && <p className="text-green-600 text-sm">✓ Customer found! Fields auto-filled (you can edit them)</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Customer Name *</label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              rows="2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Problem Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Category</option>
              {PROBLEM_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Problem Description *</label>
            <textarea
              value={formData.problem}
              onChange={(e) => setFormData(prev => ({ ...prev, problem: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              rows="3"
              required
            />
          </div>

          {canAssign && (
            <div>
              <label className="block text-sm font-medium mb-1">Assign To</label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Worker</option>
                {users.filter(u => u.role === 'USER').map(u => (
                  <option key={u.id} value={u.username}>{u.username}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? 'Adding...' : 'Add Call'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
        
        {/* Duplicate Detection Modal */}
        {showDuplicateModal && duplicateCall && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <h3 className="text-lg font-bold mb-4 text-orange-600">Similar Call Found!</h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600 mb-2">Existing call details:</p>
                <p><strong>Call ID:</strong> #{duplicateCall.id}</p>
                <p><strong>Customer:</strong> {duplicateCall.customerName}</p>
                <p><strong>Phone:</strong> {duplicateCall.phone}</p>
                <p><strong>Category:</strong> {duplicateCall.category}</p>
                <p><strong>Problem:</strong> {duplicateCall.problem}</p>
                <p><strong>Status:</strong> {duplicateCall.status}</p>
                <p><strong>Created:</strong> {new Date(duplicateCall.createdAt).toLocaleString()}</p>
                {duplicateCall.assignedTo && <p><strong>Assigned to:</strong> {duplicateCall.assignedTo}</p>}
                {duplicateCall.callCount > 1 && (
                  <p className="text-orange-600 font-medium">Called {duplicateCall.callCount}x</p>
                )}
              </div>
              
              <p className="text-gray-700 mb-6">
                A similar call exists for this customer in the same category. What would you like to do?
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateExisting}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 font-medium"
                >
                  🔄 Update Existing Call
                </button>
                <button
                  onClick={handleAddNew}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 font-medium"
                >
                  ➕ Add New Call
                </button>
                <button
                  onClick={() => {
                    setShowDuplicateModal(false);
                    setIsSubmitting(false);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
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