import React, { useState, useEffect } from 'react';
import useCallStore from '../store/callStore';

const EditCustomerModal = ({ customer, isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateCustomer } = useCallStore();

  useEffect(() => {
    if (customer && isOpen) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || ''
      });
    }
  }, [customer, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateCustomer(customer.id, formData);
      onClose();
    } catch (error) {
      // Error handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-[#E0E2E5] p-5 sm:p-6">
        <div className="flex justify-between items-center pb-3 mb-4 border-b border-[#E0E2E5]">
          <h2 className="text-base font-bold text-[#2C2C2C]">Edit Customer Record</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-[#F0F2F5] hover:bg-[#FFE8EB] hover:text-[#FF2E46] text-[#666666] flex items-center justify-center transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Name <span className="text-[#FF2E46]">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Phone <span className="text-[#FF2E46]">*</span></label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
              rows="3"
            />
          </div>
          
          <div className="flex gap-2 pt-2 border-t border-[#E0E2E5]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs font-semibold uppercase tracking-wider transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#FF2E46] hover:bg-[#E02038] text-white py-2 rounded-lg font-semibold text-xs uppercase tracking-wider shadow-xs transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCustomerModal;