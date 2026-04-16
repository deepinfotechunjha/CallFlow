import React, { useState } from 'react';
import useSalesStore from '../store/salesStore';
import useClickOutside from '../hooks/useClickOutside';
import CityAreaSelector from './CityAreaSelector';

const AddSalesEntryForm = ({ onClose }) => {
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
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { addEntry } = useSalesStore();

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
  const modalRef = useClickOutside(onClose);

  const handleCityChange = (city) => {
    setSelectedCity(city);
    setFormData(prev => ({ ...prev, city: city ? city.name : '' }));
  };

  const handleAreaChange = (area) => {
    setSelectedArea(area);
    setFormData(prev => ({ ...prev, area: area ? area.name : '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.area) {
      alert('Area is required');
      setIsSubmitting(false);
      return;
    }

    const emailErr = validateEmail(formData.email);
    if (emailErr) { setEmailError(emailErr); return; }

    setIsSubmitting(true);
    try {
      await addEntry(formData);
      onClose();
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold">Add New Sales Entry</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs sm:text-sm font-medium mb-1">Firm Name *</label>
              <input
                type="text"
                value={formData.firmName}
                onChange={(e) => setFormData(prev => ({ ...prev, firmName: e.target.value }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">GST Number *</label>
              <input
                type="text"
                value={formData.gstNo}
                onChange={(e) => setFormData(prev => ({ ...prev, gstNo: e.target.value.toUpperCase() }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm uppercase"
                maxLength={15}
                placeholder="22AAAAA0000A1Z5"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Email</label>
              <input
                type="text"
                value={formData.email}
                onChange={(e) => { setFormData(prev => ({ ...prev, email: e.target.value })); if (emailError) setEmailError(''); }}
                onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm ${emailError ? 'border-red-400' : ''}`}
              />
              {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
            </div>

            {/* Contact Person 1 - Name & Number in parallel */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Contact Person-1 Name *</label>
              <input
                type="text"
                value={formData.contactPerson1Name}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPerson1Name: e.target.value }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Contact Person-1 Number *</label>
              <input
                type="tel"
                value={formData.contactPerson1Number}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPerson1Number: e.target.value }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                maxLength={10}
                required
              />
            </div>

            {/* Contact Person 2 - Name & Number in parallel */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Contact Person-2 Name</label>
              <input
                type="text"
                value={formData.contactPerson2Name}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPerson2Name: e.target.value }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Contact Person-2 Number</label>
              <input
                type="tel"
                value={formData.contactPerson2Number}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPerson2Number: e.target.value }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                maxLength={10}
              />
            </div>

            {/* Account Contact - Name & Number in parallel */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Account Contact Name</label>
              <input
                type="text"
                value={formData.accountContactName}
                onChange={(e) => setFormData(prev => ({ ...prev, accountContactName: e.target.value }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Account Contact Number</label>
              <input
                type="tel"
                value={formData.accountContactNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, accountContactNumber: e.target.value }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                maxLength={10}
              />
            </div>

            {/* WhatsApp Number - full row */}
            <div className="md:col-span-2">
              <label className="block text-xs sm:text-sm font-medium mb-1">💬 WhatsApp Number <span className="text-gray-400 font-normal">(optional — defaults to Contact-1 number)</span></label>
              <input
                type="tel"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 text-sm"
                maxLength={10}
                placeholder="Leave blank to use Contact-1 number"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs sm:text-sm font-medium mb-1">Address *</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                rows="2"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Landmark</label>
              <input
                type="text"
                value={formData.landmark}
                onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1">Pincode *</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                maxLength={6}
                required
              />
            </div>
          </div>

          {/* City and Area Selector */}
          <div className="border-t pt-4">
            <CityAreaSelector
              selectedCity={selectedCity}
              selectedArea={selectedArea}
              onCityChange={handleCityChange}
              onAreaChange={handleAreaChange}
              required={true}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium text-sm"
            >
              {isSubmitting ? 'Adding...' : 'Add Entry'}
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
      </div>
    </div>
  );
};

export default AddSalesEntryForm;
