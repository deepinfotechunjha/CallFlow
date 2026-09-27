import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import useBrandStore from '../store/brandStore';
import useClickOutside from '../hooks/useClickOutside';

const BrandProductImportModal = ({ brand, onClose }) => {
  const [parsedProducts, setParsedProducts] = useState(null);
  const [parseError, setParseError] = useState('');
  const [mode, setMode] = useState(null); // 'replace' | 'merge'
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);
  const { importBrandProducts } = useBrandStore();
  const modalRef = useClickOutside(onClose);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setParseError('');
    setParsedProducts(null);
    setMode(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (rows.length < 2) {
          setParseError('File is empty or has no data rows.');
          return;
        }

        // Detect header row — look for 'code' and 'configuration' (case-insensitive)
        const header = rows[0].map(h => String(h).trim().toLowerCase());
        const codeIdx = header.findIndex(h => h === 'code');
        const configIdx = header.findIndex(h => h === 'configuration');

        if (codeIdx === -1 || configIdx === -1) {
          setParseError('File must have columns named "code" and "configuration" in the first row.');
          return;
        }

        const products = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const code = String(row[codeIdx] || '').trim();
          const configuration = String(row[configIdx] || '').trim();
          if (code && configuration) {
            products.push({ code, configuration });
          }
        }

        if (products.length === 0) {
          setParseError('No valid rows found. Ensure code and configuration columns have data.');
          return;
        }

        setParsedProducts(products);
      } catch {
        setParseError('Failed to parse file. Please upload a valid .xlsx or .csv file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (!parsedProducts || !mode || isImporting) return;
    setIsImporting(true);
    try {
      await importBrandProducts(brand.name, parsedProducts, mode);
      onClose();
    } catch {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-800">📦 Import Products</h2>
            <p className="text-sm text-gray-500 mt-0.5">Brand: <span className="font-semibold text-blue-600">{brand.name}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Excel / CSV file <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              File must have columns: <code className="bg-gray-100 px-1 rounded">code</code> and <code className="bg-gray-100 px-1 rounded">configuration</code> in the first row.
            </p>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="text-3xl mb-2">📄</div>
              <p className="text-sm text-gray-600">
                {fileName ? <span className="font-medium text-blue-600">{fileName}</span> : 'Click to select .xlsx or .csv file'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFile}
                className="hidden"
              />
            </div>
            {parseError && (
              <p className="text-xs text-red-600 mt-2 bg-red-50 border border-red-200 rounded p-2">{parseError}</p>
            )}
          </div>

          {/* Preview */}
          {parsedProducts && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-green-700">✓ {parsedProducts.length} products parsed successfully</p>
              </div>

              {/* Mode selection */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">How should we handle existing products for <span className="font-bold">{brand.name}</span>?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('replace')}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${mode === 'replace' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <p className="font-semibold text-sm text-gray-800">🔄 Replace</p>
                    <p className="text-xs text-gray-500 mt-1">Delete all existing products for this brand and import the new sheet. Use when the sheet is a full updated list.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('merge')}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${mode === 'merge' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <p className="font-semibold text-sm text-gray-800">➕ Merge</p>
                    <p className="text-xs text-gray-500 mt-1">Keep existing products and add only new codes from this sheet. Duplicate codes are skipped automatically.</p>
                  </button>
                </div>
              </div>

              {/* Preview table */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Preview (first 10 rows)</p>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b">#</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b">Code</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b">Configuration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedProducts.slice(0, 10).map((p, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 text-gray-500 border-b border-gray-100">{i + 1}</td>
                          <td className="px-3 py-2 font-medium text-gray-800 border-b border-gray-100">{p.code}</td>
                          <td className="px-3 py-2 text-gray-700 border-b border-gray-100">{p.configuration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedProducts.length > 10 && (
                    <p className="text-xs text-gray-400 text-center py-2">... and {parsedProducts.length - 10} more rows</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-5 border-t flex gap-3">
          <button
            onClick={onClose}
            disabled={isImporting}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!parsedProducts || !mode || isImporting}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 text-sm font-medium"
          >
            {isImporting ? 'Importing...' : `Import ${parsedProducts ? parsedProducts.length : ''} Products`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandProductImportModal;
