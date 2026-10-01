import React, { useState, useRef } from 'react';
import useSalesStore from '../store/salesStore';
import useClickOutside from '../hooks/useClickOutside';
import CityAreaSelector from './CityAreaSelector';
import SalesEntrySelectionModal from './SalesEntrySelectionModal';
import { downloadSalesEntryTemplate, parseSalesEntryExcel, ensureCityAndArea } from '../utils/salesExcelUtil';
import toast from 'react-hot-toast';

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
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importedList, setImportedList] = useState([]);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const fileInputRef = useRef(null);
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
  const modalRef = useClickOutside(() => {
    if (!showSelectionModal && !isAddingBatch) {
      onClose();
    }
  });

  const handleCityChange = (city) => {
    setSelectedCity(city);
    setFormData(prev => ({ ...prev, city: city ? city.name : '' }));
  };

  const handleAreaChange = (area) => {
    setSelectedArea(area);
    setFormData(prev => ({ ...prev, area: area ? area.name : '' }));
  };

  const applyAutofillEntry = async (entry) => {
    const rawCity = entry.city || '';
    const rawArea = entry.area || '';

    setFormData(prev => ({
      ...prev,
      firmName: entry.firmName || prev.firmName,
      gstNo: entry.gstNo || prev.gstNo,
      contactPerson1Name: entry.contactPerson1Name || prev.contactPerson1Name,
      contactPerson1Number: entry.contactPerson1Number || prev.contactPerson1Number,
      contactPerson2Name: entry.contactPerson2Name || '',
      contactPerson2Number: entry.contactPerson2Number || '',
      accountContactName: entry.accountContactName || '',
      accountContactNumber: entry.accountContactNumber || '',
      whatsappNumber: entry.whatsappNumber || '',
      email: entry.email || '',
      address: entry.address || prev.address,
      landmark: entry.landmark || '',
      city: rawCity,
      area: rawArea,
      pincode: entry.pincode || prev.pincode
    }));

    if (rawCity || rawArea) {
      try {
        const { city: matchedCity, area: matchedArea } = await ensureCityAndArea(rawCity, rawArea);
        if (matchedCity) {
          setSelectedCity(matchedCity);
          setFormData(prev => ({ ...prev, city: matchedCity.name }));
        }
        if (matchedArea) {
          setSelectedArea(matchedArea);
          setFormData(prev => ({ ...prev, area: matchedArea.name }));
        }
      } catch (err) {
        console.error('Failed to auto-select city/area:', err);
      }
    }

    if (entry.email) {
      setEmailError(validateEmail(entry.email));
    } else {
      setEmailError('');
    }

    setShowSelectionModal(false);
  };

  const handleDownloadTemplate = async () => {
    try {
      toast.loading('Generating Excel template...', { id: 'template-download' });
      await downloadSalesEntryTemplate();
      toast.success('Template downloaded!', { id: 'template-download' });
    } catch (error) {
      console.error('Download template error:', error);
      toast.error('Failed to download template', { id: 'template-download' });
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const toastId = toast.loading('Reading & validating Excel file...');
    try {
      const parsed = await parseSalesEntryExcel(file);
      if (!parsed || parsed.length === 0) {
        toast.error('No valid sales entry data rows found in the Excel file.', { id: toastId });
        return;
      }

      if (parsed.length === 1 && parsed[0].validation?.isValid) {
        await applyAutofillEntry(parsed[0]);
        toast.success(`Autofilled: "${parsed[0].firmName || 'Entry'}"`, { id: toastId });
      } else {
        setImportedList(parsed);
        setShowSelectionModal(true);
        const validCount = parsed.filter(p => p.validation?.isValid).length;
        const errCount = parsed.length - validCount;
        if (errCount > 0) {
          toast.error(`Found ${errCount} entry with errors (highlighted in red).`, { id: toastId });
        } else {
          toast.success(`Loaded ${parsed.length} entries. Select one or batch add!`, { id: toastId });
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to read Excel file', { id: toastId });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBatchAdd = async (selectedList) => {
    if (!selectedList || selectedList.length === 0) return;
    setIsAddingBatch(true);
    const toastId = toast.loading(`Adding 0 of ${selectedList.length} entries...`);
    let addedCount = 0;

    for (let i = 0; i < selectedList.length; i++) {
      const item = selectedList[i];
      toast.loading(`Adding ${i + 1} of ${selectedList.length}: ${item.firmName}...`, { id: toastId });
      try {
        if (item.city || item.area) {
          await ensureCityAndArea(item.city, item.area);
        }

        await addEntry({
          firmName: item.firmName,
          gstNo: item.gstNo,
          contactPerson1Name: item.contactPerson1Name,
          contactPerson1Number: item.contactPerson1Number,
          contactPerson2Name: item.contactPerson2Name || '',
          contactPerson2Number: item.contactPerson2Number || '',
          accountContactName: item.accountContactName || '',
          accountContactNumber: item.accountContactNumber || '',
          whatsappNumber: item.whatsappNumber || '',
          email: item.email || '',
          address: item.address,
          landmark: item.landmark || '',
          city: item.city || '',
          area: item.area,
          pincode: item.pincode
        });
        addedCount++;
      } catch (err) {
        console.error(`Failed to add entry ${item.firmName}:`, err);
      }
    }

    setIsAddingBatch(false);
    if (addedCount > 0) {
      toast.success(`Successfully added ${addedCount} entries to Sales!`, { id: toastId });
      setShowSelectionModal(false);
      onClose();
    } else {
      toast.error(`Failed to add selected entries.`, { id: toastId });
    }
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
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
        <div ref={modalRef} className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-[#E0E2E5]">
          <div className="flex justify-between items-center pb-3 mb-4 border-b border-[#E0E2E5]">
            <div>
              <span className="inline-block text-[#FF2E46] text-xs font-bold uppercase tracking-widest bg-[#FFE8EB] px-2.5 py-0.5 rounded-md mb-1 border border-[#FF2E46]/20">
                CLIENT ACQUISITION
              </span>
              <h2 className="text-base font-bold text-[#2C2C2C]">Add New Sales Entry</h2>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-[#F0F2F5] hover:bg-[#FFE8EB] hover:text-[#FF2E46] text-[#666666] flex items-center justify-center transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Excel Banner */}
          <div className="bg-[#F8F9FA] border border-[#E0E2E5] rounded-lg p-3.5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FFE8EB] text-[#FF2E46] flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-[#2C2C2C]">Auto-fill from Excel</p>
                <p className="text-[11px] text-[#666666]">Upload bulk spreadsheets to quickly populate form data</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                disabled={isImporting}
                className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-[#E0E2E5] hover:bg-[#F0F2F5] text-[#2C2C2C] text-xs font-semibold rounded-lg transition-colors"
              >
                Template
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex-1 sm:flex-none px-3.5 py-1.5 bg-[#2C2C2C] hover:bg-[#1A1A1A] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                {isImporting ? 'Reading...' : 'Import File'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Firm Name <span className="text-[#FF2E46]">*</span></label>
                <input
                  type="text"
                  value={formData.firmName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firmName: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">GST Number <span className="text-[#FF2E46]">*</span></label>
                <input
                  type="text"
                  value={formData.gstNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, gstNo: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all uppercase font-mono"
                  maxLength={15}
                  placeholder="22AAAAA0000A1Z5"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Email</label>
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => { setFormData(prev => ({ ...prev, email: e.target.value })); if (emailError) setEmailError(''); }}
                  onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                  className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-[#2C2C2C] focus:outline-none transition-all ${
                    emailError ? 'border-[#FF2E46] ring-1 ring-[#FF2E46]' : 'border-[#E0E2E5] focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20'
                  }`}
                />
                {emailError && <p className="text-[#FF2E46] text-xs mt-1">{emailError}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Contact Person-1 Name <span className="text-[#FF2E46]">*</span></label>
                <input
                  type="text"
                  value={formData.contactPerson1Name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson1Name: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Contact Person-1 Number <span className="text-[#FF2E46]">*</span></label>
                <input
                  type="tel"
                  value={formData.contactPerson1Number}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson1Number: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  maxLength={10}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Contact Person-2 Name</label>
                <input
                  type="text"
                  value={formData.contactPerson2Name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson2Name: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Contact Person-2 Number</label>
                <input
                  type="tel"
                  value={formData.contactPerson2Number}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson2Number: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Account Contact Name</label>
                <input
                  type="text"
                  value={formData.accountContactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountContactName: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Account Contact Number</label>
                <input
                  type="tel"
                  value={formData.accountContactNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountContactNumber: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  maxLength={10}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">WhatsApp Number <span className="text-[#666666] font-normal">(defaults to Contact-1)</span></label>
                <input
                  type="tel"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  maxLength={10}
                  placeholder="Leave blank to use Contact-1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Address <span className="text-[#FF2E46]">*</span></label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  rows="2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Landmark</label>
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Pincode <span className="text-[#FF2E46]">*</span></label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  maxLength={6}
                  required
                />
              </div>
            </div>

            {/* City & Area Selector */}
            <div className="border-t border-[#E0E2E5] pt-3">
              <CityAreaSelector
                selectedCity={selectedCity}
                selectedArea={selectedArea}
                onCityChange={handleCityChange}
                onAreaChange={handleAreaChange}
                required={true}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-2 pt-3 border-t border-[#E0E2E5]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#FF2E46] hover:bg-[#E02038] text-white py-2 rounded-lg font-semibold text-xs uppercase tracking-wider shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Entry...' : 'Save Sales Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showSelectionModal && importedList.length > 0 && (
        <SalesEntrySelectionModal
          entries={importedList}
          isAddingBatch={isAddingBatch}
          onSelectOne={(entry) => {
            applyAutofillEntry(entry);
            toast.success(`Autofilled details for "${entry.firmName || 'Selected Entry'}"`);
          }}
          onBatchAdd={handleBatchAdd}
          onClose={() => !isAddingBatch && setShowSelectionModal(false)}
        />
      )}
    </>
  );
};

export default AddSalesEntryForm;
