import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import useBrandStore from '../store/brandStore';
import useClickOutside from '../hooks/useClickOutside';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

// Unique key for new rows not yet saved
let _rowKey = 0;
const newKey = () => `new_${++_rowKey}`;

const BrandProductImportModal = ({ brand, onClose }) => {
  const [tab, setTab] = useState('manage'); // 'manage' | 'import'

  // --- Manage tab state ---
  const [rows, setRows] = useState([]); // { _key, code, configuration, _deleted, _dirty, _isNew }
  const [loadingRows, setLoadingRows] = useState(true);
  const [originalRows, setOriginalRows] = useState([]);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretPassword, setSecretPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [secretError, setSecretError] = useState('');
  const secretInputRef = useRef(null);

  // --- Import tab state ---
  const [parsedProducts, setParsedProducts] = useState(null);
  const [parseError, setParseError] = useState('');
  const [mode, setMode] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const { importBrandProducts, fetchBrandProducts } = useBrandStore();
  const modalRef = useClickOutside(onClose);

  // --- Load existing products on mount ---
  useEffect(() => {
    setLoadingRows(true);
    fetchBrandProducts(brand.name).then(products => {
      const mapped = products.map(p => ({ _key: p.id, code: p.code, configuration: p.configuration, _deleted: false, _dirty: false, _isNew: false }));
      setRows(mapped);
      setOriginalRows(mapped);
      setLoadingRows(false);
    });
  }, [brand.name]);

  const isDirty = rows.some(r => r._dirty || r._deleted || r._isNew);

  const updateRow = (key, field, value) => {
    setRows(prev => prev.map(r => r._key === key ? { ...r, [field]: value, _dirty: true } : r));
  };

  const deleteRow = (key) => {
    setRows(prev => prev.map(r => r._key === key ? { ...r, _deleted: true } : r));
  };

  const restoreRow = (key) => {
    setRows(prev => prev.map(r => r._key === key ? { ...r, _deleted: false, _dirty: false } : r));
  };

  const addRow = () => {
    setRows(prev => [...prev, { _key: newKey(), code: '', configuration: '', _deleted: false, _dirty: true, _isNew: true }]);
  };

  const removeNewRow = (key) => {
    setRows(prev => prev.filter(r => r._key !== key));
  };

  const exportExcel = () => {
    const active = rows.filter(r => !r._deleted);
    if (active.length === 0) { toast.error('No products to export'); return; }
    const wsData = [['code', 'configuration'], ...active.map(r => [r.code, r.configuration])];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, `${brand.name}_products.xlsx`);
  };

  const handleSaveClick = () => {
    const active = rows.filter(r => !r._deleted);
    const hasEmpty = active.some(r => !r.code.trim() || !r.configuration.trim());
    if (hasEmpty) { toast.error('All rows must have both code and configuration filled'); return; }
    const codes = active.map(r => r.code.trim().toLowerCase());
    const hasDupe = codes.length !== new Set(codes).size;
    if (hasDupe) { toast.error('Duplicate product codes found — each code must be unique'); return; }
    setSecretPassword('');
    setSecretError('');
    setShowSecretModal(true);
    setTimeout(() => secretInputRef.current?.focus(), 100);
  };

  const handleConfirmSave = async () => {
    if (!secretPassword.trim() || isSaving) return;
    setIsSaving(true);
    setSecretError('');
    try {
      // Verify secret first
      const verifyRes = await apiClient.post('/auth/verify-secret', { secretPassword });
      if (!verifyRes.data?.success) throw new Error('invalid');
      // Build final list — only active, non-deleted rows
      const finalList = rows
        .filter(r => !r._deleted)
        .map(r => ({ code: r.code.trim(), configuration: r.configuration.trim() }));
      await importBrandProducts(brand.name, finalList, 'replace');
      setShowSecretModal(false);
      setSecretPassword('');
      // Refresh rows to reflect saved state
      const fresh = await fetchBrandProducts(brand.name);
      const mapped = fresh.map(p => ({ _key: p.id, code: p.code, configuration: p.configuration, _deleted: false, _dirty: false, _isNew: false }));
      setRows(mapped);
      setOriginalRows(mapped);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || '';
      if (msg.toLowerCase().includes('invalid secret') || msg === 'invalid') {
        setSecretError('Invalid secret password. Please try again.');
      } else {
        setSecretError('Failed to save. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = () => {
    setRows(originalRows.map(r => ({ ...r, _deleted: false, _dirty: false })));
  };

  // --- Import tab handlers (unchanged logic) ---
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
        if (rows.length < 2) { setParseError('File is empty or has no data rows.'); return; }
        const header = rows[0].map(h => String(h).trim().toLowerCase());
        const codeIdx = header.findIndex(h => h === 'code');
        const configIdx = header.findIndex(h => h === 'configuration');
        if (codeIdx === -1 || configIdx === -1) { setParseError('File must have columns named "code" and "configuration" in the first row.'); return; }
        const products = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const code = String(row[codeIdx] || '').trim();
          const configuration = String(row[configIdx] || '').trim();
          if (code && configuration) products.push({ code, configuration });
        }
        if (products.length === 0) { setParseError('No valid rows found. Ensure code and configuration columns have data.'); return; }
        setParsedProducts(products);
      } catch { setParseError('Failed to parse file. Please upload a valid .xlsx or .csv file.'); }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (!parsedProducts || !mode || isImporting) return;
    setIsImporting(true);
    try {
      await importBrandProducts(brand.name, parsedProducts, mode);
      const fresh = await fetchBrandProducts(brand.name);
      const mapped = fresh.map(p => ({ _key: p.id, code: p.code, configuration: p.configuration, _deleted: false, _dirty: false, _isNew: false }));
      setRows(mapped);
      setOriginalRows(mapped);
      onClose();
    } catch { setIsImporting(false); }
  };

  return (
<<<<<<< HEAD
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
=======
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div ref={modalRef} className="bg-white rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-xl border border-[#E0E2E5] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E2E5] bg-[#F8F9FA] flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF2E46]"></span>
              <h2 className="text-base font-bold text-[#2C2C2C]">Product Catalog</h2>
              <span className="text-xs font-bold text-[#FF2E46] bg-[#FFE8EB] px-2 py-0.5 rounded-md border border-[#FF2E46]/20">{brand.name}</span>
            </div>
            <p className="text-[11px] text-[#666666] mt-0.5">Manage, edit and import product catalog for this brand</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white text-[#666666] hover:text-[#FF2E46] hover:bg-[#FFE8EB] flex items-center justify-center transition-colors border border-[#E0E2E5]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E0E2E5] bg-white flex-shrink-0">
          {[{ key: 'manage', label: 'Manage Catalog' }, { key: 'import', label: 'Import Excel' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                tab === t.key ? 'border-[#FF2E46] text-[#FF2E46]' : 'border-transparent text-[#666666] hover:text-[#2C2C2C]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── MANAGE TAB ── */}
        {tab === 'manage' && (
          <>
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#E0E2E5] bg-[#F8F9FA] flex-shrink-0">
              <span className="text-xs text-[#666666]">
                {loadingRows ? 'Loading...' : `${rows.filter(r => !r._deleted).length} product${rows.filter(r => !r._deleted).length !== 1 ? 's' : ''}`}
                {isDirty && <span className="ml-2 text-amber-600 font-bold">· Unsaved changes</span>}
              </span>
              <div className="flex items-center gap-2">
                {isDirty && (
                  <button onClick={discardChanges} className="text-xs text-[#666666] hover:text-[#2C2C2C] font-semibold px-2.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors">
                    Discard
                  </button>
                )}
                <button onClick={exportExcel} disabled={loadingRows} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white border border-[#E0E2E5] text-[#2C2C2C] hover:border-[#2C2C2C] transition-colors disabled:opacity-40">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Export
                </button>
                <button onClick={addRow} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#2C2C2C] text-white hover:bg-[#1A1A1A] transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  Add Row
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {loadingRows ? (
                <div className="flex items-center justify-center py-16 gap-3">
                  <div className="animate-spin h-5 w-5 border-2 border-[#FF2E46] border-t-transparent rounded-full"></div>
                  <span className="text-sm text-[#666666]">Loading catalog...</span>
                </div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm font-semibold text-[#2C2C2C]">No products yet</p>
                  <p className="text-xs text-[#666666] mt-1">Add rows manually or import from Excel</p>
                </div>
              ) : (
                <table className="min-w-full text-xs">
                  <thead className="bg-[#2C2C2C] sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-bold text-white uppercase tracking-wider text-[10px] w-10 border-r border-[#3D3D3D]">#</th>
                      <th className="px-3 py-2.5 text-left font-bold text-white uppercase tracking-wider text-[10px] w-40 border-r border-[#3D3D3D]">Code</th>
                      <th className="px-3 py-2.5 text-left font-bold text-white uppercase tracking-wider text-[10px] border-r border-[#3D3D3D]">Configuration</th>
                      <th className="px-3 py-2.5 text-center font-bold text-white uppercase tracking-wider text-[10px] w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F2F5] bg-white">
                    {rows.map((row, idx) => (
                      <tr key={row._key} className={`transition-colors ${
                        row._deleted ? 'bg-red-50 opacity-60' :
                        row._isNew ? 'bg-emerald-50/40' :
                        row._dirty ? 'bg-amber-50/40' : 'hover:bg-[#F8F9FA]'
                      }`}>
                        <td className="px-3 py-2 text-[#999999] font-mono text-[11px]">
                          {row._deleted ? <span className="text-red-400 font-bold text-[10px]">DEL</span> : row._isNew ? <span className="text-emerald-600 font-bold text-[10px]">NEW</span> : idx + 1}
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            value={row.code}
                            onChange={e => updateRow(row._key, 'code', e.target.value)}
                            disabled={row._deleted}
                            placeholder="Product code"
                            className="w-full px-2.5 py-1.5 border border-transparent rounded-md text-xs font-semibold text-[#2C2C2C] bg-transparent focus:bg-white focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46]/20 transition-all disabled:cursor-not-allowed placeholder-[#BBBBBB]"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            value={row.configuration}
                            onChange={e => updateRow(row._key, 'configuration', e.target.value)}
                            disabled={row._deleted}
                            placeholder="Configuration details"
                            className="w-full px-2.5 py-1.5 border border-transparent rounded-md text-xs text-[#666666] bg-transparent focus:bg-white focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46]/20 transition-all disabled:cursor-not-allowed placeholder-[#BBBBBB]"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          {row._isNew ? (
                            <button onClick={() => removeNewRow(row._key)} className="text-red-500 hover:text-red-700 font-bold text-sm p-1 rounded transition-colors" title="Remove">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          ) : row._deleted ? (
                            <button onClick={() => restoreRow(row._key)} className="text-emerald-600 hover:text-emerald-800 font-bold text-[10px] px-1.5 py-0.5 rounded border border-emerald-300 bg-emerald-50 transition-colors">
                              Undo
                            </button>
                          ) : (
                            <button onClick={() => deleteRow(row._key)} className="text-[#999999] hover:text-red-600 p-1 rounded transition-colors" title="Delete">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-[#E0E2E5] bg-[#F8F9FA] flex gap-2.5 flex-shrink-0">
              <button onClick={onClose} className="flex-1 py-2 px-3 bg-white border border-[#E0E2E5] text-[#2C2C2C] rounded-lg hover:bg-[#F0F2F5] text-xs font-semibold uppercase tracking-wider transition-colors">
                Close
              </button>
              <button
                onClick={handleSaveClick}
                disabled={!isDirty || loadingRows}
                className="flex-1 py-2 px-3 bg-[#FF2E46] text-white rounded-lg hover:bg-[#E02038] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </>
        )}

        {/* ── IMPORT TAB ── */}
        {tab === 'import' && (
          <>
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-1">Upload Excel / CSV file <span className="text-[#FF2E46]">*</span></label>
                <p className="text-xs text-[#666666] mb-2.5">File must have header columns: <code className="bg-[#F0F2F5] text-[#2C2C2C] px-1.5 py-0.5 rounded text-[11px] font-mono font-bold">code</code> and <code className="bg-[#F0F2F5] text-[#2C2C2C] px-1.5 py-0.5 rounded text-[11px] font-mono font-bold">configuration</code>.</p>
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-[#E0E2E5] rounded-xl p-6 text-center cursor-pointer hover:border-[#FF2E46] hover:bg-[#FFE8EB]/10 transition-all">
                  <div className="w-10 h-10 bg-[#F0F2F5] rounded-lg flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-[#2C2C2C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <p className="text-xs font-semibold text-[#2C2C2C]">{fileName ? <span className="font-bold text-[#FF2E46]">{fileName}</span> : 'Click or drop .xlsx / .csv file here'}</p>
                  <p className="text-[11px] text-[#666666] mt-0.5">Spreadsheet will be processed securely</p>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
                </div>
                {parseError && <p className="text-xs text-[#FF2E46] mt-2 bg-[#FFE8EB] border border-[#FF2E46]/30 rounded-lg p-2.5 font-semibold">{parseError}</p>}
              </div>

              {parsedProducts && (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800">{parsedProducts.length} products parsed and ready for import</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#2C2C2C] mb-2">Import Action for <span className="text-[#FF2E46]">{brand.name}</span></p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button type="button" onClick={() => setMode('replace')} className={`p-3.5 rounded-lg border text-left transition-all ${mode === 'replace' ? 'border-[#FF2E46] bg-[#FFE8EB]/20 shadow-xs' : 'border-[#E0E2E5] hover:border-gray-300 bg-white'}`}>
                        <p className="font-bold text-xs text-[#2C2C2C]">Full Replace</p>
                        <p className="text-[11px] text-[#666666] mt-0.5">Overwrites and deletes existing products for this brand with the new list.</p>
                      </button>
                      <button type="button" onClick={() => setMode('merge')} className={`p-3.5 rounded-lg border text-left transition-all ${mode === 'merge' ? 'border-[#2C2C2C] bg-[#F0F2F5] shadow-xs' : 'border-[#E0E2E5] hover:border-gray-300 bg-white'}`}>
                        <p className="font-bold text-xs text-[#2C2C2C]">Append / Merge</p>
                        <p className="text-[11px] text-[#666666] mt-0.5">Keeps existing products and adds only unique new codes without duplicates.</p>
                      </button>
                    </div>
                  </div>
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
                      {parsedProducts.length > 10 && <p className="text-xs text-[#666666] text-center py-1.5 bg-[#F8F9FA] font-medium border-t border-[#E0E2E5]">... and {parsedProducts.length - 10} more rows</p>}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="px-5 py-3.5 border-t border-[#E0E2E5] bg-[#F8F9FA] flex gap-2.5 flex-shrink-0">
              <button onClick={onClose} disabled={isImporting} className="flex-1 py-2 px-3 bg-white border border-[#E0E2E5] text-[#2C2C2C] rounded-lg hover:bg-[#F0F2F5] text-xs font-semibold uppercase tracking-wider transition-colors">Cancel</button>
              <button onClick={handleImport} disabled={!parsedProducts || !mode || isImporting} className="flex-1 py-2 px-3 bg-[#FF2E46] text-white rounded-lg hover:bg-[#E02038] disabled:opacity-50 text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs">
                {isImporting ? 'Importing...' : `Import ${parsedProducts ? parsedProducts.length : ''} Products`}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Secret Password Modal */}
      {showSecretModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl border border-[#E0E2E5]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#2C2C2C]">Security Confirmation</h3>
                <p className="text-[11px] text-[#666666] mt-0.5">HOST secret password required to save changes</p>
              </div>
              <button onClick={() => { setShowSecretModal(false); setSecretPassword(''); setSecretError(''); }} className="w-7 h-7 rounded-lg bg-[#F0F2F5] hover:bg-[#FFE8EB] hover:text-[#FF2E46] text-[#666666] flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="mb-1">
              <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">Secret Password <span className="text-[#FF2E46]">*</span></label>
>>>>>>> 228f965 (order page ui changes+ mobile view)
              <input
                ref={secretInputRef}
                type="password"
                value={secretPassword}
                onChange={e => { setSecretPassword(e.target.value); setSecretError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleConfirmSave()}
                placeholder="Enter your secret password"
                className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
              />
            </div>
<<<<<<< HEAD
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
=======
            {secretError && <p className="text-xs text-[#FF2E46] bg-[#FFE8EB] border border-[#FF2E46]/30 rounded-lg px-3 py-2 mb-3 font-semibold">{secretError}</p>}
            <div className="flex gap-2.5 mt-4">
              <button onClick={() => { setShowSecretModal(false); setSecretPassword(''); setSecretError(''); }} disabled={isSaving} className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs font-semibold transition-colors">Cancel</button>
              <button onClick={handleConfirmSave} disabled={!secretPassword.trim() || isSaving} className="flex-1 py-2 bg-[#FF2E46] text-white rounded-lg hover:bg-[#E02038] disabled:opacity-50 text-xs font-semibold transition-colors shadow-xs">
                {isSaving ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
>>>>>>> 228f965 (order page ui changes+ mobile view)
    </div>
  );
};

export default BrandProductImportModal;
