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
    } catch (error) {
      console.error('Error completing DC:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const getDCStatusColor = (status) => {
    return status === 'PENDING' 
      ? 'bg-yellow-100 text-yellow-800' 
      : 'bg-green-100 text-green-800';
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">DC Management 📄</h1>
          <p className="text-gray-600">Manage physical paper documentation</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl shadow-sm border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-blue-700 mb-1">All DC</h3>
              <p className="text-2xl sm:text-3xl font-bold text-blue-800">{counts.ALL}</p>
            </div>
            <div className="text-blue-500 text-2xl">📄</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 sm:p-6 rounded-xl shadow-sm border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-yellow-700 mb-1">Pending DC</h3>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-800">{counts.PENDING}</p>
            </div>
            <div className="text-yellow-500 text-2xl">⏳</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-xl shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-green-700 mb-1">Completed DC</h3>
              <p className="text-2xl sm:text-3xl font-bold text-green-800">{counts.COMPLETED}</p>
            </div>
            <div className="text-green-500 text-2xl">✅</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>🔍</span> Search & Filters
        </h2>
        
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Search by customer, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl transition-colors"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex overflow-x-auto scrollbar-hide gap-1">
            {['ALL', 'PENDING', 'COMPLETED'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-all ${
                  filter === f
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {f} ({counts[f]})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span>📊</span> DC Records
          </h2>
        </div>

        {filteredCalls.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <div className="text-4xl mb-4">📄</div>
            <p className="text-lg font-medium">No DC records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sr.No</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed By</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">DC Status</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">DC Remark</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCalls.map((call, index) => (
                  <tr key={call.id} onClick={() => setSelectedDC(call)} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">{call.customerName}</td>
                    <td className="px-3 py-3 text-sm text-gray-900">{call.phone}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{call.email || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 max-w-xs truncate">{call.address}</td>
                    <td className="px-3 py-3 text-sm text-gray-900">{call.completedBy}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDCStatusColor(call.dcStatus)}`}>
                        {call.dcStatus === 'PENDING' ? 'Pending' : 'Completed'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 max-w-xs truncate">{call.dcRemark || '-'}</td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      {call.dcStatus === 'PENDING' && (
                        <button
                          onClick={() => setShowCompleteConfirm(call.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
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
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📄</div>
            <p className="text-gray-500 text-lg">No DC records found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCalls.map((call, index) => (
              <div key={call.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDCStatusColor(call.dcStatus)}`}>
                        {call.dcStatus === 'PENDING' ? 'Pending' : 'Completed'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg">{call.customerName}</h3>
                    <p className="text-gray-600 text-sm">{call.phone}</p>
                    {call.email && <p className="text-gray-600 text-xs">{call.email}</p>}
                  </div>
                  <button
                    onClick={() => setSelectedDC(call)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>

                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Address</div>
                  <div className="text-sm text-gray-900">{call.address}</div>
                </div>

                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Completed By</div>
                  <div className="text-sm text-gray-900">{call.completedBy}</div>
                </div>

                {call.dcRemark && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-500 mb-1">DC Remark</div>
                    <div className="text-sm text-gray-600 line-clamp-2">{call.dcRemark}</div>
                  </div>
                )}

                {call.dcStatus === 'PENDING' && (
                  <button
                    onClick={() => setShowCompleteConfirm(call.id)}
                    className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 mt-2"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Complete DC</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to mark this physical paper as completed?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleCompleteDC(showCompleteConfirm)}
                disabled={isCompleting}
                className={`flex-1 py-2 rounded font-medium ${
                  isCompleting
                    ? 'bg-green-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isCompleting ? 'Processing...' : 'Yes, Complete'}
              </button>
              <button
                onClick={() => setShowCompleteConfirm(null)}
                disabled={isCompleting}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedDC && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDC(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">DC Details</h2>
              <button onClick={() => setSelectedDC(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="block text-sm font-medium text-blue-700 mb-1">Customer Name</label>
                  <div className="text-base font-semibold text-blue-900">{selectedDC.customerName}</div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="block text-sm font-medium text-blue-700 mb-1">Phone</label>
                  <div className="text-base font-semibold text-blue-900">{selectedDC.phone}</div>
                </div>
                
                {selectedDC.email && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <label className="block text-sm font-medium text-blue-700 mb-1">Email</label>
                    <div className="text-base text-blue-900 break-all">{selectedDC.email}</div>
                  </div>
                )}
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="block text-sm font-medium text-blue-700 mb-1">Address</label>
                  <div className="text-base text-blue-900">{selectedDC.address}</div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <label className="block text-sm font-medium text-yellow-700 mb-1">DC Status</label>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getDCStatusColor(selectedDC.dcStatus)}`}>
                    {selectedDC.dcStatus === 'PENDING' ? 'Pending' : 'Completed'}
                  </span>
                </div>
                
                {selectedDC.dcRemark && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <label className="block text-sm font-medium text-yellow-700 mb-1">DC Remark</label>
                    <div className="text-base text-yellow-900">{selectedDC.dcRemark}</div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <div className="text-base text-gray-900">{selectedDC.category}</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Problem</label>
                  <div className="text-base text-gray-900">{selectedDC.problem}</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                  <div className="text-base text-gray-900">{selectedDC.createdBy}</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completed By</label>
                  <div className="text-base text-gray-900">{selectedDC.completedBy}</div>
                </div>
                
                {selectedDC.dcCompletedBy && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <label className="block text-sm font-medium text-green-700 mb-1">DC Completed By</label>
                    <div className="text-base text-green-900">{selectedDC.dcCompletedBy}</div>
                  </div>
                )}
                
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completed At</label>
                  <div className="text-base text-gray-900">{new Date(selectedDC.completedAt).toLocaleString()}</div>
                </div>
                
                {selectedDC.dcCompletedAt && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <label className="block text-sm font-medium text-green-700 mb-1">DC Completed At</label>
                    <div className="text-base text-green-900">{new Date(selectedDC.dcCompletedAt).toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DCPage;
