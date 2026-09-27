import ExcelJS from 'exceljs';
import apiClient from '../api/apiClient';

/**
 * Normalizes header string to find matching field
 */
const normalizeHeader = (header) => {
  if (!header) return '';
  return String(header).toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Extract clean string value from Excel cell
 */
const getCellValue = (cell) => {
  if (cell === null || cell === undefined) return '';
  if (typeof cell === 'object') {
    // Handle rich text, hyperlink, formula results
    if (cell.text !== undefined) return String(cell.text).trim();
    if (cell.result !== undefined) return String(cell.result).trim();
    if (cell.hyperlink !== undefined) return String(cell.text || cell.hyperlink).trim();
    if (cell.value !== undefined) return String(cell.value).trim();
    return String(cell).trim();
  }
  if (typeof cell === 'number') {
    return cell.toLocaleString('fullwide', { useGrouping: false });
  }
  return String(cell).trim();
};

/**
 * Match normalized column header to form field key
 */
const matchHeaderField = (normalized) => {
  if (!normalized) return null;

  // WhatsApp
  if (/whatsapp|whats|wa\b|wapp/i.test(normalized)) {
    return 'whatsappNumber';
  }

  // Account contact
  if (/account/i.test(normalized)) {
    if (/num|phone|mob|tel|contactnum|digit/i.test(normalized)) return 'accountContactNumber';
    if (/name|person|contact/i.test(normalized)) return 'accountContactName';
    return 'accountContactName';
  }

  // Contact Person 2
  if (/2|two|secondary|second/i.test(normalized)) {
    if (/num|phone|mob|tel|digit/i.test(normalized)) return 'contactPerson2Number';
    if (/name|person/i.test(normalized)) return 'contactPerson2Name';
    return 'contactPerson2Number';
  }

  // Contact Person 1 (with 1 / one / primary / first)
  if (/1|one|primary|first/i.test(normalized)) {
    if (/num|phone|mob|tel|digit/i.test(normalized)) return 'contactPerson1Number';
    if (/name|person/i.test(normalized)) return 'contactPerson1Name';
    return 'contactPerson1Number';
  }

  // Firm Name / Company
  if (/firm|company|business|party|client/i.test(normalized)) {
    return 'firmName';
  }

  // GST
  if (/gst/i.test(normalized)) {
    return 'gstNo';
  }

  // Pincode / Zip
  if (/pin|pincode|postal|zip/i.test(normalized)) {
    return 'pincode';
  }

  // Email
  if (/email|mail/i.test(normalized)) {
    return 'email';
  }

  // Landmark
  if (/landmark/i.test(normalized)) {
    return 'landmark';
  }

  // City (City, Town, District)
  if (/city|district|town/i.test(normalized)) {
    return 'city';
  }

  // Area (Area, Locality, Zone, Taluka, Suburb)
  if (/area|locality|zone|taluka|suburb/i.test(normalized)) {
    return 'area';
  }

  // Address
  if (/address|addr|street/i.test(normalized)) {
    return 'address';
  }

  // Fallbacks for general Phone / Name
  if (/phone|mobile|cell|contactnum|mob/i.test(normalized)) {
    return 'contactPerson1Number';
  }

  if (/contactperson|contactname|contact|person|name/i.test(normalized)) {
    return 'contactPerson1Name';
  }

  return null;
};

/**
 * Ensures that City and Area exist in database (auto-creates them if missing)
 * and returns the matched city and area records.
 */
export const ensureCityAndArea = async (cityName, areaName) => {
  const result = { city: null, area: null };
  if (!cityName && !areaName) return result;

  const capitalize = (s) => (s ? s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase() : '');

  try {
    const citiesRes = await apiClient.get('/cities');
    const cities = Array.isArray(citiesRes.data) ? citiesRes.data : [];

    let cityObj = null;
    const cleanCity = cityName ? cityName.trim() : '';

    if (cleanCity) {
      cityObj = cities.find(c => c.name && c.name.trim().toLowerCase() === cleanCity.toLowerCase());
      if (!cityObj) {
        try {
          const createCityRes = await apiClient.post('/cities', { name: capitalize(cleanCity) });
          cityObj = createCityRes.data;
        } catch (err) {
          console.warn('Could not auto-create city:', err);
        }
      }
    }

    result.city = cityObj;

    const cleanArea = areaName ? areaName.trim() : '';
    if (cityObj && cleanArea) {
      const areasRes = await apiClient.get(`/areas?cityId=${cityObj.id}`);
      const areas = Array.isArray(areasRes.data) ? areasRes.data : [];
      let areaObj = areas.find(a => a.name && a.name.trim().toLowerCase() === cleanArea.toLowerCase());
      if (!areaObj) {
        try {
          const createAreaRes = await apiClient.post('/areas', { name: capitalize(cleanArea), cityId: cityObj.id });
          areaObj = createAreaRes.data;
        } catch (err) {
          console.warn('Could not auto-create area:', err);
        }
      }
      result.area = areaObj;
    }

    return result;
  } catch (error) {
    console.error('Error ensuring city and area:', error);
    return result;
  }
};

/**
 * Downloads a sample Excel template for Sales Entries
 */
export const downloadSalesEntryTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sales Entry Template');

  worksheet.columns = [
    { header: 'Firm Name *', key: 'firmName', width: 28 },
    { header: 'GST Number *', key: 'gstNo', width: 20 },
    { header: 'Contact Person 1 Name *', key: 'contactPerson1Name', width: 24 },
    { header: 'Contact Person 1 Number *', key: 'contactPerson1Number', width: 24 },
    { header: 'Contact Person 2 Name', key: 'contactPerson2Name', width: 24 },
    { header: 'Contact Person 2 Number', key: 'contactPerson2Number', width: 24 },
    { header: 'Account Contact Name', key: 'accountContactName', width: 24 },
    { header: 'Account Contact Number', key: 'accountContactNumber', width: 24 },
    { header: 'WhatsApp Number', key: 'whatsappNumber', width: 20 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Address *', key: 'address', width: 35 },
    { header: 'Landmark', key: 'landmark', width: 22 },
    { header: 'City *', key: 'city', width: 20 },
    { header: 'Area *', key: 'area', width: 20 },
    { header: 'Pincode *', key: 'pincode', width: 14 }
  ];

  // Style header row (empty template with only headers)
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' } // Tailwind Blue-600
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Sales_Entry_Template.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Parses an uploaded Excel file and returns an array of sales entry objects
 */
export const parseSalesEntryExcel = async (file) => {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount < 2) {
    throw new Error('The selected Excel file is empty or does not have data rows.');
  }

  // Find header row (check row 1)
  const headerRow = worksheet.getRow(1);
  const colMapping = {};

  headerRow.eachCell((cell, colNumber) => {
    const rawHeader = getCellValue(cell);
    const normalized = normalizeHeader(rawHeader);
    const fieldKey = matchHeaderField(normalized);

    if (fieldKey && !colMapping[fieldKey]) {
      colMapping[fieldKey] = colNumber;
    }
  });

  const entries = [];

  for (let r = 2; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    
    // Check if row has any content
    let hasContent = false;
    row.eachCell((cell) => {
      if (getCellValue(cell)) hasContent = true;
    });

    if (!hasContent) continue;

    const getVal = (field) => {
      const colNum = colMapping[field];
      if (!colNum) return '';
      return getCellValue(row.getCell(colNum));
    };

    const cleanPhone = (val) => {
      if (!val) return '';
      const str = String(val).trim();
      const digits = str.replace(/\D/g, '');
      // Strip country code 91 if 12 digits
      if (digits.length === 12 && digits.startsWith('91')) {
        return digits.slice(2);
      }
      // Strip leading 0 if 11 digits
      if (digits.length === 11 && digits.startsWith('0')) {
        return digits.slice(1);
      }
      return digits.slice(0, 10);
    };

    const cleanPincode = (val) => {
      if (!val) return '';
      return String(val).replace(/\D/g, '').slice(0, 6);
    };

    const firmName = getVal('firmName');
    const contactPerson1Name = getVal('contactPerson1Name');
    const contactPerson1Number = cleanPhone(getVal('contactPerson1Number'));

    // Only skip if all major identifiers are empty
    if (!firmName && !contactPerson1Name && !contactPerson1Number) {
      continue;
    }

    const entry = {
      rowIndex: r,
      firmName: firmName || '',
      gstNo: (getVal('gstNo') || '').toUpperCase().trim(),
      contactPerson1Name: contactPerson1Name || '',
      contactPerson1Number: contactPerson1Number || '',
      contactPerson2Name: getVal('contactPerson2Name') || '',
      contactPerson2Number: cleanPhone(getVal('contactPerson2Number')),
      accountContactName: getVal('accountContactName') || '',
      accountContactNumber: cleanPhone(getVal('accountContactNumber')),
      whatsappNumber: cleanPhone(getVal('whatsappNumber')),
      email: (getVal('email') || '').toLowerCase().trim(),
      address: getVal('address') || '',
      landmark: getVal('landmark') || '',
      city: getVal('city') || '',
      area: getVal('area') || '',
      pincode: cleanPincode(getVal('pincode'))
    };

    entry.validation = validateSalesEntry(entry);

    entries.push(entry);
  }

  return entries;
};

/**
 * Validates sales entry based on form requirements
 */
export const validateSalesEntry = (entry) => {
  const errors = [];

  // Firm Name (required)
  if (!entry.firmName || !entry.firmName.trim()) {
    errors.push('Firm Name is required');
  }

  // GST Number (required, 15 chars)
  if (!entry.gstNo || !entry.gstNo.trim()) {
    errors.push('GST Number is required');
  } else if (entry.gstNo.trim().length !== 15) {
    errors.push('GST Number must be exactly 15 characters');
  }

  // Contact Person 1 Name (required)
  if (!entry.contactPerson1Name || !entry.contactPerson1Name.trim()) {
    errors.push('Contact Person-1 Name is required');
  }

  // Contact Person 1 Number (required, 10 digits)
  if (!entry.contactPerson1Number || !entry.contactPerson1Number.trim()) {
    errors.push('Contact Person-1 Number is required');
  } else if (!/^\d{10}$/.test(entry.contactPerson1Number.trim())) {
    errors.push('Contact Person-1 Number must be 10 digits');
  }

  // Contact Person 2 Number (optional, 10 digits if provided)
  if (entry.contactPerson2Number && entry.contactPerson2Number.trim()) {
    if (!/^\d{10}$/.test(entry.contactPerson2Number.trim())) {
      errors.push('Contact Person-2 Number must be 10 digits');
    }
  }

  // Account Contact Number (optional, 10 digits if provided)
  if (entry.accountContactNumber && entry.accountContactNumber.trim()) {
    if (!/^\d{10}$/.test(entry.accountContactNumber.trim())) {
      errors.push('Account Contact Number must be 10 digits');
    }
  }

  // WhatsApp Number (optional, 10 digits if provided)
  if (entry.whatsappNumber && entry.whatsappNumber.trim()) {
    if (!/^\d{10}$/.test(entry.whatsappNumber.trim())) {
      errors.push('WhatsApp Number must be 10 digits');
    }
  }

  // Address (required)
  if (!entry.address || !entry.address.trim()) {
    errors.push('Address is required');
  }

  // Area (required)
  if (!entry.area || !entry.area.trim()) {
    errors.push('Area is required');
  }

  // Pincode (required, 6 digits)
  if (!entry.pincode || !entry.pincode.trim()) {
    errors.push('Pincode is required');
  } else if (!/^\d{6}$/.test(entry.pincode.trim())) {
    errors.push('Pincode must be 6 digits');
  }

  // Email (optional, lowercase & valid format)
  if (entry.email && entry.email.trim()) {
    const val = entry.email.trim();
    if (/[A-Z]/.test(val)) {
      errors.push('Email must be in lowercase');
    } else if (val.includes(' ')) {
      errors.push('Email must not contain spaces');
    } else if (!val.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      errors.push('Invalid email format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
