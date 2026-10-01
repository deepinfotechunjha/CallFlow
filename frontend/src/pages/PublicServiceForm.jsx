import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const PublicServiceForm = () => {
  const { linkId } = useParams();
  const [isValidating, setIsValidating] = useState(true);
  const [isValidLink, setIsValidLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serviceCategories, setServiceCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    address: '',
    category: '',
    serviceDescription: ''
  });

  useEffect(() => {
    validateLink();
    fetchServiceCategories();
  }, [linkId]);

  const validateLink = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/share-service/${linkId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setIsValidLink(true);
      } else {
        setIsValidLink(false);
        toast.error(data.error || 'Invalid or expired link');
      }
    } catch (error) {
      console.error('Link validation error:', error);
      setIsValidLink(false);
      toast.error('Failed to validate link');
    } finally {
      setIsValidating(false);
    }
  };

  const fetchServiceCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/service-categories`);
      if (response.ok) {
        const data = await response.json();
        setServiceCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch service categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.phone || !formData.address || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/share-service/${linkId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSubmitted(true);
        toast.success('Service request submitted successfully!');
      } else {
        toast.error(data.error || 'Failed to submit service request');
      }
    } catch (error) {
      console.error('Submit service error:', error);
      toast.error('Failed to submit service request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF2E46] mx-auto mb-3"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Validating access link...</p>
        </div>
      </div>
    );
  }

  if (!isValidLink) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl border border-[#E0E2E5] p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-[#FFE8EB] text-[#FF2E46] rounded-xl flex items-center justify-center mx-auto mb-4 border border-[#FF2E46]/20">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#2C2C2C] mb-2">Invalid or Expired Link</h1>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            This service share link is either invalid, has expired after 24 hours, or has already been used.
          </p>
          <div className="bg-[#F8F9FA] rounded-lg p-3 text-xs text-gray-500 border border-[#E0E2E5]">
            Please contact Deep Infotech support for assistance.
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl border border-[#E0E2E5] p-8 max-w-md w-full text-center animate-in fade-in duration-150">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF2E46] block mb-1">DEEP INFOTECH CARRY-IN SERVICE</span>
          <h1 className="text-xl font-bold text-[#2C2C2C] mb-2">Service Request Registered!</h1>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Your carry-in service request has been queued in our service center. Bring your device or await technician verification.
          </p>
          <p className="text-xs text-gray-400">
            This secure one-time link has now been deactivated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-[#E0E2E5] text-[#FF2E46] text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#FF2E46]"></span>
            Since 2003 • 20+ Years of Trust
          </div>
          <h2 className="text-2xl font-black text-[#2C2C2C] tracking-tight">
            DEEP <span className="text-[#FF2E46]">INFOTECH</span>
          </h2>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-0.5">Carry-In Service Registration</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl border border-[#E0E2E5] overflow-hidden">
          <div className="bg-[#2C2C2C] p-6 text-white border-b-4 border-[#FF2E46]">
            <span className="text-[10px] font-bold text-[#FF2E46] uppercase tracking-widest block mb-1">Service Desk Intake</span>
            <h1 className="text-xl font-bold">Register Carry-In Service</h1>
            <p className="text-xs text-gray-300 mt-1">
              Please fill out your device and contact details for prompt service processing and tracking.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Customer Name <span className="text-[#FF2E46]">*</span>
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all placeholder:text-gray-400"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Phone Number <span className="text-[#FF2E46]">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all font-mono placeholder:text-gray-400"
                  placeholder="Enter 10-digit number"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Email Address <span className="text-gray-400 font-normal text-xs lowercase">(optional)</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all placeholder:text-gray-400"
                placeholder="example@mail.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Address <span className="text-[#FF2E46]">*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                rows={2}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all placeholder:text-gray-400"
                placeholder="Residential or office address"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Service Category <span className="text-[#FF2E46]">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all font-medium"
              >
                <option value="">Select equipment / service type</option>
                {serviceCategories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Service Description & Symptoms
              </label>
              <textarea
                name="serviceDescription"
                value={formData.serviceDescription}
                onChange={handleChange}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all placeholder:text-gray-400"
                placeholder="Describe the issues, symptoms, error messages, or parts required..."
              />
            </div>

            <div className="bg-[#FFE8EB]/40 border border-[#FF2E46]/20 rounded-lg p-3.5">
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-[#FF2E46] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-bold text-[#2C2C2C] text-xs uppercase tracking-wider mb-0.5">Important:</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    This form link can only be submitted once. Please confirm details before hitting submit.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-6 bg-[#FF2E46] text-white rounded-lg hover:bg-[#E02038] disabled:opacity-50 text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting Request...
                </span>
              ) : (
                'Submit Service Request'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicServiceForm;