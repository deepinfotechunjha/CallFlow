import React, { useState, useEffect } from 'react';
import useSalesStore from '../store/salesStore';
import useClickOutside from '../hooks/useClickOutside';
import CityAreaSelector from './CityAreaSelector';
import useCitiesAndAreas from '../hooks/useCitiesAndAreas';

const EditSalesEntryForm = ({ entry, onClose }) => {
  const [formData, setFormData] = useState({
    firmName: entry.firmName || '',
    gstNo: entry.gstNo || '',
    contactPerson1Name: entry.contactPerson1Name || '',
    contactPerson1Number: entry.contactPerson1Number || '',
    contactPerson2Name: entry.contactPerson2Name || '',
    contactPerson2Number: entry.contactPerson2Number || '',
    accountContactName: entry.accountContactName || '',
    accountContactNumber: entry.accountContactNumber || '',
    address: entry.address || '',
    landmark: entry.landmark || '',
    area: entry.area || '',
    city: entry.city || '',
    pincode: entry.pincode || '',
    email: entry.email || '',
    whatsappNumber: entry.whatsappNumber || ''
  });
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { updateEntry } = useSalesStore();

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
  const { cities, areas } = useCitiesAndAreas();
  const modalRef = useClickOutside(onClose);

  // Initialize selected city and area from existing data
  useEffect(() => {
    if (entry.city && cities.length > 0) {
      const city = cities.find(c => c.name === entry.city);
      if (city) {
        setSelectedCity(city);
      }
    }
  }, [entry.city, cities]);

  useEffect(() => {
    if (entry.area && areas.length > 0 && selectedCity) {
      const area = areas.find(a => a.name === entry.area && a.cityId === selectedCity.id);
      if (area) {
        setSelectedArea(area);
      }
    }
  }, [entry.area, areas, selectedCity]);

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
      await updateEntry(entry.id, formData);
      onClose();
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2C2C2C]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div ref={modalRef} className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-[#E0E2E5] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0E2E5] bg-[#F8F9FA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFE8EB] text-[#FF2E46] flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#FF2E46] tracking-wider uppercase">CLIENT DIRECTORY</span>
              <h2 className="text-base font-bold text-[#2C2C2C]">Edit Sales Entry</h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg bg-white text-gray-500 hover:text-[#2C2C2C] hover:bg-gray-100 flex items-center justify-center text-sm transition-colors border border-gray-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Firm Name <span className="text-[#FF2E46]">*</span></label>
              <input
                type="text"
                value={formData.firmName}
                onChange={(e) => setFormData(prev => ({ ...prev, firmName: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">GST Number <span className="text-[#FF2E46]">*</span></label>
              <input
                type="text"
                value={formData.gstNo}
                onChange={(e) => setFormData(prev => ({ ...prev, gstNo: e.target.value.toUpperCase() }))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all uppercase font-mono font-bold"
                maxLength={15}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Email</label>
              <input
                type="text"
                value={formData.email}
                onChange={(e) => { setFormData(prev => ({ ...prev, email: e.target.value })); if (emailError) setEmailError(''); }}
                onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all ${emailError ? 'border-red-400' : 'border-[#E0E2E5]'}`}
              />
              {emailError && <p className="text-[#FF2E46] text-xs mt-1 font-semibold">{emailError}</p>}
            </div>

            {/* Contact Person 1 - Name & Number in parallel */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Contact Person-1 Name <span className="text-[#FF2E46]">*</span></label>
              <input
                type="text"
                value={formData.contactPerson1Name}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPerson1Name: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Contact Person-1 Number <span className="text-[#FF2E46]">*</span></label>
              <input
                type="tel"
                value={formData.contactPerson1Number}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPerson1Number: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all font-mono font-medium"
                maxLength={10}
                required
              />
            </div>

            {/* Contact Person 2 - Name & Number in parallel */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Contact Person-2 Name</label>
              <input
                type="text"
                value={formData.contactPerson2Name}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPerson2Name: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Contact Person-2 Number</label>
              <input
                type="tel"
                value={formData.contactPerson2Number}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPerson2Number: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all font-mono font-medium"
                maxLength={10}
              />
            </div>

            {/* Account Contact - Name & Number in parallel */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Account Contact Name</label>
              <input
                type="text"
                value={formData.accountContactName}
                onChange={(e) => setFormData(prev => ({ ...prev, accountContactName: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Account Contact Number</label>
              <input
                type="tel"
                value={formData.accountContactNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, accountContactNumber: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all font-mono font-medium"
                maxLength={10}
              />
            </div>

            {/* WhatsApp Number - full row */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">WhatsApp Number <span className="text-gray-400 font-normal lowercase">(optional — defaults to Contact-1 number)</span></label>
              <input
                type="tel"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                maxLength={10}
                placeholder="Leave blank to use Contact-1 number"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Address <span className="text-[#FF2E46]">*</span></label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all"
                rows="2"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Landmark</label>
              <input
                type="text"
                value={formData.landmark}
                onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Pincode <span className="text-[#FF2E46]">*</span></label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:bg-white focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] transition-all font-mono font-medium"
                maxLength={6}
                required
              />
            </div>
          </div>

          {/* City and Area Selector */}
          <div className="border-t border-[#E0E2E5] pt-4">
            <CityAreaSelector
              selectedCity={selectedCity}
              selectedArea={selectedArea}
              onCityChange={handleCityChange}
              onAreaChange={handleAreaChange}
              required={true}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-[#E0E2E5]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 bg-white border border-[#E0E2E5] text-[#2C2C2C] rounded-lg hover:bg-[#F8F9FA] text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 bg-[#FF2E46] text-white rounded-lg hover:bg-[#E02038] disabled:opacity-50 text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
            >
              {isSubmitting ? 'Updating...' : 'Update Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSalesEntryForm;
