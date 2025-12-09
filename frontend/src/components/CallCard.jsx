import React, { useState, useEffect } from 'react';
import useCallStore from '../store/callStore';
import useAuthStore from '../store/authStore';
import useCategoryStore from '../store/categoryStore';
import useClickOutside from '../hooks/useClickOutside';

const CallCard = ({ call }) => {
  const [showAssign, setShowAssign] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [remark, setRemark] = useState('');
  const [engineerRemark, setEngineerRemark] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    address: '',
    problem: '',
    category: ''
  });
  
  const { updateCall } = useCallStore();
  const { user, users, token } = useAuthStore();
  const { categories, fetchCategories } = useCategoryStore();

  const assignModalRef = useClickOutside(() => {
    setShowAssign(false);
    setSelectedWorker('');
    setEngineerRemark('');
  });
  const editModalRef = useClickOutside(() => setShowEdit(false));
  const completeModalRef = useClickOutside(() => {
    setShowComplete(false);
    setRemark('');
  });
  
  const canAssign = ['HOST', 'ADMIN'].includes(user?.role) && call.status !== 'COMPLETED';
  const canEdit = user?.role === 'HOST' && call.status !== 'COMPLETED';
  const canComplete = call.assignedTo === user?.username || ['HOST', 'ADMIN'].includes(user?.role);

  useEffect(() => {
    fetchCategories();
  }, []);

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

 const handleAssign = async () => {
  if (selectedWorker) {
    if (!token) {
      alert('Please login to assign calls');
      return;
    }
    
    try {
      console.log('Using token from store:', token);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/calls/${call.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          assignee: selectedWorker,
          engineerRemark: engineerRemark || null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Assignment failed:', errorData);
        alert(`Assignment failed: ${errorData.error || 'Unknown error'}`);
        return;
      }
      
      // Success - reload the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Assignment failed:', error);
      alert('Assignment failed. Please try again.');
    }
    setShowAssign(false);
    setSelectedWorker('');
    setEngineerRemark('');
  }
};

  const handleComplete = async () => {
    if (!token) {
      alert('Please login to complete calls');
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/calls/${call.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ remark })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Complete failed:', errorData);
        alert(`Complete failed: ${errorData.error || 'Unknown error'}`);
        return;
      }
      
      window.location.reload();
    } catch (error) {
      console.error('Complete failed:', error);
      alert('Failed to complete call. Please try again.');
    }
  };

  const handleCompleteClick = () => {
    setShowComplete(true);
  };

  const handleCompleteConfirm = () => {
    handleComplete();
    setShowComplete(false);
    setRemark('');
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
    } catch (error) {
      // Error handling is done in updateCall
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditOpen = () => {
    setShowEdit(true);
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
      // Show both PENDING and ASSIGNED tags for assigned calls
      tags.push({ label: 'PENDING', color: 'bg-yellow-100 text-yellow-800' });
      tags.push({ label: 'ASSIGNED', color: 'bg-blue-100 text-blue-800' });
    } else if (call.status === 'COMPLETED') {
      tags.push({ label: 'COMPLETED', color: 'bg-green-100 text-green-800' });
    }
    
    return tags;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 border-l-4 border-blue-500">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg break-words">{call?.customerName}</h3>
          <p className="text-gray-600 text-sm break-all">{call?.phone}</p>
          {call?.email && <p className="text-gray-600 text-xs sm:text-sm break-all">{call?.email}</p>}
        </div>
        <div>
          <div className="flex gap-1 flex-wrap mb-1">
            {getStatusTags(call).map((tag, index) => (
              <span 
                key={index}
                className={`px-2 py-1 rounded-full text-xs font-medium ${tag.color}`}
              >
                {tag.label}
              </span>
            ))}
          </div>
          {call.callCount > 1 && (
            <div className="flex">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                call.callCount === 2 ? 'bg-yellow-100 text-yellow-800' :
                call.callCount === 3 ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                Called {call.callCount}x
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-3">
        <p className="text-xs sm:text-sm text-gray-700 mb-1 break-words"><strong>Category:</strong> {call.category}</p>
        <p className="text-xs sm:text-sm text-gray-700 mb-2 break-words"><strong>Problem:</strong> {call.problem}</p>
        {call?.address && <p className="text-xs sm:text-sm text-gray-600 break-words"><strong>Address:</strong> {call?.address}</p>}
      </div>

      <div className="text-xs text-gray-500 mb-3 break-words">
        <p className="break-words">Created by: {call.createdBy} on {new Date(call.createdAt).toLocaleString()}</p>
        {call.assignedTo && (
          <p className="break-words">
            Assigned to: <strong>{call.assignedTo}</strong>
            {call.assignedAt && ` on ${new Date(call.assignedAt).toLocaleString()}`}
            {call.assignedBy && ` by ${call.assignedBy}`}
          </p>
        )}
        {call.completedBy && (
          <>
            <p className="break-words">Completed by: {call.completedBy} on {new Date(call.completedAt).toLocaleString()}</p>
            {call.remark && <p className="mt-1 break-words"><strong>Remark:</strong> {call.remark}</p>}
          </>
        )}
      </div>

      {call.engineerRemark && (
        <div className="text-xs text-gray-500 mb-3">
          <p className="break-words"><strong>Engineer Instructions:</strong> {call.engineerRemark}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <button
            onClick={handleEditOpen}
            className="px-2 sm:px-3 py-1 bg-orange-600 text-white text-xs sm:text-sm rounded hover:bg-orange-700"
          >
            Edit
          </button>
        )}
        
        {canAssign && call.status !== 'COMPLETED' && (
          <button
            onClick={() => setShowAssign(true)}
            className="px-2 sm:px-3 py-1 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700"
          >
            {call.assignedTo ? 'Reassign' : 'Assign'}
          </button>
        )}
        
        {canComplete && call.status !== 'COMPLETED' && (
          <button
            onClick={handleCompleteClick}
            className="px-2 sm:px-3 py-1 bg-green-600 text-white text-xs sm:text-sm rounded hover:bg-green-700"
          >
            Mark Complete
          </button>
        )}
      </div>

      {showAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={assignModalRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{call.assignedTo ? 'Reassign Call' : 'Assign Call'}</h2>
            <p className="text-gray-600 mb-4">
              {call.assignedTo ? `Currently assigned to: ${call.assignedTo}` : 'Select a worker to assign this call to:'}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Select Worker *</label>
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Worker</option>
                {users.filter(u => u.role === 'USER').map(u => (
                  <option key={u.id} value={u.username}>{u.username}</option>
                ))}
              </select>
            </div>
            
            {['HOST', 'ADMIN'].includes(user?.role) && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Engineer Instructions (optional)</label>
                <textarea
                  value={engineerRemark}
                  onChange={(e) => setEngineerRemark(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Add any special instructions for the engineer..."
                />
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={handleAssign}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium"
              >
                {call.assignedTo ? 'Reassign' : 'Assign'}
              </button>
              <button
                onClick={() => {
                  setShowAssign(false);
                  setSelectedWorker('');
                  setEngineerRemark('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <div key={`edit-${call.id}`} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={editModalRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Call Details</h2>
            
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer Name *</label>
                <input
                  key={`name-${call.id}`}
                  type="text"
                  value={formData.customerName || ''}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <input
                  key={`phone-${call.id}`}
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  key={`email-${call.id}`}
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  key={`address-${call.id}`}
                  value={formData.address || ''}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
                  rows="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  key={`category-${call.id}`}
                  value={formData.category || ''}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
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
                  key={`problem-${call.id}`}
                  value={formData.problem || ''}
                  onChange={(e) => setFormData({...formData, problem: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
                  rows="3"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className={`flex-1 py-2 rounded font-medium ${
                    isUpdating 
                      ? 'bg-orange-400 text-white cursor-not-allowed' 
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {isUpdating ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={completeModalRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Complete Call</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to mark this call as completed?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Remark (optional)</label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
                rows="3"
                placeholder="Add any notes about the completion..."
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleCompleteConfirm}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowComplete(false);
                  setRemark('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallCard;