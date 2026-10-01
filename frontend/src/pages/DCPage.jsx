import React, { useState, useEffect } from 'react';
import useDCStore from '../store/dcStore';
import useAuthStore from '../store/authStore';
import useSocket from '../hooks/useSocket';
import toast from 'react-hot-toast';

const DCPage = () => {
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDC, setSelectedDC] = useState(null);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);
  
  const { dcCalls, fetchDCCalls, completeDC } = useDCStore();
  const { user } = useAuthStore();
  
  useSocket();

  useEffect(() => {
    fetchDCCalls();
  }, [fetchDCCalls]);

  const filteredCalls = dcCalls.filter(call => {
    if (filter === 'PENDING' && call.dcStatus !== 'PENDING') return false;
    if (filter === 'COMPLETED' && call.dcStatus !== 'COMPLETED') return false;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        call.customerName?.toLowerCase().includes(query) ||
        call.phone?.toLowerCase().includes(query) ||
        call.email?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const counts = {
    ALL: dcCalls.length,
    PENDING: dcCalls.filter(c => c.dcStatus === 'PENDING').length,
    COMPLETED: dcCalls.filter(c => c.dcStatus === 'COMPLETED').length,
  };

  const handleCompleteDC = async (callId) => {
    if (isCompleting) return;
    setIsCompleting(true);
    
    try {
      await completeDC(callId);
      setShowCompleteConfirm(null);
      toast.success('DC marked as completed');
    } catch (error) {
      console.error('Error completing DC:', error);
      toast.error('Failed to update DC status');
    } finally {
      setIsCompleting(false);
    }
  };

  const getDCStatusBadge = (status) => {
    return status === 'PENDING' 
      ? 'bg-[#FFE8EB] text-[#FF2E46] border border-[#FF2E46]/30' 
      : 'bg-[#F0F2F5] text-[#2C2C2C] border border-[#E0E2E5]';
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <span className="inline-block text-[#FF2E46] text-xs font-bold uppercase tracking-widest bg-[#FFE8EB] px-2.5 py-0.5 rounded-md mb-2 border border-[#FF2E46]/20">
            DOCUMENTATION & DISPATCH
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C2C2C] tracking-tight">DC Management</h1>
          <p className="text-[#666666] text-sm mt-1">Track physical delivery challan paperwork and documentation completion</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-xs border border-[#E0E2E5] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#666666] uppercase tracking-wider mb-1">Total Challans</h3>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#2C2C2C]">{counts.ALL}</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#F0F2F5] text-[#2C2C2C] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#2C2C2C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-xs border border-[#E0E2E5] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#FF2E46] uppercase tracking-wider mb-1">Pending DC</h3>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#FF2E46]">{counts.PENDING}</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#FFE8EB] text-[#FF2E46] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-xs border border-[#E0E2E5] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Completed DC</h3>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#2C2C2C]">{counts.COMPLETED}</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#F0F2F5] text-[#2C2C2C] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#2C2C2C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-[#E0E2E5]">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[240px]">
            <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#666666]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by customer, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-[#F8F9FA] border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666666] hover:text-[#2C2C2C] text-sm font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-[#E0E2E5] pt-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'All Records' },
              { id: 'PENDING', label: 'Pending Papers' },
              { id: 'COMPLETED', label: 'Completed' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filter === f.id
                    ? 'bg-[#FF2E46] text-white shadow-xs'
                    : 'bg-[#F0F2F5] text-[#2C2C2C] hover:bg-[#E0E2E5]'
                }`}
              >
                {f.label} ({counts[f.id]})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-xl shadow-xs border border-[#E0E2E5] overflow-hidden">
        {filteredCalls.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#666666]">
            <p className="text-sm font-semibold text-[#2C2C2C]">No DC records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E0E2E5]">
              <thead className="bg-[#2C2C2C]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D] w-16">Sr.No</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Address</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Completed By</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">DC Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">DC Remark</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E0E2E5]">
                {filteredCalls.map((call, index) => (
                  <tr 
                    key={call.id} 
                    onClick={() => setSelectedDC(call)} 
                    className="cursor-pointer hover:bg-[#F8F9FA] transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-[#666666]">{index + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-[#2C2C2C]">{call.customerName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-[#2C2C2C]">{call.phone}</td>
                    <td className="px-4 py-3 text-xs text-[#666666] max-w-xs truncate">{call.address}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-[#666666]">{call.completedBy}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md ${getDCStatusBadge(call.dcStatus)}`}>
                        {call.dcStatus === 'PENDING' ? 'Pending' : 'Completed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#666666] max-w-xs truncate">{call.dcRemark || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      {call.dcStatus === 'PENDING' && (
                        <button
                          onClick={() => setShowCompleteConfirm(call.id)}
                          className="bg-[#FF2E46] hover:bg-[#E02038] text-white px-3 py-1 rounded-md text-xs font-semibold shadow-xs transition-colors"
                        >
                          Complete DC
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {filteredCalls.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-[#E0E2E5]">
            <p className="text-sm font-semibold text-[#2C2C2C]">No DC records found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCalls.map((call, index) => (
              <div key={call.id} className="bg-white rounded-xl shadow-xs p-4 border border-[#E0E2E5]">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-[#FF2E46] bg-[#FFE8EB] px-2 py-0.5 rounded-md">#{index + 1}</span>
                      <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md ${getDCStatusBadge(call.dcStatus)}`}>
                        {call.dcStatus === 'PENDING' ? 'Pending' : 'Completed'}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-[#2C2C2C]">{call.customerName}</h3>
                    <p className="text-[#666666] text-xs">{call.phone}</p>
                  </div>
                  <button
                    onClick={() => setSelectedDC(call)}
                    className="text-[#FF2E46] hover:text-[#E02038] text-xs font-semibold"
                  >
                    Details →
                  </button>
                </div>

                <div className="text-xs text-[#666666] space-y-1 mb-3">
                  <div><span className="font-semibold text-[#2C2C2C]">Address:</span> {call.address}</div>
                  <div><span className="font-semibold text-[#2C2C2C]">Completed By:</span> {call.completedBy}</div>
                  {call.dcRemark && <div><span className="font-semibold text-[#2C2C2C]">Remark:</span> {call.dcRemark}</div>}
                </div>

                {call.dcStatus === 'PENDING' && (
                  <button
                    onClick={() => setShowCompleteConfirm(call.id)}
                    className="w-full bg-[#FF2E46] hover:bg-[#E02038] text-white py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    Complete DC
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Confirmation Modal */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-[#E0E2E5]">
            <h2 className="text-base font-bold text-[#2C2C2C] mb-2">Complete Delivery Challan</h2>
            <p className="text-xs text-[#666666] mb-5">
              Are you sure you want to mark this physical paper documentation as completed?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteConfirm(null)}
                disabled={isCompleting}
                className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCompleteDC(showCompleteConfirm)}
                disabled={isCompleting}
                className={`flex-1 py-2 rounded-lg font-semibold text-xs shadow-xs transition-colors ${
                  isCompleting
                    ? 'bg-[#FF5A71] text-white cursor-not-allowed'
                    : 'bg-[#FF2E46] text-white hover:bg-[#E02038]'
                }`}
              >
                {isCompleting ? 'Updating...' : 'Yes, Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedDC && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150" onClick={() => setSelectedDC(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-[#E0E2E5]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 mb-5 border-b border-[#E0E2E5]">
              <h2 className="text-base font-bold text-[#2C2C2C]">DC Document Details</h2>
              <button onClick={() => setSelectedDC(null)} className="text-[#666666] hover:text-[#2C2C2C] p-1 rounded-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#F8F9FA] p-3.5 rounded-lg border border-[#E0E2E5]">
                <label className="block font-bold text-[#666666] uppercase mb-1">Customer Name</label>
                <div className="font-bold text-[#2C2C2C] text-sm">{selectedDC.customerName}</div>
              </div>
              
              <div className="bg-[#F8F9FA] p-3.5 rounded-lg border border-[#E0E2E5]">
                <label className="block font-bold text-[#666666] uppercase mb-1">Phone</label>
                <div className="font-semibold text-[#2C2C2C] text-sm">{selectedDC.phone}</div>
              </div>
              
              {selectedDC.email && (
                <div className="bg-[#F8F9FA] p-3.5 rounded-lg border border-[#E0E2E5] sm:col-span-2">
                  <label className="block font-bold text-[#666666] uppercase mb-1">Email</label>
                  <div className="text-[#2C2C2C]">{selectedDC.email}</div>
                </div>
              )}
              
              <div className="bg-[#F8F9FA] p-3.5 rounded-lg border border-[#E0E2E5] sm:col-span-2">
                <label className="block font-bold text-[#666666] uppercase mb-1">Address</label>
                <div className="text-[#2C2C2C]">{selectedDC.address}</div>
              </div>
              
              <div className="bg-[#F8F9FA] p-3.5 rounded-lg border border-[#E0E2E5]">
                <label className="block font-bold text-[#666666] uppercase mb-1">DC Status</label>
                <span className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-md ${getDCStatusBadge(selectedDC.dcStatus)}`}>
                  {selectedDC.dcStatus === 'PENDING' ? 'Pending' : 'Completed'}
                </span>
              </div>
              
              <div className="bg-[#F8F9FA] p-3.5 rounded-lg border border-[#E0E2E5]">
                <label className="block font-bold text-[#666666] uppercase mb-1">Category</label>
                <div className="font-semibold text-[#2C2C2C]">{selectedDC.category}</div>
              </div>

              <div className="bg-[#F8F9FA] p-3.5 rounded-lg border border-[#E0E2E5] sm:col-span-2">
                <label className="block font-bold text-[#666666] uppercase mb-1">Problem Description</label>
                <div className="text-[#2C2C2C]">{selectedDC.problem}</div>
              </div>

              {selectedDC.dcRemark && (
                <div className="bg-[#FFE8EB] p-3.5 rounded-lg border border-[#FF2E46]/20 sm:col-span-2">
                  <label className="block font-bold text-[#FF2E46] uppercase mb-1">DC Remark</label>
                  <div className="text-[#2C2C2C] font-medium">{selectedDC.dcRemark}</div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-[#E0E2E5] flex justify-end">
              <button
                onClick={() => setSelectedDC(null)}
                className="bg-[#2C2C2C] hover:bg-[#1A1A1A] text-white px-5 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DCPage;
