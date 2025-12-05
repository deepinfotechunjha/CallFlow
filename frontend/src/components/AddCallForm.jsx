import React, { useState } from 'react';
import useCallStore from '../store/callStore';
import useAuthStore from '../store/authStore';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
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
      </div>
    </div>
  );
};

export default AddCallForm;