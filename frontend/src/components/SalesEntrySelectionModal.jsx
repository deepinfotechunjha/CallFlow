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

  // Filtered entries based on search
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

  // Separate valid vs invalid among all entries
  const validEntries = useMemo(() => entries.filter(e => e.validation?.isValid), [entries]);
  const invalidEntries = useMemo(() => entries.filter(e => !e.validation?.isValid), [entries]);

  // Valid entries among currently filtered list
  const filteredValidEntries = useMemo(() => filteredEntries.filter(e => e.validation?.isValid), [filteredEntries]);

  // Check if all filtered valid entries are selected
  const isAllValidSelected = filteredValidEntries.length > 0 && 
    filteredValidEntries.every(e => selectedRowIndices.has(e.rowIndex));

  // Toggle "Select All" (strictly only selects valid entries)
  const handleToggleSelectAll = () => {
    setSelectedRowIndices(prev => {
      const next = new Set(prev);
      if (isAllValidSelected) {
        // Deselect all filtered valid entries
        filteredValidEntries.forEach(e => next.delete(e.rowIndex));
      } else {
        // Select all filtered valid entries (invalid are NEVER selected)
        filteredValidEntries.forEach(e => next.add(e.rowIndex));
      }
      return next;
    });
  };

  // Toggle individual row checkbox
  const handleToggleRow = (entry) => {
    if (!entry.validation?.isValid) return; // Cannot select invalid entry
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

  // Get array of selected entry objects
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
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isAddingBatch) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-3 sm:p-4 backdrop-blur-sm animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl p-4 sm:p-5 w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-100"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-start pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg text-sm">📊</span>
              <h3 className="text-base sm:text-lg font-bold text-gray-800">
                Imported Sales Entries from Excel
              </h3>
            </div>
            {/* Status counts badges */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full font-medium">
                Total: <strong>{entries.length}</strong>
              </span>
              <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full font-medium flex items-center gap-1">
                <span>✓</span> Valid: <strong>{validEntries.length}</strong>
              </span>
              {invalidEntries.length > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full font-medium flex items-center gap-1">
                  <span>⚠</span> Errors: <strong>{invalidEntries.length} (Disabled)</strong>
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={isAddingBatch}
            className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Toolbar: Search + Select All checkbox */}
        <div className="my-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by firm, contact, phone, city, GST..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <span className="absolute left-2.5 top-2 text-gray-400 text-xs">🔍</span>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs bg-gray-200 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          {/* Select All Checkbox */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-xs self-start sm:self-auto">
            <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-gray-700">
              <input
                type="checkbox"
                checked={isAllValidSelected}
                onChange={handleToggleSelectAll}
                disabled={filteredValidEntries.length === 0 || isAddingBatch}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
              />
              <span>Select All Valid ({filteredValidEntries.length})</span>
            </label>
            {selectedEntries.length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {selectedEntries.length} selected
              </span>
            )}
          </div>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              No entries matching your search.
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isValid = entry.validation?.isValid;
              const errors = entry.validation?.errors || [];
              const isSelected = selectedRowIndices.has(entry.rowIndex);

              return (
                <div
                  key={entry.rowIndex}
                  className={`border rounded-lg p-3 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3 ${
                    !isValid
                      ? 'bg-red-50/60 border-red-300 opacity-90'
                      : isSelected
                      ? 'bg-blue-50/50 border-blue-500 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    {/* Checkbox for selection */}
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(entry)}
                        disabled={!isValid || isAddingBatch}
                        className={`w-4 h-4 rounded border-gray-300 focus:ring-blue-500 ${
                          !isValid
                            ? 'cursor-not-allowed opacity-40 bg-gray-200'
                            : 'cursor-pointer text-blue-600'
                        }`}
                        title={!isValid ? 'Cannot select row with errors' : 'Select this entry'}
                      />
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          !isValid ? 'bg-red-200 text-red-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          Row #{entry.rowIndex}
                        </span>

                        <h4 className={`font-bold text-sm sm:text-base ${
                          !isValid ? 'text-red-900' : 'text-gray-800'
                        }`}>
                          {entry.firmName || <span className="italic text-red-500 font-normal">Missing Firm Name *</span>}
                        </h4>

                        {entry.gstNo ? (
                          <span className={`text-[11px] px-1.5 py-0.5 rounded font-mono font-medium ${
                            entry.gstNo.length === 15 ? 'bg-indigo-50 text-indigo-700' : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            GST: {entry.gstNo}
                          </span>
                        ) : (
                          <span className="text-[11px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                            Missing GST *
                          </span>
                        )}

                        {!isValid && (
                          <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                            <span>⚠</span> Invalid
                          </span>
                        )}
                      </div>

                      {/* Details row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-600 pt-0.5">
                        <div>
                          <span className="font-medium text-gray-700">Contact:</span>{' '}
                          {entry.contactPerson1Name || <span className="text-red-500">Missing Name *</span>}{' '}
                          {entry.contactPerson1Number ? (
                            <span className={entry.contactPerson1Number.length === 10 ? 'text-gray-500' : 'text-red-500 font-medium'}>
                              ({entry.contactPerson1Number})
                            </span>
                          ) : (
                            <span className="text-red-500">(Missing Number *)</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Location:</span>{' '}
                          {[entry.area || <span className="text-red-500">Missing Area *</span>, entry.city].filter(Boolean).map((part, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && ', '}
                              {part}
                            </React.Fragment>
                          ))}
                          {entry.pincode ? ` - ${entry.pincode}` : <span className="text-red-500"> (Missing Pincode *)</span>}
                        </div>
                        {entry.address && (
                          <div className="truncate sm:col-span-2">
                            <span className="font-medium text-gray-700">Address:</span> {entry.address}
                          </div>
                        )}
                      </div>

                      {/* Error badges box for invalid rows */}
                      {!isValid && errors.length > 0 && (
                        <div className="mt-2 p-2 bg-red-100/80 border border-red-200 rounded text-xs text-red-800 space-y-1">
                          <p className="font-semibold flex items-center gap-1 text-[11px] text-red-900">
                            <span>⚠️</span> Issues found ({errors.length}):
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {errors.map((err, errIdx) => (
                              <span
                                key={errIdx}
                                className="bg-white/90 text-red-700 border border-red-300 text-[10px] px-2 py-0.5 rounded font-medium shadow-2xs"
                              >
                                ✕ {err}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions for single item */}
                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <button
                      type="button"
                      onClick={() => onSelectOne(entry)}
                      disabled={!isValid || isAddingBatch}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 shadow-2xs whitespace-nowrap ${
                        !isValid
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95 cursor-pointer'
                      }`}
                      title={!isValid ? 'Fix errors in Excel before autofilling' : 'Fill this single row into the form'}
                    >
                      <span>Autofill Form</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer with Batch Add Action */}
        <div className="pt-3 mt-2 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-2.5">
          <div className="text-xs text-gray-600">
            {selectedEntries.length > 0 ? (
              <span>
                <strong className="text-blue-600">{selectedEntries.length}</strong> valid entries selected for batch addition.
              </span>
            ) : (
              <span className="text-gray-400">
                Select entries using checkboxes to add them in batch.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isAddingBatch}
              className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            {onBatchAdd && (
              <button
                type="button"
                onClick={() => onBatchAdd(selectedEntries)}
                disabled={selectedEntries.length === 0 || isAddingBatch}
                className="flex-1 sm:flex-none px-5 py-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center justify-center gap-1.5 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <span>🚀</span>
                <span>
                  {isAddingBatch 
                    ? 'Adding Entries...' 
                    : `Add Selected Entries (${selectedEntries.length})`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesEntrySelectionModal;
