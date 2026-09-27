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

      // If exactly 1 entry and it is valid, autofill directly
      if (parsed.length === 1 && parsed[0].validation?.isValid) {
        await applyAutofillEntry(parsed[0]);
        toast.success(`Autofilled: "${parsed[0].firmName || 'Entry'}"`, { id: toastId });
      } else {
        // Multiple entries or single entry with errors -> open preview list
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div ref={modalRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Add New Sales Entry</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl font-medium">✕</button>
          </div>

          {/* Excel Autofill Banner */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200/80 rounded-lg p-3 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <div>
                <p className="text-xs font-semibold text-gray-800">Auto-fill from Excel</p>
                <p className="text-[11px] text-gray-500">Upload a spreadsheet to fill these form fields instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                disabled={isImporting}
                className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-md shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                title="Download sample Excel template"
              >
                <span>📥</span>
                <span>Download Template</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex-1 sm:flex-none px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-md shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>📂</span>
                <span>{isImporting ? 'Reading...' : 'Import Excel'}</span>
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

    {/* Selection modal when Excel file is imported */}
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
