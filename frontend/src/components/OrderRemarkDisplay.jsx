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

// Compact summary for table rows and mobile cards
export const RemarkSummary = ({ remark }) => {
  const parsed = parseOrderRemark(remark);
  if (!parsed) return <span className="text-[#2C2C2C] break-words whitespace-pre-wrap">{remark || '—'}</span>;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#FFE8EB] text-[#FF2E46] border border-[#FF2E46]/20 w-fit whitespace-nowrap">
        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        {parsed.items.length} item{parsed.items.length !== 1 ? 's' : ''} · ₹{Number(parsed.grandTotal).toLocaleString('en-IN')}
      </span>
      <div className="flex flex-col gap-0.5">
        {parsed.items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px]">
            <span className="font-bold text-[#2C2C2C]">{item.code}</span>
            <span className="text-[#999999]">·</span>
            <span className="text-[#666666]">qty {item.qty}</span>
            <span className="text-[#999999]">·</span>
            <span className="text-[#2C2C2C] font-medium">₹{Number(item.price).toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

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
