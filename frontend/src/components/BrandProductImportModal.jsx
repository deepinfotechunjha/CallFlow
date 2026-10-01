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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div ref={modalRef} className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl border border-[#E0E2E5] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E2E5] bg-[#F8F9FA]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF2E46]"></span>
              <h2 className="text-base font-bold text-[#2C2C2C]">Import Catalog Products</h2>
            </div>
            <p className="text-xs text-[#666666] mt-0.5">Target Brand: <span className="font-bold text-[#FF2E46]">{brand.name}</span></p>
          </div>
          <button 
            onClick={onClose} 
            className="w-7 h-7 rounded-lg bg-white text-[#666666] hover:text-[#FF2E46] hover:bg-[#FFE8EB] flex items-center justify-center transition-colors border border-[#E0E2E5]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* File upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1">
              Upload Excel / CSV file <span className="text-[#FF2E46]">*</span>
            </label>
            <p className="text-xs text-[#666666] mb-2.5">
              File must have header columns: <code className="bg-[#F0F2F5] text-[#2C2C2C] px-1.5 py-0.5 rounded text-[11px] font-mono font-bold">code</code> and <code className="bg-[#F0F2F5] text-[#2C2C2C] px-1.5 py-0.5 rounded text-[11px] font-mono font-bold">configuration</code>.
            </p>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#E0E2E5] rounded-xl p-6 text-center cursor-pointer hover:border-[#FF2E46] hover:bg-[#FFE8EB]/10 transition-all"
            >
              <div className="w-10 h-10 bg-[#F0F2F5] rounded-lg flex items-center justify-center mx-auto mb-2 text-[#2C2C2C]">
                <svg className="w-5 h-5 text-[#2C2C2C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-[#2C2C2C]">
                {fileName ? <span className="font-bold text-[#FF2E46]">{fileName}</span> : 'Click or drop .xlsx / .csv file here'}
              </p>
              <p className="text-[11px] text-[#666666] mt-0.5">Spreadsheet will be processed securely</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFile}
                className="hidden"
              />
            </div>
            {parseError && (
              <p className="text-xs text-[#FF2E46] mt-2 bg-[#FFE8EB] border border-[#FF2E46]/30 rounded-lg p-2.5 font-semibold">{parseError}</p>
            )}
          </div>

          {/* Preview */}
          {parsedProducts && (
            <>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-emerald-800">{parsedProducts.length} products parsed and ready for import</p>
              </div>

              {/* Mode selection */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-2">
                  Import Action for <span className="text-[#FF2E46]">{brand.name}</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMode('replace')}
                    className={`p-3.5 rounded-lg border text-left transition-all ${mode === 'replace' ? 'border-[#FF2E46] bg-[#FFE8EB]/20 shadow-xs' : 'border-[#E0E2E5] hover:border-gray-300 bg-white'}`}
                  >
                    <p className="font-bold text-xs text-[#2C2C2C]">Full Replace</p>
                    <p className="text-[11px] text-[#666666] mt-0.5">Overwrites and deletes existing products for this brand with the new list.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('merge')}
                    className={`p-3.5 rounded-lg border text-left transition-all ${mode === 'merge' ? 'border-[#2C2C2C] bg-[#F0F2F5] shadow-xs' : 'border-[#E0E2E5] hover:border-gray-300 bg-white'}`}
                  >
                    <p className="font-bold text-xs text-[#2C2C2C]">Append / Merge</p>
                    <p className="text-[11px] text-[#666666] mt-0.5">Keeps existing products and adds only unique new codes without duplicates.</p>
                  </button>
                </div>
              </div>

              {/* Preview table */}
              <div>
                <p className="text-[11px] font-bold text-[#666666] uppercase tracking-wider mb-1.5">Preview (first 10 items)</p>
                <div className="overflow-x-auto border border-[#E0E2E5] rounded-lg">
                  <table className="min-w-full text-xs">
                    <thead className="bg-[#2C2C2C] text-white">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold uppercase tracking-wider text-[10px] w-12 border-r border-[#3D3D3D]">#</th>
                        <th className="px-3 py-2 text-left font-bold uppercase tracking-wider text-[10px] border-r border-[#3D3D3D]">Code</th>
                        <th className="px-3 py-2 text-left font-bold uppercase tracking-wider text-[10px]">Configuration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E0E2E5] bg-white">
                      {parsedProducts.slice(0, 10).map((p, i) => (
                        <tr key={i} className="hover:bg-[#F8F9FA] transition-colors">
                          <td className="px-3 py-2 text-[#666666] font-mono">{i + 1}</td>
                          <td className="px-3 py-2 font-semibold text-[#2C2C2C]">{p.code}</td>
                          <td className="px-3 py-2 text-[#666666]">{p.configuration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedProducts.length > 10 && (
                    <p className="text-xs text-[#666666] text-center py-1.5 bg-[#F8F9FA] font-medium border-t border-[#E0E2E5]">... and {parsedProducts.length - 10} more rows</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-[#E0E2E5] bg-[#F8F9FA] flex gap-2.5">
          <button
            onClick={onClose}
            disabled={isImporting}
            className="flex-1 py-2 px-3 bg-white border border-[#E0E2E5] text-[#2C2C2C] rounded-lg hover:bg-[#F0F2F5] text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!parsedProducts || !mode || isImporting}
            className="flex-1 py-2 px-3 bg-[#FF2E46] text-white rounded-lg hover:bg-[#E02038] disabled:opacity-50 text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
          >
            {isImporting ? 'Importing...' : `Import ${parsedProducts ? parsedProducts.length : ''} Products`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandProductImportModal;
