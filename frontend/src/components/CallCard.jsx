import React, { useState, useEffect } from 'react';
import useCallStore from '../store/callStore';
import useAuthStore from '../store/authStore';
import useCategoryStore from '../store/categoryStore';

const CallCard = ({ call, selectedCalls = [], onSelectCall, showCheckboxes = false }) => {
  const [showAssign, setShowAssign] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showDCSelection, setShowDCSelection] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [completeAction, setCompleteAction] = useState('complete');
  const [selectedWorker, setSelectedWorker] = useState('');
  const [remark, setRemark] = useState('');
  const [visitedRemark, setVisitedRemark] = useState('');
  const [engineerRemark, setEngineerRemark] = useState('');
  const [dcRequired, setDcRequired] = useState(true);
  const [dcRemark, setDcRemark] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    address: '',
    problem: '',
    category: ''
  });
  
  const { updateCall, assignCall, completeCall, visitCall } = useCallStore();
  const { user, users } = useAuthStore();
  const { categories, fetchCategories } = useCategoryStore();

  const handleModalBackdropClick = (e, modalType) => {
    if (e.target === e.currentTarget) {
      if (modalType === 'assign' && !isAssigning) {
        setShowAssign(false);
        setSelectedWorker('');
        setEngineerRemark('');
      } else if (modalType === 'edit' && !isUpdating) {
        setShowEdit(false);
      } else if (modalType === 'complete' && !isCompleting) {
        setShowComplete(false);
        setRemark('');
      }
    }
  };
  
  const canAssign = ['HOST', 'ADMIN'].includes(user?.role) && call.status !== 'COMPLETED';
  const canEdit = ['HOST', 'ADMIN'].includes(user?.role) && call.status !== 'COMPLETED';
  const canComplete = call.assignedTo === user?.username || ['HOST', 'ADMIN'].includes(user?.role);

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [categories.length, fetchCategories]);

  useEffect(() => {
    if (showEdit) {
      setFormData({
        customerName: call?.customerName || '',
        phone: call?.phone || '',
        email: call?.email || '',
        address: call?.address || '',
        problem: call?.problem || '',
        category: call?.category || ''
      });
    }
  }, [showEdit, call]);

  useEffect(() => {
    if (showAssign && call.engineerRemark) {
      setEngineerRemark(call.engineerRemark);
    }
  }, [showAssign, call.engineerRemark]);

  const handleAssign = async () => {
    if (selectedWorker && !isAssigning) {
      setIsAssigning(true);
      try {
        await assignCall(call.id, selectedWorker, engineerRemark);
        setShowAssign(false);
        setSelectedWorker('');
        setEngineerRemark('');
        setIsActionModalOpen(false);
      } catch (error) {
        // Handled in store
      } finally {
        setIsAssigning(false);
      }
    }
  };

  const handleComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    
    try {
      if (completeAction === 'complete') {
        if (!showDCSelection) {
          setShowDCSelection(true);
          setIsCompleting(false);
          return;
        }
        await completeCall(call.id, remark, dcRequired, dcRemark);
      } else {
        await visitCall(call.id, visitedRemark);
      }
      setShowComplete(false);
      setShowDCSelection(false);
      setRemark('');
      setVisitedRemark('');
      setDcRequired(false);
      setDcRemark('');
      setCompleteAction('complete');
      setIsActionModalOpen(false);
    } catch (error) {
      // Handled in store
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCompleteClick = () => {
    setShowComplete(true);
  };

  const handleCompleteConfirm = () => {
    handleComplete();
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (isUpdating) return;
    setIsUpdating(true);
    
    try {
      const allData = {
        customerName: formData.customerName,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
        problem: formData.problem,
        category: formData.category
      };
      
      await updateCall(call.id, allData);
      setShowEdit(false);
      setIsActionModalOpen(false);
    } catch (error) {
      // Handled in store
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditOpen = () => {
    setShowEdit(true);
  };

  const getStatusTags = (call) => {
    const tags = [];
    if (call.status === 'PENDING') {
      tags.push({ label: 'PENDING', className: 'bg-[#FFE8EB] text-[#FF2E46] border border-[#FF2E46]/30' });
    } else if (call.status === 'ASSIGNED') {
      tags.push({ label: 'PENDING', className: 'bg-[#FFE8EB] text-[#FF2E46] border border-[#FF2E46]/30' });
      tags.push({ label: 'ASSIGNED', className: 'bg-[#F0F2F5] text-[#2C2C2C] border border-[#E0E2E5]' });
    } else if (call.status === 'VISITED') {
      tags.push({ label: 'PENDING', className: 'bg-[#FFE8EB] text-[#FF2E46] border border-[#FF2E46]/30' });
      tags.push({ label: 'VISITED', className: 'bg-[#FFE8EB] text-[#FF2E46]' });
    } else if (call.status === 'COMPLETED') {
      tags.push({ label: 'COMPLETED', className: 'bg-[#2C2C2C] text-white' });
      if (call.dcRequired) {
        if (call.dcStatus === 'COMPLETED') {
          tags.push({ label: 'DC✓', className: 'bg-[#2C2C2C] text-white' });
        } else {
          tags.push({ label: 'DC⏳', className: 'bg-[#FFE8EB] text-[#FF2E46] border border-[#FF2E46]/30' });
        }
      }
    }
    return tags;
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 border border-[#E0E2E5] hover:border-[#FF2E46]/40 transition-all cursor-pointer relative"
      onClick={() => !isActionModalOpen && setShowDetails(true)}
    >
      {showCheckboxes && call.status === 'COMPLETED' && (
        <div className="flex justify-end mb-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selectedCalls.includes(call.id)}
            onChange={(e) => {
              e.stopPropagation();
              onSelectCall(call.id);
            }}
            className="w-4 h-4 text-[#FF2E46] rounded focus:ring-[#FF2E46] cursor-pointer"
          />
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-base sm:text-lg text-[#2C2C2C] break-words">{call?.customerName}</h3>
          <p className="text-[#666666] text-xs sm:text-sm font-semibold mt-0.5">{call?.phone}</p>
          {call?.email && <p className="text-[#666666] text-xs break-all">{call?.email}</p>}
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {getStatusTags(call).map((tag, index) => (
            <span 
              key={index}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${tag.className}`}
            >
              {tag.label}
            </span>
          ))}
          {call.callCount > 1 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FFE8EB] text-[#FF2E46]">
              {call.callCount}x Calls
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1 text-xs sm:text-sm text-[#666666] mb-3">
        <p><strong className="text-[#2C2C2C]">Category:</strong> {call.category}</p>
        <p><strong className="text-[#2C2C2C]">Problem:</strong> {call.problem}</p>
        {call?.address && <p><strong className="text-[#2C2C2C]">Address:</strong> {call?.address}</p>}
      </div>

      <div className="text-[11px] text-[#666666] mb-4 space-y-0.5 pt-2 border-t border-[#E0E2E5]/50">
        <p>Created by: {call.createdBy} • {new Date(call.createdAt).toLocaleDateString()}</p>
        {call.assignedTo && (
          <p>Assigned: <strong className="text-[#2C2C2C]">{call.assignedTo}</strong></p>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {canEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsActionModalOpen(true);
              handleEditOpen();
            }}
            className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#2C2C2C] border border-gray-200 text-xs font-semibold rounded-md transition-colors text-center"
          >
            Edit
          </button>
        )}
        
        {canAssign && call.status !== 'COMPLETED' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsActionModalOpen(true);
              setShowAssign(true);
            }}
            className="flex-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold rounded-md transition-colors text-center"
          >
            {call.assignedTo ? 'Reassign' : 'Assign'}
          </button>
        )}
        
        {canComplete && call.status !== 'COMPLETED' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsActionModalOpen(true);
              handleCompleteClick();
            }}
            className="flex-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-md transition-colors text-center"
          >
            Complete
          </button>
        )}
      </div>

      {/* Assign Modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150" onClick={(e) => handleModalBackdropClick(e, 'assign')}>
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-[#E0E2E5]">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#E0E2E5]">
              <h2 className="text-xl font-bold text-[#2C2C2C]">{call.assignedTo ? 'Reassign Call' : 'Assign Call'}</h2>
              <button
                onClick={() => {
                  setShowAssign(false);
                  setSelectedWorker('');
                  setEngineerRemark('');
                  setIsActionModalOpen(false);
                }}
                className="text-[#666666] hover:text-[#2C2C2C] text-xl font-bold leading-none p-1"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">Select Engineer *</label>
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#E0E2E5] rounded-xl text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
              >
                <option value="">— Choose staff member —</option>
                {users.filter(u => u.role === 'ENGINEER' || u.role === 'ADMIN').map(u => (
                  <option key={u.id} value={u.username}>{u.username} ({u.role})</option>
                ))}
              </select>
            </div>
            
            {['HOST', 'ADMIN'].includes(user?.role) && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">Special Instructions (optional)</label>
                <textarea
                  value={engineerRemark}
                  onChange={(e) => setEngineerRemark(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E0E2E5] rounded-xl text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  rows="3"
                  placeholder="Notes for engineer..."
                />
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowAssign(false);
                  setSelectedWorker('');
                  setEngineerRemark('');
                  setIsActionModalOpen(false);
                }}
                className="flex-1 py-2.5 border border-[#E0E2E5] rounded-full text-[#2C2C2C] hover:bg-[#F0F2F5] text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={isAssigning || !selectedWorker}
                className={`flex-1 py-2.5 rounded-full font-semibold text-sm shadow-[0_4px_14px_rgba(255,46,70,0.25)] transition-all ${
                  isAssigning || !selectedWorker
                    ? 'bg-[#FF5A71] text-white cursor-not-allowed opacity-60' 
                    : 'bg-[#FF2E46] text-white hover:bg-[#E02038]'
                }`}
              >
                {isAssigning ? 'Saving...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div key={`edit-${call.id}`} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150" onClick={(e) => handleModalBackdropClick(e, 'edit')}>
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E0E2E5]">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#E0E2E5]">
              <h2 className="text-xl font-bold text-[#2C2C2C]">Edit Call Information</h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEdit(false);
                  setIsActionModalOpen(false);
                }}
                className="text-[#666666] hover:text-[#2C2C2C] text-xl font-bold leading-none p-1"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">Customer Name *</label>
                <input
                  type="text"
                  value={formData.customerName || ''}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-[#E0E2E5] rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-[#E0E2E5] rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">Category *</label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-[#E0E2E5] rounded-xl text-sm"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">Problem *</label>
                <textarea
                  value={formData.problem || ''}
                  onChange={(e) => setFormData({...formData, problem: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-[#E0E2E5] rounded-xl text-sm"
                  rows="3"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#E0E2E5]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEdit(false);
                    setIsActionModalOpen(false);
                  }}
                  className="flex-1 py-2.5 border border-[#E0E2E5] rounded-full text-[#2C2C2C] hover:bg-[#F0F2F5] text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-[#FF2E46] hover:bg-[#E02038] text-white py-2.5 rounded-full font-semibold text-sm shadow-[0_4px_14px_rgba(255,46,70,0.25)] transition-all"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showComplete && !showDCSelection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150" onClick={(e) => handleModalBackdropClick(e, 'complete')}>
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-[#E0E2E5]">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#E0E2E5]">
              <h2 className="text-xl font-bold text-[#2C2C2C]">Resolve Call</h2>
              <button
                onClick={() => {
                  setShowComplete(false);
                  setRemark('');
                  setVisitedRemark('');
                  setCompleteAction('complete');
                  setIsActionModalOpen(false);
                }}
                className="text-[#666666] hover:text-[#2C2C2C] text-xl font-bold leading-none p-1"
              >
                ✕
              </button>
            </div>
            
            <div className="flex gap-4 mb-4 p-3 bg-[#F8F9FA] rounded-xl border border-[#E0E2E5]">
              <label className="flex items-center cursor-pointer text-xs font-bold text-[#2C2C2C]">
                <input
                  type="radio"
                  name="completeAction"
                  value="complete"
                  checked={completeAction === 'complete'}
                  onChange={(e) => setCompleteAction(e.target.value)}
                  className="mr-2 text-[#FF2E46] focus:ring-[#FF2E46]"
                />
                Completed
              </label>
              <label className="flex items-center cursor-pointer text-xs font-bold text-[#2C2C2C]">
                <input
                  type="radio"
                  name="completeAction"
                  value="visited"
                  checked={completeAction === 'visited'}
                  onChange={(e) => setCompleteAction(e.target.value)}
                  className="mr-2 text-[#FF2E46] focus:ring-[#FF2E46]"
                />
                Visited (In Progress)
              </label>
            </div>
            
            <div className="mb-4">
              <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">
                {completeAction === 'complete' ? 'Completion Remark' : 'Visit Notes'}
              </label>
              <textarea
                value={completeAction === 'complete' ? remark : visitedRemark}
                onChange={(e) => completeAction === 'complete' ? setRemark(e.target.value) : setVisitedRemark(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#E0E2E5] rounded-xl text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                rows="3"
                placeholder={completeAction === 'complete' ? 'Resolution summary...' : 'Notes about this visit...'}
                required={completeAction === 'visited'}
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowComplete(false);
                  setRemark('');
                  setVisitedRemark('');
                  setCompleteAction('complete');
                  setIsActionModalOpen(false);
                }}
                className="flex-1 py-2.5 border border-[#E0E2E5] rounded-full text-[#2C2C2C] hover:bg-[#F0F2F5] text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteConfirm}
                disabled={isCompleting || (completeAction === 'visited' && !visitedRemark.trim())}
                className="flex-1 bg-[#FF2E46] hover:bg-[#E02038] text-white py-2.5 rounded-full font-semibold text-sm shadow-[0_4px_14px_rgba(255,46,70,0.25)] transition-all"
              >
                {isCompleting ? 'Processing...' : (completeAction === 'complete' ? 'Next →' : 'Save Visit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DC Selection Modal */}
      {showComplete && showDCSelection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-[#E0E2E5]">
            <h2 className="text-xl font-bold text-[#2C2C2C] mb-2">Delivery Challan Required?</h2>
            <p className="text-xs text-[#666666] mb-4">Select whether physical challan paperwork is needed for this resolution</p>
            
            <div className="flex gap-4 mb-4 p-3 bg-[#F8F9FA] rounded-xl border border-[#E0E2E5]">
              <label className="flex items-center cursor-pointer text-xs font-bold text-[#2C2C2C]">
                <input
                  type="radio"
                  name="dcSelection"
                  value="dc"
                  checked={dcRequired === true || dcRequired === undefined}
                  onChange={() => setDcRequired(true)}
                  className="mr-2 text-[#FF2E46] focus:ring-[#FF2E46]"
                />
                DC Required
              </label>
              <label className="flex items-center cursor-pointer text-xs font-bold text-[#2C2C2C]">
                <input
                  type="radio"
                  name="dcSelection"
                  value="nodc"
                  checked={dcRequired === false}
                  onChange={() => setDcRequired(false)}
                  className="mr-2 text-[#FF2E46] focus:ring-[#FF2E46]"
                />
                No DC
              </label>
            </div>
            
            {dcRequired && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">DC Notes (optional)</label>
                <textarea
                  value={dcRemark}
                  onChange={(e) => setDcRemark(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E0E2E5] rounded-xl text-sm"
                  rows="3"
                  placeholder="Parts or items involved..."
                />
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDCSelection(false);
                  setDcRequired(true);
                  setDcRemark('');
                }}
                className="flex-1 py-2.5 border border-[#E0E2E5] rounded-full text-[#2C2C2C] hover:bg-[#F0F2F5] text-sm font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className="flex-1 bg-[#FF2E46] hover:bg-[#E02038] text-white py-2.5 rounded-full font-semibold text-sm shadow-[0_4px_14px_rgba(255,46,70,0.25)] transition-all"
              >
                {isCompleting ? 'Saving...' : 'Finalize Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150" onClick={(e) => e.target === e.currentTarget && setShowDetails(false)}>
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E0E2E5]">
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-[#E0E2E5]">
              <h2 className="text-xl font-bold text-[#2C2C2C]">Service Call Details</h2>
              <button 
                onClick={() => setShowDetails(false)} 
                className="text-[#666666] hover:text-[#2C2C2C] text-xl font-bold leading-none p-1"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E0E2E5]">
                <label className="block text-xs font-bold text-[#666666] uppercase mb-1">Customer</label>
                <div className="font-bold text-[#2C2C2C]">{call.customerName}</div>
              </div>
              <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E0E2E5]">
                <label className="block text-xs font-bold text-[#666666] uppercase mb-1">Phone</label>
                <div className="font-bold text-[#2C2C2C]">{call.phone}</div>
              </div>
              <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E0E2E5]">
                <label className="block text-xs font-bold text-[#666666] uppercase mb-1">Category</label>
                <div className="font-semibold text-[#2C2C2C]">{call.category}</div>
              </div>
              <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E0E2E5]">
                <label className="block text-xs font-bold text-[#666666] uppercase mb-1">Status</label>
                <div className="font-bold text-[#FF2E46]">{call.status}</div>
              </div>
              <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E0E2E5] sm:col-span-2">
                <label className="block text-xs font-bold text-[#666666] uppercase mb-1">Problem</label>
                <div className="text-[#2C2C2C]">{call.problem}</div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E0E2E5] flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="bg-[#2C2C2C] hover:bg-[#1A1A1A] text-white px-6 py-2.5 rounded-full text-xs font-semibold transition-all"
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

export default CallCard;