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
          customerName: existingCustomer.name || '',
          email: existingCustomer.email || '',
          address: existingCustomer.address || ''
        }));
        setCustomerFound(true);
      } else {
        setFormData(prev => ({
          ...prev,
          customerName: '',
          email: '',
          address: ''
        }));
        setCustomerFound(false);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        customerName: '',
        email: '',
        address: ''
      }));
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
      const isDuplicate = await checkForDuplicate();
      if (isDuplicate) {
        setIsSubmitting(false);
        return;
      }
      
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
      const isVisited = duplicateCall.status === 'VISITED';
      const message = isVisited 
        ? 'Existing visited call updated - marked as called again'
        : 'Existing call updated - marked as called again';
      toast.success(message);
      setShowDuplicateModal(false);
      onClose();
      setTimeout(() => {
        const { fetchCalls } = useCallStore.getState();
        fetchCalls();
      }, 500);
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div ref={modalRef} className="bg-white rounded-xl p-6 sm:p-7 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#E0E2E5] shadow-xl">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#E0E2E5]">
          <div>
            <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-[#FF2E46] bg-[#FFE8EB] px-2 py-0.5 rounded-md mb-1 border border-[#FF2E46]/20">
              New Ticket
            </span>
            <h2 className="text-lg font-bold text-[#2C2C2C]">Add New Call</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#F0F2F5] hover:bg-[#FFE8EB] hover:text-[#FF2E46] text-[#666666] flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1">
              Phone Number <span className="text-[#FF2E46]">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full px-3 py-2 border border-[#E0E2E5] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FF2E46]/20 focus:border-[#FF2E46] text-[#2C2C2C] transition-all"
              required
            />
            {customerFound && (
              <p className="text-emerald-600 text-xs font-medium mt-1 flex items-center gap-1">
                ✓ Customer found! Fields auto-filled (editable).
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1">
              Customer Name <span className="text-[#FF2E46]">*</span>
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              placeholder="Full name or company name"
              className="w-full px-3 py-2 border border-[#E0E2E5] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FF2E46]/20 focus:border-[#FF2E46] text-[#2C2C2C] transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="customer@domain.com"
              className="w-full px-3 py-2 border border-[#E0E2E5] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FF2E46]/20 focus:border-[#FF2E46] text-[#2C2C2C] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1">
              Address <span className="text-[#FF2E46]">*</span>
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Full customer address..."
              className="w-full px-3 py-2 border border-[#E0E2E5] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FF2E46]/20 focus:border-[#FF2E46] text-[#2C2C2C] transition-all"
              rows="2"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1">
              Problem Category <span className="text-[#FF2E46]">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-[#E0E2E5] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FF2E46]/20 focus:border-[#FF2E46] text-[#2C2C2C] transition-all"
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1">
              Problem Description <span className="text-[#FF2E46]">*</span>
            </label>
            <textarea
              value={formData.problem}
              onChange={(e) => setFormData(prev => ({ ...prev, problem: e.target.value }))}
              placeholder="Describe issue, device model, or symptoms..."
              className="w-full px-3 py-2 border border-[#E0E2E5] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FF2E46]/20 focus:border-[#FF2E46] text-[#2C2C2C] transition-all"
              rows="3"
              required
            />
          </div>

          {canAssign && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1">
                Assign To (Optional)
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full px-3 py-2 border border-[#E0E2E5] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FF2E46]/20 focus:border-[#FF2E46] text-[#2C2C2C] transition-all"
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
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1">
                Engineer Instructions
              </label>
              <textarea
                value={formData.engineerRemark}
                onChange={(e) => setFormData(prev => ({ ...prev, engineerRemark: e.target.value }))}
                className="w-full px-3 py-2 border border-[#E0E2E5] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FF2E46]/20 focus:border-[#FF2E46] text-[#2C2C2C] transition-all"
                rows="2"
                placeholder="Optional instructions for the assigned engineer..."
                readOnly={!canAssign}
              />
            </div>
          )}

          <div className="flex gap-2.5 pt-3 border-t border-[#E0E2E5]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 bg-[#F0F2F5] hover:bg-[#E0E2E5] text-[#2C2C2C] rounded-lg font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#FF2E46] hover:bg-[#E02038] text-white py-2 rounded-lg font-semibold text-xs shadow-xs disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Registering Call...' : 'Create Call Ticket'}
            </button>
          </div>
        </form>
        
        {/* Duplicate Detection Modal */}
        {showDuplicateModal && duplicateCall && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-60 p-4">
            <div ref={duplicateModalRef} className="bg-white rounded-xl p-5 w-full max-w-lg border border-[#E0E2E5] shadow-xl animate-in fade-in duration-150">
              <div className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md mb-2">
                Duplicate Detected
              </div>
              <h3 className="text-base font-bold text-[#2C2C2C] mb-3">Similar Call Found</h3>
              
              <div className="mb-4 p-3.5 bg-[#F8F9FA] border border-[#E0E2E5] rounded-lg text-xs space-y-1 text-[#2C2C2C]">
                <p><strong>Call ID:</strong> #{duplicateCall.id}</p>
                <p><strong>Customer:</strong> {duplicateCall.customerName}</p>
                <p><strong>Phone:</strong> {duplicateCall.phone}</p>
                <p><strong>Category:</strong> {duplicateCall.category}</p>
                <p><strong>Problem:</strong> {duplicateCall.problem}</p>
                <p><strong>Status:</strong> {duplicateCall.status}</p>
                <p><strong>Created:</strong> {new Date(duplicateCall.createdAt).toLocaleString()}</p>
                {duplicateCall.assignedTo && <p><strong>Assigned To:</strong> {duplicateCall.assignedTo}</p>}
                {duplicateCall.callCount > 1 && (
                  <p className="text-[#FF2E46] font-bold">Called {duplicateCall.callCount}x</p>
                )}
              </div>
              
              <p className="text-xs text-[#666666] mb-4">
                A similar call exists for this customer in the same category. What would you like to do?
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateExisting}
                  className="flex-1 bg-[#2C2C2C] hover:bg-[#1A1A1A] text-white py-2 px-3 rounded-lg font-semibold text-xs transition-colors"
                >
                  Update Existing
                </button>
                <button
                  onClick={handleAddNew}
                  className="flex-1 bg-[#FF2E46] hover:bg-[#E02038] text-white py-2 px-3 rounded-lg font-semibold text-xs shadow-xs transition-colors"
                >
                  Add New Ticket
                </button>
                <button
                  onClick={() => {
                    setShowDuplicateModal(false);
                    setIsSubmitting(false);
                  }}
                  className="px-3 py-2 bg-[#F0F2F5] hover:bg-[#E0E2E5] text-[#2C2C2C] rounded-lg font-semibold text-xs transition-colors"
                >
                  Cancel
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