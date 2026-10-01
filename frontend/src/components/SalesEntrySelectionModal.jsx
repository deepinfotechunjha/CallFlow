import React, { useState, useMemo } from 'react';

const SalesEntrySelectionModal = ({ 
  entries, 
  onSelectOne, 
  onBatchAdd, 
  isAddingBatch = false,
  onClose 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRowIndices, setSelectedRowIndices] = useState(new Set());

  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      const q = searchTerm.toLowerCase();
      return (
        (item.firmName && item.firmName.toLowerCase().includes(q)) ||
        (item.contactPerson1Name && item.contactPerson1Name.toLowerCase().includes(q)) ||
        (item.contactPerson1Number && item.contactPerson1Number.includes(q)) ||
        (item.city && item.city.toLowerCase().includes(q)) ||
        (item.area && item.area.toLowerCase().includes(q)) ||
        (item.gstNo && item.gstNo.toLowerCase().includes(q))
      );
    });
  }, [entries, searchTerm]);

  const validEntries = useMemo(() => entries.filter(e => e.validation?.isValid), [entries]);
  const invalidEntries = useMemo(() => entries.filter(e => !e.validation?.isValid), [entries]);
  const filteredValidEntries = useMemo(() => filteredEntries.filter(e => e.validation?.isValid), [filteredEntries]);

  const isAllValidSelected = filteredValidEntries.length > 0 && 
    filteredValidEntries.every(e => selectedRowIndices.has(e.rowIndex));

  const handleToggleSelectAll = () => {
    setSelectedRowIndices(prev => {
      const next = new Set(prev);
      if (isAllValidSelected) {
        filteredValidEntries.forEach(e => next.delete(e.rowIndex));
      } else {
        filteredValidEntries.forEach(e => next.add(e.rowIndex));
      }
      return next;
    });
  };

  const handleToggleRow = (entry) => {
    if (!entry.validation?.isValid) return;
    setSelectedRowIndices(prev => {
      const next = new Set(prev);
      if (next.has(entry.rowIndex)) {
        next.delete(entry.rowIndex);
      } else {
        next.add(entry.rowIndex);
      }
      return next;
    });
  };

  const selectedEntries = useMemo(() => {
    return entries.filter(e => selectedRowIndices.has(e.rowIndex) && e.validation?.isValid);
  }, [entries, selectedRowIndices]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isAddingBatch) {
      onClose();
    }
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-[#2C2C2C]/60 backdrop-blur-xs flex items-center justify-center z-[70] p-3 sm:p-4 animate-in fade-in duration-150"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl p-5 sm:p-6 w-full max-w-4xl max-h-[90vh] flex flex-col border border-[#E0E2E5]"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-start pb-4 border-b border-[#E0E2E5]">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block text-[#FF2E46] text-[10px] font-bold uppercase tracking-wider bg-[#FFE8EB] px-2.5 py-0.5 rounded-md mb-1 border border-[#FF2E46]/20">
                BULK IMPORT PREVIEW
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-[#2C2C2C]">
                Imported Sales Entries from Spreadsheet
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
              <span className="px-2.5 py-0.5 bg-[#F0F2F5] text-[#2C2C2C] rounded-md font-semibold text-[11px]">
                Total: {entries.length}
              </span>
              <span className="px-2.5 py-0.5 bg-[#2C2C2C] text-white rounded-md font-semibold text-[11px]">
                ✓ Valid: {validEntries.length}
              </span>
              {invalidEntries.length > 0 && (
                <span className="px-2.5 py-0.5 bg-[#FFE8EB] text-[#FF2E46] border border-[#FF2E46]/30 rounded-md font-semibold text-[11px]">
                  Issues: {invalidEntries.length} (Disabled)
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={isAddingBatch}
            className="w-8 h-8 rounded-lg bg-white text-gray-500 hover:text-[#2C2C2C] hover:bg-gray-100 flex items-center justify-center text-sm transition-colors border border-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="my-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search firm name, contact, phone, city, GST..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-[#E0E2E5] rounded-lg focus:outline-none focus:border-[#FF2E46] focus:ring-1 focus:ring-[#FF2E46] text-[#2C2C2C]"
            />
            <span className="absolute left-3 top-2.5 text-[#666666] text-xs">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>

          <div className="flex items-center gap-2 bg-[#F8F9FA] border border-[#E0E2E5] px-3.5 py-2 rounded-lg text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-[#2C2C2C]">
              <input
                type="checkbox"
                checked={isAllValidSelected}
                onChange={handleToggleSelectAll}
                disabled={filteredValidEntries.length === 0 || isAddingBatch}
                className="w-4 h-4 text-[#FF2E46] rounded focus:ring-[#FF2E46]"
              />
              <span>Select All Valid ({filteredValidEntries.length})</span>
            </label>
            {selectedEntries.length > 0 && (
              <span className="bg-[#FF2E46] text-white text-[10px] px-2 py-0.5 rounded-md font-bold">
                {selectedEntries.length} selected
              </span>
            )}
          </div>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-10 text-[#666666] text-xs">
              No entries matching your filter criteria.
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isValid = entry.validation?.isValid;
              const errors = entry.validation?.errors || [];
              const isSelected = selectedRowIndices.has(entry.rowIndex);

              return (
                <div
                  key={entry.rowIndex}
                  className={`border rounded-lg p-3.5 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3 ${
                    !isValid
                      ? 'bg-[#FFE8EB]/20 border-[#FF2E46]/30'
                      : isSelected
                      ? 'bg-[#FFE8EB]/40 border-[#FF2E46] shadow-xs'
                      : 'bg-white border-[#E0E2E5] hover:border-[#FF2E46]/40'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(entry)}
                        disabled={!isValid || isAddingBatch}
                        className="w-4 h-4 rounded text-[#FF2E46] focus:ring-[#FF2E46]"
                      />
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F0F2F5] text-[#2C2C2C]">
                          Row #{entry.rowIndex}
                        </span>

                        <h4 className="font-bold text-sm text-[#2C2C2C]">
                          {entry.firmName || <span className="text-[#FF2E46]">Missing Firm Name *</span>}
                        </h4>

                        {entry.gstNo && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-[#F8F9FA] text-[#666666] border border-[#E0E2E5]">
                            GST: {entry.gstNo}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-[#666666] pt-0.5">
                        <div>
                          <span className="font-bold text-[#2C2C2C]">Contact:</span>{' '}
                          {entry.contactPerson1Name || <span className="text-[#FF2E46]">Missing *</span>}{' '}
                          ({entry.contactPerson1Number || <span className="text-[#FF2E46]">No phone</span>})
                        </div>
                        <div>
                          <span className="font-bold text-[#2C2C2C]">Location:</span>{' '}
                          {[entry.area, entry.city].filter(Boolean).join(', ')}
                        </div>
                      </div>

                      {!isValid && errors.length > 0 && (
                        <div className="mt-2 p-2 bg-[#FFE8EB] border border-[#FF2E46]/20 rounded-md text-xs text-[#FF2E46] space-y-1">
                          <p className="font-bold text-[10px] uppercase">Validation Issues ({errors.length}):</p>
                          <div className="flex flex-wrap gap-1">
                            {errors.map((err, errIdx) => (
                              <span key={errIdx} className="bg-white text-[#FF2E46] border border-[#FF2E46]/20 text-[10px] px-2 py-0.5 rounded-md font-medium">
                                ✕ {err}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E0E2E5]">
                    <button
                      type="button"
                      onClick={() => onSelectOne(entry)}
                      disabled={!isValid || isAddingBatch}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#2C2C2C] hover:bg-black text-white transition-all disabled:opacity-40"
                    >
                      Autofill Form →
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 mt-2 border-t border-[#E0E2E5] flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-[#666666]">
            {selectedEntries.length > 0 ? (
              <span>
                <strong className="text-[#FF2E46] font-bold">{selectedEntries.length}</strong> valid entries ready for batch insert.
              </span>
            ) : (
              <span>Check entries to batch add into client directory.</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isAddingBatch}
              className="flex-1 sm:flex-none px-4 py-2 border border-[#E0E2E5] hover:bg-[#F8F9FA] text-[#2C2C2C] text-xs font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>

            {onBatchAdd && (
              <button
                type="button"
                onClick={() => onBatchAdd(selectedEntries)}
                disabled={selectedEntries.length === 0 || isAddingBatch}
                className="flex-1 sm:flex-none px-5 py-2 bg-[#FF2E46] hover:bg-[#E02038] text-white text-xs font-semibold rounded-lg shadow-xs transition-all disabled:opacity-50"
              >
                {isAddingBatch 
                  ? 'Importing...' 
                  : `Batch Add Selected (${selectedEntries.length})`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesEntrySelectionModal;
