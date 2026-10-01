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
    return <span className="text-[#2C2C2C]">{remark}</span>;
  }

  // New table format
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full text-xs">
        <thead className="bg-[#2C2C2C] text-white">
          <tr>
            <th className="px-3 py-2 text-left font-bold tracking-wider uppercase text-[10px]">Code</th>
            <th className="px-3 py-2 text-left font-bold tracking-wider uppercase text-[10px]">Configuration</th>
            <th className="px-3 py-2 text-right font-bold tracking-wider uppercase text-[10px]">Price (₹)</th>
            <th className="px-3 py-2 text-right font-bold tracking-wider uppercase text-[10px]">Qty</th>
            <th className="px-3 py-2 text-right font-bold tracking-wider uppercase text-[10px]">Total (₹)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {parsed.items.map((item, i) => (
            <tr key={i} className="hover:bg-[#FFE8EB]/20 transition-colors">
              <td className="px-3 py-2 font-bold text-[#2C2C2C]">{item.code}</td>
              <td className="px-3 py-2 text-gray-600">{item.configuration}</td>
              <td className="px-3 py-2 text-right text-gray-700 font-medium">{Number(item.price).toLocaleString('en-IN')}</td>
              <td className="px-3 py-2 text-right text-gray-700 font-bold">{item.qty}</td>
              <td className="px-3 py-2 text-right font-bold text-[#2C2C2C]">{Number(item.total).toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-[#FFE8EB]/60 border-t border-[#FF2E46]/20">
          <tr>
            <td colSpan={4} className="px-3 py-2 text-right font-bold text-[#2C2C2C] text-xs uppercase tracking-wider">Grand Total</td>
            <td className="px-3 py-2 text-right font-black text-[#FF2E46] text-xs">₹{Number(parsed.grandTotal).toLocaleString('en-IN')}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default OrderRemarkDisplay;
