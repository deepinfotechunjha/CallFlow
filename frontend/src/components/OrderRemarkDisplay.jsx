import React from 'react';

// Parses orderRemark — returns parsed object if new table format, null if plain text
export function parseOrderRemark(remark) {
  if (!remark) return null;
  try {
    const parsed = JSON.parse(remark);
    if (parsed && parsed.type === 'table' && Array.isArray(parsed.items)) return parsed;
  } catch {
    // not JSON — old plain text
  }
  return null;
}

// Renders orderRemark: table view for new format, plain text for old
const OrderRemarkDisplay = ({ remark }) => {
  const parsed = parseOrderRemark(remark);

  if (!parsed) {
    // Old plain text — render exactly as before
    return <span>{remark}</span>;
  }

  // New table format
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b">Code</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-600 border-b">Configuration</th>
            <th className="px-3 py-2 text-right font-semibold text-gray-600 border-b">Price (₹)</th>
            <th className="px-3 py-2 text-right font-semibold text-gray-600 border-b">Qty</th>
            <th className="px-3 py-2 text-right font-semibold text-gray-600 border-b">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          {parsed.items.map((item, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-3 py-2 font-medium text-gray-800 border-b border-gray-100">{item.code}</td>
              <td className="px-3 py-2 text-gray-700 border-b border-gray-100">{item.configuration}</td>
              <td className="px-3 py-2 text-right text-gray-700 border-b border-gray-100">{Number(item.price).toLocaleString('en-IN')}</td>
              <td className="px-3 py-2 text-right text-gray-700 border-b border-gray-100">{item.qty}</td>
              <td className="px-3 py-2 text-right font-semibold text-gray-800 border-b border-gray-100">{Number(item.total).toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-blue-50">
          <tr>
            <td colSpan={4} className="px-3 py-2 text-right font-bold text-gray-700 text-xs">Grand Total</td>
            <td className="px-3 py-2 text-right font-bold text-blue-700">₹{Number(parsed.grandTotal).toLocaleString('en-IN')}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default OrderRemarkDisplay;
