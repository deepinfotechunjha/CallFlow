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
      // Load areas for the selected city
      if (city) {
        loadAreas(city, publicToken);
      } else {
        setAreas([]);
      }
      // Clear area selection when city changes
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
      const citiesResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/public/cities`, {
        headers: { 'X-Public-Token': token }
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

  const loadAreas = async (city, token) => {
    if (!city) {
      setAreas([]);
      return;
    }

    setLoadingData(true);
    try {
      const areasResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/public/areas?cityId=${city.id}`, {
        headers: { 'X-Public-Token': token || publicToken }
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/share/sales/${linkId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setIsValidLink(true);
        const token = data.publicToken;
        setPublicToken(token);
        await loadCities(token);
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
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSubmitted(true);
        toast.success('Dealer data submitted successfully!');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating link...</p>
        </div>
      </div>
    );
  }

  if (!isValidLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Invalid Link</h1>
          <p className="text-gray-600 mb-4">
            This share link is either invalid, expired, or has already been used.
          </p>
          <p className="text-sm text-gray-500">
            Share links expire after 1 hour and can only be used once.
          </p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Dealer Data Submitted Successfully!</h1>
          <p className="text-gray-600 mb-4">
            Your dealer data has been submitted and will be processed by our team.
          </p>
          <p className="text-sm text-gray-500">
            This link has been deactivated and cannot be used again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">Submit Dealer Data</h1>
            <p className="text-purple-100">
              Please fill out the form below to submit your dealer data.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Firm Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firmName"
                    value={formData.firmName}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter dealer / firm name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="gstNo"
                    value={formData.gstNo}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person 1 Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="contactPerson1Name"
                    value={formData.contactPerson1Name}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter contact person name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person 1 Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contactPerson1Number"
                    value={formData.contactPerson1Number}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person 2 Name
                  </label>
                  <input
                    type="text"
                    name="contactPerson2Name"
                    value={formData.contactPerson2Name}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter contact person name (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person 2 Number
                  </label>
                  <input
                    type="tel"
                    name="contactPerson2Number"
                    value={formData.contactPerson2Number}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter phone number (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Contact Name
                  </label>
                  <input
                    type="text"
                    name="accountContactName"
                    value={formData.accountContactName}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter account contact name (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Contact Number
                  </label>
                  <input
                    type="tel"
                    name="accountContactNumber"
                    value={formData.accountContactNumber}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter account contact number (optional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter email address (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter WhatsApp number (optional)"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Address Information</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter complete address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Landmark
                    </label>
                    <input
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter landmark (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    {showOtherCity ? (
                      <div className="relative">
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          required
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                          <div className="w-full p-3 border border-gray-300 rounded-lg bg-blue-50 flex items-center justify-between">
                            <span>{selectedCity.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCity(null);
                                setFormData(prev => ({ ...prev, city: '', area: '' }));
                                setAreas([]);
                              }}
                              className="text-red-500 hover:text-red-700 font-bold text-lg leading-none"
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
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            disabled={loadingData}
                            required
                          />
                        )}
                        {showCityDropdown && !loadingData && !selectedCity && (
                          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden">
                            <div
                              onClick={() => handleCitySelect('OTHER')}
                              className="sticky top-0 px-4 py-3 bg-purple-50 hover:bg-purple-100 cursor-pointer font-medium text-purple-700 border-b-2 border-purple-200 z-10"
                            >
                              ✏️ Other (Custom City)
                            </div>
                            <div className="overflow-y-auto max-h-52">
                              {filteredCities.length > 0 ? (
                                filteredCities.map((city) => (
                                  <div
                                    key={city.id}
                                    onClick={() => handleCitySelect(city)}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                  >
                                    {city.name}
                                  </div>
                                ))
                              ) : (
                                <div className="px-4 py-2 text-gray-500 text-sm">No cities found</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Area <span className="text-red-500">*</span>
                    </label>
                    {showOtherArea ? (
                      <div className="relative">
                        <input
                          type="text"
                          name="area"
                          value={formData.area}
                          onChange={handleChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                          <div className="w-full p-3 border border-gray-300 rounded-lg bg-green-50 flex items-center justify-between">
                            <span>{formData.area}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, area: '' }));
                                setAreaSearch('');
                              }}
                              className="text-red-500 hover:text-red-700 font-bold text-lg leading-none"
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
                            placeholder={loadingData ? "Loading areas..." : selectedCity ? "Select or search area" : "Please select a city first"}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            disabled={loadingData || !selectedCity}
                          />
                        )}
                        {showAreaDropdown && !loadingData && !formData.area && (
                          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden">
                            <div
                              onClick={() => handleAreaSelect('OTHER')}
                              className="sticky top-0 px-4 py-3 bg-purple-50 hover:bg-purple-100 cursor-pointer font-medium text-purple-700 border-b-2 border-purple-200 z-10"
                            >
                              ✏️ Other (Custom Area)
                            </div>
                            <div className="overflow-y-auto max-h-52">
                              {filteredAreas.length > 0 ? (
                                filteredAreas.map((area, index) => (
                                  <div
                                    key={index}
                                    onClick={() => handleAreaSelect(area)}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                  >
                                    {area}
                                  </div>
                                ))
                              ) : selectedCity ? (
                                <div className="px-4 py-2 text-gray-500 text-sm">No areas found for this city</div>
                              ) : (
                                <div className="px-4 py-2 text-gray-500 text-sm">Please select a city first</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter pincode"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-purple-600 text-lg">ℹ️</span>
                <div>
                  <h4 className="font-medium text-purple-800 mb-1">Important:</h4>
                  <p className="text-sm text-purple-700">
                    This form can only be submitted once. Please ensure all information is correct before submitting.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </span>
              ) : (
                'Submit Dealer Data'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicSalesForm;