import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useClickOutside from '../hooks/useClickOutside';

const PublicSalesForm = () => {
  const { linkId } = useParams();
  const [isValidating, setIsValidating] = useState(true);
  const [isValidLink, setIsValidLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showOtherCity, setShowOtherCity] = useState(false);
  const [showOtherArea, setShowOtherArea] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [publicToken, setPublicToken] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (value) => {
    if (!value) return '';
    if (/[A-Z]/.test(value)) return 'Email must be in lowercase letters';
    if (value.includes(' ')) return 'Email must not contain spaces';
    if (!value.includes('@')) return 'Email must contain @';
    const [, domain] = value.split('@');
    if (!domain) return 'Email must have a domain (e.g. gmail.com)';
    if (!domain.includes('.')) return 'Email must contain a dot in domain (e.g. .com)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
    return '';
  };
  const cityDropdownRef = useClickOutside(() => setShowCityDropdown(false));
  const areaDropdownRef = useClickOutside(() => setShowAreaDropdown(false));

  const filteredCities = cities.filter(city => 
    city.name.toLowerCase().includes(citySearch.toLowerCase())
  );
  
  const filteredAreas = areas.filter(area => 
    area.toLowerCase().includes(areaSearch.toLowerCase())
  );

  const handleCitySelect = (city) => {
    if (city === 'OTHER') {
      setShowOtherCity(true);
      setSelectedCity(null);
      setFormData(prev => ({ ...prev, city: '' }));
      setShowCityDropdown(false);
      setAreas([]);
    } else {
      setShowOtherCity(false);
      setSelectedCity(city);
      setFormData(prev => ({ ...prev, city: city ? city.name : '' }));
      setShowCityDropdown(false);
      setCitySearch('');
      if (city) {
        loadAreas(city);
      } else {
        setAreas([]);
      }
      setFormData(prev => ({ ...prev, area: '' }));
    }
  };

  const handleAreaSelect = (area) => {
    if (area === 'OTHER') {
      setShowOtherArea(true);
      setFormData(prev => ({ ...prev, area: '' }));
      setShowAreaDropdown(false);
    } else {
      setShowOtherArea(false);
      setFormData(prev => ({ ...prev, area: area }));
      setShowAreaDropdown(false);
      setAreaSearch('');
    }
  };
  
  const [formData, setFormData] = useState({
    firmName: '',
    gstNo: '',
    contactPerson1Name: '',
    contactPerson1Number: '',
    contactPerson2Name: '',
    contactPerson2Number: '',
    accountContactName: '',
    accountContactNumber: '',
    address: '',
    landmark: '',
    area: '',
    city: '',
    pincode: '',
    email: '',
    whatsappNumber: ''
  });

  useEffect(() => {
    validateLink();
  }, [linkId]);

  const loadCities = async (token) => {
    setLoadingData(true);
    try {
      const citiesResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/public/cities?token=${token}`, {
        credentials: 'include'
      });

      if (citiesResponse.ok) {
        const citiesData = await citiesResponse.json();
        setCities(citiesData || []);
      }
    } catch (error) {
      console.error('Failed to load cities:', error);
      toast.error('Failed to load city data');
    } finally {
      setLoadingData(false);
    }
  };

  const loadAreas = async (city) => {
    if (!city) {
      setAreas([]);
      return;
    }

    setLoadingData(true);
    try {
      const areasResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/public/areas?cityId=${city.id}&token=${publicToken}`, {
        credentials: 'include'
      });

      if (areasResponse.ok) {
        const areasData = await areasResponse.json();
        setAreas(areasData || []);
      }
    } catch (error) {
      console.error('Failed to load areas:', error);
      toast.error('Failed to load area data');
    } finally {
      setLoadingData(false);
    }
  };

  const validateLink = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/share/sales/${linkId}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setIsValidLink(true);
        setPublicToken(data.publicToken);
        await loadCities(data.publicToken);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.firmName || !formData.gstNo || !formData.contactPerson1Name || !formData.contactPerson1Number || !formData.address || !formData.city || !formData.area || !formData.pincode) {
      toast.error('Please fill in all required fields');
      return;
    }

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    const gstUpper = formData.gstNo.toUpperCase();
    if (!gstRegex.test(gstUpper)) {
      toast.error('Please enter a valid GST number (e.g., 22AAAAA0000A1Z5)');
      return;
    }

    const emailErr = validateEmail(formData.email);
    if (emailErr) { setEmailError(emailErr); return; }

    setIsSubmitting(true);
    try {
      const submitData = {
        firmName: formData.firmName.trim(),
        gstNo: gstUpper,
        contactPerson1Name: formData.contactPerson1Name.trim(),
        contactPerson1Number: formData.contactPerson1Number.trim(),
        contactPerson2Name: formData.contactPerson2Name?.trim() || null,
        contactPerson2Number: formData.contactPerson2Number?.trim() || null,
        accountContactName: formData.accountContactName?.trim() || null,
        accountContactNumber: formData.accountContactNumber?.trim() || null,
        address: formData.address.trim(),
        landmark: formData.landmark?.trim() || null,
        area: formData.area?.trim() || null,
        city: formData.city.trim(),
        pincode: formData.pincode.trim(),
        email: formData.email?.trim() || null,
        whatsappNumber: formData.whatsappNumber?.trim() || null
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/share/sales/${linkId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSubmitted(true);
        toast.success('Dealer information submitted successfully!');
      } else {
        toast.error(data.error || 'Failed to submit dealer data');
      }
    } catch (error) {
      console.error('Submit sales entry error:', error);
      toast.error('Failed to submit dealer data. Please try again.');
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
            This share link is either invalid, has expired after 1 hour, or has already been used.
          </p>
          <div className="bg-[#F8F9FA] rounded-lg p-3 text-xs text-gray-500 border border-[#E0E2E5]">
            Please contact Deep Infotech to request a new dealer onboarding link.
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
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF2E46] block mb-1">DEEP INFOTECH CALLFLOW</span>
          <h1 className="text-xl font-bold text-[#2C2C2C] mb-2">Dealer Profile Submitted!</h1>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Your partner record and billing particulars have been registered successfully. Our team will verify and connect with you shortly.
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
      <div className="max-w-4xl mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-[#E0E2E5] text-[#FF2E46] text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#FF2E46]"></span>
            Since 2003 • 20+ Years of Trust
          </div>
          <h2 className="text-2xl font-black text-[#2C2C2C] tracking-tight">
            DEEP <span className="text-[#FF2E46]">INFOTECH</span>
          </h2>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-0.5">Dealer / Partner Onboarding Portal</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl border border-[#E0E2E5] overflow-hidden">
          <div className="bg-[#2C2C2C] p-6 text-white border-b-4 border-[#FF2E46]">
            <span className="text-[10px] font-bold text-[#FF2E46] uppercase tracking-widest block mb-1">Partner Registration</span>
            <h1 className="text-xl font-bold">Submit Dealer / Firm Particulars</h1>
            <p className="text-xs text-gray-300 mt-1">
              Please submit accurate firm, contact, GST, and address details to register in our supplier & customer network.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Basic Information */}
            <div className="border-b border-[#E0E2E5] pb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF2E46]"></span> 1. Basic Firm Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Firm / Company Name <span className="text-[#FF2E46]">*</span>
                  </label>
                  <input
                    type="text"
                    name="firmName"
                    value={formData.firmName}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-4 focus:ring-[#FF2E46]/10 transition-all font-semibold placeholder:text-gray-400"
                    placeholder="Enter registered firm name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    GST Number <span className="text-[#FF2E46]">*</span>
                  </label>
                  <input
                    type="text"
                    name="gstNo"
                    value={formData.gstNo}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-4 focus:ring-[#FF2E46]/10 transition-all uppercase font-mono font-bold placeholder:text-gray-400"
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b border-gray-100 pb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF2E46]"></span> 2. Key Contacts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Contact Person 1 Name <span className="text-[#FF2E46]">*</span>
                  </label>
                  <input
                    type="text"
                    name="contactPerson1Name"
                    value={formData.contactPerson1Name}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-4 focus:ring-[#FF2E46]/10 transition-all"
                    placeholder="Primary contact name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Contact Person 1 Number <span className="text-[#FF2E46]">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contactPerson1Number"
                    value={formData.contactPerson1Number}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-4 focus:ring-[#FF2E46]/10 transition-all font-mono font-medium"
                    placeholder="10-digit number"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Contact Person 2 Name <span className="text-gray-400 font-normal text-xs lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    name="contactPerson2Name"
                    value={formData.contactPerson2Name}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-4 focus:ring-[#FF2E46]/10 transition-all"
                    placeholder="Secondary contact name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Contact Person 2 Number <span className="text-gray-400 font-normal text-xs lowercase">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    name="contactPerson2Number"
                    value={formData.contactPerson2Number}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-4 focus:ring-[#FF2E46]/10 transition-all font-mono"
                    placeholder="10-digit number"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Account Contact Name <span className="text-gray-400 font-normal text-xs lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    name="accountContactName"
                    value={formData.accountContactName}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-4 focus:ring-[#FF2E46]/10 transition-all"
                    placeholder="Billing / Accounts person"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Account Contact Number <span className="text-gray-400 font-normal text-xs lowercase">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    name="accountContactNumber"
                    value={formData.accountContactNumber}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-4 focus:ring-[#FF2E46]/10 transition-all font-mono"
                    placeholder="10-digit number"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Email Address <span className="text-gray-400 font-normal text-xs lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    name="email"
                    value={formData.email}
                    onChange={(e) => { handleChange(e); if (emailError) setEmailError(''); }}
                    onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                    className={`w-full px-3.5 py-2.5 bg-[#F8F9FA] border rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-4 focus:ring-[#FF2E46]/10 transition-all ${emailError ? 'border-red-400' : 'border-gray-200'}`}
                    placeholder="company@mail.com"
                  />
                  {emailError && <p className="text-[#FF2E46] text-xs mt-1 font-semibold">{emailError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    💬 WhatsApp Number <span className="text-gray-400 font-normal text-xs lowercase">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                    placeholder="Defaults to Contact-1 number if blank"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF2E46]"></span> 3. Location & Billing Address
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Registered Address <span className="text-[#FF2E46]">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    rows={2}
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-4 focus:ring-[#FF2E46]/10 transition-all"
                    placeholder="Shop/Office number, building, complex, road"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Landmark <span className="text-gray-400 font-normal text-xs lowercase">(optional)</span>
                    </label>
                    <input
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-4 focus:ring-[#FF2E46]/10 transition-all"
                      placeholder="Near landmark"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      City <span className="text-[#FF2E46]">*</span>
                    </label>
                    {showOtherCity ? (
                      <div className="relative">
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          required
                          className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-4 focus:ring-[#FF2E46]/10 transition-all"
                          placeholder="Enter city name"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOtherCity(false)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="relative" ref={cityDropdownRef}>
                        {selectedCity ? (
                          <div className="w-full px-3.5 py-2.5 border border-[#FF2E46]/30 rounded-xl bg-[#FFE8EB]/20 flex items-center justify-between text-sm">
                            <span className="font-bold text-[#2C2C2C]">{selectedCity.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCity(null);
                                setFormData(prev => ({ ...prev, city: '' }));
                                setAreas([]);
                                setFormData(prev => ({ ...prev, area: '' }));
                              }}
                              className="w-6 h-6 rounded-full bg-white text-gray-400 hover:text-[#FF2E46] flex items-center justify-center font-bold text-sm leading-none border border-gray-200 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={citySearch}
                            onChange={(e) => {
                              setCitySearch(e.target.value);
                              setShowCityDropdown(true);
                            }}
                            onFocus={() => setShowCityDropdown(true)}
                            onClick={() => setShowCityDropdown(true)}
                            placeholder={loadingData ? "Loading cities..." : "Select or search city"}
                            className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-4 focus:ring-[#FF2E46]/10 transition-all placeholder:text-gray-400"
                            disabled={loadingData}
                            required
                          />
                        )}
                        {showCityDropdown && !loadingData && !selectedCity && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-hidden">
                            <div 
                              onClick={() => handleCitySelect('OTHER')}
                              className="sticky top-0 px-3.5 py-2.5 bg-[#FFE8EB]/50 hover:bg-[#FFE8EB] cursor-pointer font-bold text-xs uppercase tracking-wider text-[#FF2E46] border-b border-[#FF2E46]/20 z-10 transition-colors"
                            >
                              ✏️ Other (Custom City)
                            </div>
                            <div className="overflow-y-auto max-h-52">
                              {filteredCities.length > 0 ? (
                                filteredCities.map((city) => (
                                  <div
                                    key={city.id}
                                    onClick={() => handleCitySelect(city)}
                                    className="px-3.5 py-2 hover:bg-[#FFE8EB]/20 cursor-pointer text-sm font-medium text-[#2C2C2C] transition-colors"
                                  >
                                    {city.name}
                                  </div>
                                ))
                              ) : (
                                <div className="px-3.5 py-2 text-gray-400 text-xs">No cities found</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Area <span className="text-[#FF2E46]">*</span>
                    </label>
                    {showOtherArea ? (
                      <div className="relative">
                        <input
                          type="text"
                          name="area"
                          value={formData.area}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-4 focus:ring-[#FF2E46]/10 transition-all"
                          placeholder="Enter area name"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOtherArea(false)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="relative" ref={areaDropdownRef}>
                        {formData.area && !showOtherArea ? (
                          <div className="w-full px-3.5 py-2.5 border border-[#FF2E46]/30 rounded-xl bg-[#FFE8EB]/20 flex items-center justify-between text-sm">
                            <span className="font-bold text-[#2C2C2C]">{formData.area}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, area: '' }));
                                setAreaSearch('');
                              }}
                              className="w-6 h-6 rounded-full bg-white text-gray-400 hover:text-[#FF2E46] flex items-center justify-center font-bold text-sm leading-none border border-gray-200 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={areaSearch}
                            onChange={(e) => {
                              setAreaSearch(e.target.value);
                              setShowAreaDropdown(true);
                            }}
                            onFocus={() => setShowAreaDropdown(true)}
                            onClick={() => setShowAreaDropdown(true)}
                            placeholder={loadingData ? "Loading areas..." : selectedCity ? "Select or search area" : "Select city first"}
                            className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-4 focus:ring-[#FF2E46]/10 transition-all placeholder:text-gray-400 disabled:opacity-50"
                            disabled={loadingData || (!selectedCity && !showOtherCity)}
                          />
                        )}
                        {showAreaDropdown && !loadingData && !formData.area && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-hidden">
                            <div 
                              onClick={() => handleAreaSelect('OTHER')}
                              className="sticky top-0 px-3.5 py-2.5 bg-[#FFE8EB]/50 hover:bg-[#FFE8EB] cursor-pointer font-bold text-xs uppercase tracking-wider text-[#FF2E46] border-b border-[#FF2E46]/20 z-10 transition-colors"
                            >
                              ✏️ Other (Custom Area)
                            </div>
                            <div className="overflow-y-auto max-h-52">
                              {filteredAreas.length > 0 ? (
                                filteredAreas.map((area, index) => (
                                  <div
                                    key={index}
                                    onClick={() => handleAreaSelect(area)}
                                    className="px-3.5 py-2 hover:bg-[#FFE8EB]/20 cursor-pointer text-sm font-medium text-[#2C2C2C] transition-colors"
                                  >
                                    {area}
                                  </div>
                                ))
                              ) : selectedCity ? (
                                <div className="px-3.5 py-2 text-gray-400 text-xs">No areas found for this city</div>
                              ) : (
                                <div className="px-3.5 py-2 text-gray-400 text-xs">Please select a city first</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Pincode <span className="text-[#FF2E46]">*</span>
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-4 focus:ring-[#FF2E46]/10 transition-all font-mono font-semibold"
                      placeholder="Enter 6-digit pincode"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#FFE8EB]/40 border border-[#FF2E46]/20 rounded-lg p-3.5">
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-[#FF2E46] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-bold text-[#2C2C2C] text-xs uppercase tracking-wider mb-0.5">Single-Use Link:</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Once submitted, this dealer registration is recorded in Deep Infotech's central management portal and cannot be resubmitted with this link.
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
                  Submitting Information...
                </span>
              ) : (
                'Submit Dealer Registration'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicSalesForm;