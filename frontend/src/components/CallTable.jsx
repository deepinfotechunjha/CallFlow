import React, { useState, useEffect } from 'react';
import useCallStore from '../store/callStore';
import useAuthStore from '../store/authStore';
import useCategoryStore from '../store/categoryStore';
import useClickOutside from '../hooks/useClickOutside';

const CallTable = ({ calls }) => {
  const [showAssign, setShowAssign] = useState({});
  const [showEdit, setShowEdit] = useState({});
  const [showComplete, setShowComplete] = useState({});
  const [selectedWorker, setSelectedWorker] = useState({});
  const [remark, setRemark] = useState({});
  const [engineerRemark, setEngineerRemark] = useState({});
  const [isUpdating, setIsUpdating] = useState({});
  const [formData, setFormData] = useState({});
  const [selectedCall, setSelectedCall] = useState(null);
  
  const { updateCall } = useCallStore();
  const { user, users, token } = useAuthStore();
  const { categories, fetchCategories } = useCategoryStore();

  const detailModalRef = useClickOutside(() => setSelectedCall(null));
  
  const handleClickOutsideEdit = (callId) => {
    setShowEdit(prev => ({ ...prev, [callId]: false }));
  };
  
  const handleClickOutsideAssign = (callId) => {
    setShowAssign(prev => ({ ...prev, [callId]: false }));
    setSelectedWorker(prev => ({ ...prev, [callId]: '' }));
    setEngineerRemark(prev => ({ ...prev, [callId]: '' }));
  };
  
  const handleClickOutsideComplete = (callId) => {
    setShowComplete(prev => ({ ...prev, [callId]: false }));
    setRemark(prev => ({ ...prev, [callId]: '' }));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAssign = async (callId) => {
    const worker = selectedWorker[callId];
    if (worker) {
      if (!token) {
        alert('Please login to assign calls');
        return;
      }
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/calls/${callId}/assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ 
            assignee: worker,
            engineerRemark: engineerRemark[callId] || null
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          alert(`Assignment failed: ${errorData.error || 'Unknown error'}`);
          return;
        }
        
        window.location.reload();
      } catch (error) {
        alert('Assignment failed. Please try again.');
      }
      setShowAssign(prev => ({ ...prev, [callId]: false }));
      setSelectedWorker(prev => ({ ...prev, [callId]: '' }));
      setEngineerRemark(prev => ({ ...prev, [callId]: '' }));
    }
  };

  const handleComplete = async (callId) => {
    if (!token) {
      alert('Please login to complete calls');
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/calls/${callId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ remark: remark[callId] || '' })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(`Complete failed: ${errorData.error || 'Unknown error'}`);
        return;
      }
      
      window.location.reload();
    } catch (error) {
      alert('Failed to complete call. Please try again.');
    }
  };

  const handleEditSave = async (callId, e) => {
    e.preventDefault();
    
    if (isUpdating[callId]) return;
    
    setIsUpdating(prev => ({ ...prev, [callId]: true }));
    
    try {
      const data = formData[callId];
      const allData = {
        customerName: data.customerName,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        problem: data.problem,
        category: data.category
      };
      
      await updateCall(callId, allData);
      setShowEdit(prev => ({ ...prev, [callId]: false }));
    } catch (error) {
      // Error handling is done in updateCall
    } finally {
      setIsUpdating(prev => ({ ...prev, [callId]: false }));
    }
  };

  const openEditModal = (call) => {
    setFormData(prev => ({
      ...prev,
      [call.id]: {
        customerName: call?.customerName || '',
        phone: call?.phone || '',
        email: call?.email || '',
        address: call?.address || '',
        problem: call?.problem || '',
        category: call?.category || ''
      }
    }));
    setShowEdit(prev => ({ ...prev, [call.id]: true }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusTags = (call) => {
    const tags = [];
    
    if (call.status === 'PENDING') {
      tags.push({ label: 'PENDING', color: 'bg-yellow-100 text-yellow-800' });
    } else if (call.status === 'ASSIGNED') {
      tags.push({ label: 'PENDING', color: 'bg-yellow-100 text-yellow-800' });
      tags.push({ label: 'ASSIGNED', color: 'bg-blue-100 text-blue-800' });
    } else if (call.status === 'COMPLETED') {
      tags.push({ label: 'COMPLETED', color: 'bg-green-100 text-green-800' });
    }
    
    return tags;
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl overflow-hidden border border-gray-200">
      <div className="w-full">
        <table className="w-full table-fixed divide-y divide-gray-300">
          <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
            <tr>
              <th className="w-16 px-2 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500">Sr.No</th>
              <th className="w-32 px-3 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500">Customer & Address</th>
              <th className="w-32 px-3 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500">Phone & Email</th>
              <th className="w-24 px-3 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500">Category</th>
              <th className="w-40 px-3 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500">Problem</th>
              <th className="w-28 px-3 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500">Status</th>
              <th className="w-32 px-3 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500">Assignment</th>
              <th className="w-28 px-3 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500">Date & Time</th>
              <th className="w-24 px-3 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {calls.map((call, index) => {
              const canAssign = ['HOST', 'ADMIN'].includes(user?.role) && call.status !== 'COMPLETED';
              const canEdit = user?.role === 'HOST' && call.status !== 'COMPLETED';
              const canComplete = call.assignedTo === user?.username || ['HOST', 'ADMIN'].includes(user?.role);

              return (
                <React.Fragment key={call.id}>
                  <tr className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 cursor-pointer ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  }`} onClick={() => setSelectedCall(call)}>
                    <td className="px-2 py-4 border-r border-gray-200">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-full text-xs">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-3 py-4 border-r border-gray-200">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 font-medium">Customer:</div>
                        <div className="text-sm font-semibold text-gray-900 truncate">{call?.customerName}</div>
                        {call?.address && (
                          <>
                            <div className="text-xs text-gray-500 font-medium">Address:</div>
                            <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded break-words">{call?.address}</div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 border-r border-gray-200">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 font-medium">Phone:</div>
                        <div className="text-sm font-medium text-gray-900 bg-blue-50 px-2 py-1 rounded truncate">{call?.phone}</div>
                        {call?.email && (
                          <>
                            <div className="text-xs text-gray-500 font-medium">Email:</div>
                            <div className="text-[10px] text-gray-600 bg-green-50 px-2 py-1 rounded whitespace-nowrap">{call?.email}</div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 border-r border-gray-200">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border border-indigo-200 truncate">
                        {call.category}
                      </span>
                    </td>
                    <td className="px-3 py-4 border-r border-gray-200">
                      <div className="text-xs text-gray-900 bg-yellow-50 p-2 rounded border-l-4 border-yellow-400 break-words" title={call.problem}>{call.problem}</div>
                    </td>
                    <td className="px-3 py-4 border-r border-gray-200">
                      <div className="flex flex-col gap-1">
                        {getStatusTags(call).map((tag, tagIndex) => (
                          <span key={tagIndex} className={`inline-flex px-2 py-1 text-xs font-bold rounded-full shadow-sm ${tag.color} border truncate`}>
                            {tag.label}
                          </span>
                        ))}
                        {call.callCount > 1 && (
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full shadow-sm border truncate ${
                            call.callCount === 2 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300' :
                            call.callCount === 3 ? 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300' :
                            'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300'
                          }`}>
                            {call.callCount}x
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 border-r border-gray-200">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 font-medium">Created By:</div>
                        <div className="bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-900 truncate">{call.createdBy}</div>
                        {call.assignedTo && (
                          <>
                            <div className="text-xs text-gray-500 font-medium">Assigned To:</div>
                            <div className="bg-green-100 px-2 py-1 rounded text-xs font-medium text-green-800 truncate">{call.assignedTo}</div>
                          </>
                        )}
                        {call.completedBy && (
                          <>
                            <div className="text-xs text-gray-500 font-medium">Completed By:</div>
                            <div className="bg-blue-100 px-2 py-1 rounded text-xs font-medium text-blue-800 truncate">{call.completedBy}</div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 border-r border-gray-200">
                      <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-2 rounded space-y-1">
                        <div className="text-xs text-gray-500 font-medium">Date:</div>
                        <div className="text-xs font-medium text-gray-900">{new Date(call.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500 font-medium">Time:</div>
                        <div className="text-xs text-gray-600">{new Date(call.createdAt).toLocaleTimeString()}</div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1">
                        {canEdit && (
                          <button
                            onClick={() => openEditModal(call)}
                            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded text-xs hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-sm font-semibold"
                          >
                            Edit
                          </button>
                        )}
                        {canAssign && call.status !== 'COMPLETED' && (
                          <button
                            onClick={() => setShowAssign(prev => ({ ...prev, [call.id]: true }))}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2 py-1 rounded text-xs hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-sm font-semibold"
                          >
                            {call.assignedTo ? 'Reassign' : 'Assign'}
                          </button>
                        )}
                        {canComplete && call.status !== 'COMPLETED' && (
                          <button
                            onClick={() => setShowComplete(prev => ({ ...prev, [call.id]: true }))}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded text-xs hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-sm font-semibold"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  

                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {Object.keys(showEdit).map(callId => {
        if (!showEdit[callId]) return null;
        const call = calls.find(c => c.id === parseInt(callId));
        if (!call) return null;

        return (
          <div key={`edit-${callId}`} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Edit Call Details</h2>
              
              <form onSubmit={(e) => handleEditSave(parseInt(callId), e)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={formData[callId]?.customerName || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      [callId]: { ...prev[callId], customerName: e.target.value }
                    }))}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={formData[callId]?.phone || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      [callId]: { ...prev[callId], phone: e.target.value }
                    }))}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData[callId]?.email || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      [callId]: { ...prev[callId], email: e.target.value }
                    }))}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea
                    value={formData[callId]?.address || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      [callId]: { ...prev[callId], address: e.target.value }
                    }))}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
                    rows="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    value={formData[callId]?.category || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      [callId]: { ...prev[callId], category: e.target.value }
                    }))}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Problem *</label>
                  <textarea
                    value={formData[callId]?.problem || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      [callId]: { ...prev[callId], problem: e.target.value }
                    }))}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
                    rows="3"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={isUpdating[callId]}
                    className={`flex-1 py-2 rounded font-medium ${
                      isUpdating[callId] 
                        ? 'bg-orange-400 text-white cursor-not-allowed' 
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                    }`}
                  >
                    {isUpdating[callId] ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEdit(prev => ({ ...prev, [callId]: false }))}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })}

      {/* Assign Modal */}
      {Object.keys(showAssign).map(callId => {
        if (!showAssign[callId]) return null;
        const call = calls.find(c => c.id === parseInt(callId));
        if (!call) return null;

        return (
          <div key={`assign-${callId}`} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{call.assignedTo ? 'Reassign Call' : 'Assign Call'}</h2>
              <p className="text-gray-600 mb-4">
                {call.assignedTo ? `Currently assigned to: ${call.assignedTo}` : 'Select a worker to assign this call to:'}
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Select Worker *</label>
                <select
                  value={selectedWorker[callId] || ''}
                  onChange={(e) => setSelectedWorker(prev => ({ ...prev, [callId]: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Worker</option>
                  {users.filter(u => u.role === 'USER' || u.role === 'ADMIN').map(u => (
                    <option key={u.id} value={u.username}>{u.username} ({u.role})</option>
                  ))}
                </select>
              </div>
              
              {['HOST', 'ADMIN'].includes(user?.role) && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Engineer Instructions (optional)</label>
                  <textarea
                    value={engineerRemark[callId] || ''}
                    onChange={(e) => setEngineerRemark(prev => ({ ...prev, [callId]: e.target.value }))}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Add any special instructions for the engineer..."
                  />
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleAssign(parseInt(callId));
                    setShowAssign(prev => ({ ...prev, [callId]: false }));
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium"
                >
                  {call.assignedTo ? 'Reassign' : 'Assign'}
                </button>
                <button
                  onClick={() => {
                    setShowAssign(prev => ({ ...prev, [callId]: false }));
                    setSelectedWorker(prev => ({ ...prev, [callId]: '' }));
                    setEngineerRemark(prev => ({ ...prev, [callId]: '' }));
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Complete Modal */}
      {Object.keys(showComplete).map(callId => {
        if (!showComplete[callId]) return null;

        return (
          <div key={`complete-${callId}`} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Complete Call</h2>
              <p className="text-gray-600 mb-4">
                Are you sure you want to mark this call as completed?
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Remark (optional)</label>
                <textarea
                  value={remark[callId] || ''}
                  onChange={(e) => setRemark(prev => ({ ...prev, [callId]: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="Add any notes about the completion..."
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleComplete(parseInt(callId));
                    setShowComplete(prev => ({ ...prev, [callId]: false }));
                  }}
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium"
                >
                  Confirm
                </button>
                <button
                  onClick={() => {
                    setShowComplete(prev => ({ ...prev, [callId]: false }));
                    setRemark(prev => ({ ...prev, [callId]: '' }));
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Call Detail Modal */}
      {selectedCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={detailModalRef} className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Call Details</h2>
              <button
                onClick={() => setSelectedCall(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">{selectedCall.customerName}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <div className="mt-1 p-2 bg-blue-50 rounded border">{selectedCall.phone}</div>
                </div>
                
                {selectedCall.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 p-2 bg-green-50 rounded border break-all">{selectedCall.email}</div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <div className="mt-1 p-2 bg-indigo-50 rounded border">{selectedCall.category}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    {getStatusTags(selectedCall).map((tag, index) => (
                      <span key={index} className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full mr-2 ${tag.color}`}>
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {selectedCall.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <div className="mt-1 p-2 bg-gray-50 rounded border">{selectedCall.address}</div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created By</label>
                  <div className="mt-1 p-2 bg-gray-100 rounded border">{selectedCall.createdBy}</div>
                </div>
                
                {selectedCall.assignedTo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                    <div className="mt-1 p-2 bg-green-100 rounded border">{selectedCall.assignedTo}</div>
                  </div>
                )}
                
                {selectedCall.completedBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Completed By</label>
                    <div className="mt-1 p-2 bg-blue-100 rounded border">{selectedCall.completedBy}</div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <div className="mt-1 p-2 bg-gray-100 rounded border">
                    {new Date(selectedCall.createdAt).toLocaleDateString()} {new Date(selectedCall.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Problem Description</label>
              <div className="mt-1 p-3 bg-yellow-50 rounded border border-yellow-200">{selectedCall.problem}</div>
            </div>
            
            {(selectedCall.remark || selectedCall.engineerRemark) && (
              <div className="mt-4 space-y-3">
                {selectedCall.engineerRemark && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Engineer Instructions</label>
                    <div className="mt-1 p-2 bg-blue-50 rounded border">{selectedCall.engineerRemark}</div>
                  </div>
                )}
                {selectedCall.remark && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Completion Remark</label>
                    <div className="mt-1 p-2 bg-green-50 rounded border">{selectedCall.remark}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CallTable;