import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';

const UserManagement = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showSecretModal, setShowSecretModal] = useState(true);
  const [showActionSecretModal, setShowActionSecretModal] = useState(false);
  const [actionSecretPassword, setActionSecretPassword] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [secretPassword, setSecretPassword] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'USER',
    secretPassword: ''
  });
  const [editFormData, setEditFormData] = useState({
    username: '',
    password: '',
    role: 'USER',
    secretPassword: ''
  });
  
  const { users, fetchUsers, createUser, updateUser, deleteUser, user, token } = useAuthStore();

  useEffect(() => {
    if (hasAccess) {
      fetchUsers();
    }
  }, [hasAccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.role === 'HOST' && !formData.secretPassword.trim()) {
      alert('Secret password is required for HOST role');
      return;
    }
    setPendingAction({ type: 'create', data: formData });
    setShowActionSecretModal(true);
  };

  const handleEdit = (userToEdit) => {
    setEditingUser(userToEdit);
    setEditFormData({
      username: userToEdit.username,
      password: '',
      role: userToEdit.role,
      secretPassword: ''
    });
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editFormData.role === 'HOST' && editingUser.role !== 'HOST' && !editFormData.secretPassword.trim()) {
      alert('Secret password is required when promoting to HOST role');
      return;
    }
    const updateData = {
      username: editFormData.username,
      role: editFormData.role
    };
    if (editFormData.password) {
      updateData.password = editFormData.password;
    }
    if (editFormData.secretPassword) {
      updateData.secretPassword = editFormData.secretPassword;
    }
    setPendingAction({ type: 'edit', data: updateData, userId: editingUser.id });
    setShowActionSecretModal(true);
  };

  const handleDelete = async (userToDelete) => {
    if (window.confirm(`Are you sure you want to delete user "${userToDelete.username}"? This action cannot be undone.`)) {
      setPendingAction({ type: 'delete', userId: userToDelete.id });
      setShowActionSecretModal(true);
    }
  };

  const verifyActionSecret = async () => {
    if (!actionSecretPassword.trim()) {
      alert('Please enter the secret password');
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/verify-secret`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ secretPassword: actionSecretPassword })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.hasAccess) {
        // Execute the pending action
        try {
          if (pendingAction.type === 'create') {
            await createUser(pendingAction.data);
            setFormData({ username: '', password: '', role: 'USER', secretPassword: '' });
            setShowAddForm(false);
          } else if (pendingAction.type === 'edit') {
            const result = await updateUser(pendingAction.userId, pendingAction.data);
            
            // Check if user was changed to HOST and show feedback about call unassignment
            if (pendingAction.data.role === 'HOST' && editingUser.role !== 'HOST') {
              alert(`User "${pendingAction.data.username}" has been promoted to HOST. Any assigned calls have been automatically unassigned and set to PENDING status.`);
            } else {
              alert(`User "${pendingAction.data.username}" has been updated successfully.`);
            }
            
            setShowEditForm(false);
            setEditingUser(null);
          } else if (pendingAction.type === 'delete') {
            await deleteUser(pendingAction.userId);
            alert(`User has been deleted successfully. Any assigned calls have been automatically unassigned and set to PENDING status.`);
          }
        } catch (error) {
          console.error('Error executing action:', error);
          alert('Failed to execute action. Please try again.');
        }
        
        setShowActionSecretModal(false);
        setActionSecretPassword('');
        setPendingAction(null);
      } else {
        alert('Invalid secret password');
        setActionSecretPassword('');
      }
    } catch (error) {
      alert('Failed to verify secret password');
    }
  };

  const verifySecretPassword = async () => {
    if (!secretPassword.trim()) {
      alert('Please enter the secret password');
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/verify-secret`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ secretPassword })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.hasAccess) {
        setHasAccess(true);
        setShowSecretModal(false);
      } else {
        alert('Invalid secret password or insufficient permissions');
        setSecretPassword('');
      }
    } catch (error) {
      alert('Failed to verify secret password');
    }
  };

  const canCreateAdmin = user?.role === 'HOST';

  if (!hasAccess) {
    return (
      <div className="max-w-6xl mx-auto">
        {showSecretModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">User Management Access</h2>
              <p className="text-gray-600 mb-4">
                Enter your secret password to access user management:
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Secret Password *</label>
                <input
                  type="password"
                  value={secretPassword}
                  onChange={(e) => setSecretPassword(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter secret password"
                  onKeyPress={(e) => e.key === 'Enter' && verifySecretPassword()}
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={verifySecretPassword}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium"
                >
                  Verify
                </button>
                <button
                  onClick={() => window.history.back()}
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
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm sm:text-base w-full sm:w-auto"
        >
          + Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                  {u.username}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    u.role === 'HOST' ? 'bg-purple-100 text-purple-800' :
                    u.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(u)}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Add New User</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                >
                  <option value="USER">Worker (USER)</option>
                  {canCreateAdmin && <option value="ADMIN">Admin</option>}
                  {user?.role === 'HOST' && <option value="HOST">Host</option>}
                </select>
              </div>

              {formData.role === 'HOST' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Secret Password *</label>
                  <input
                    type="password"
                    value={formData.secretPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, secretPassword: e.target.value }))}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Enter secret password for HOST"
                    required={formData.role === 'HOST'}
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditForm && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Edit User</h2>
              <button
                onClick={() => setShowEditForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Username *</label>
                <input
                  type="text"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter new password or leave blank"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Role *</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                >
                  <option value="USER">Worker (USER)</option>
                  <option value="ADMIN">Admin</option>
                  <option value="HOST">Host</option>
                </select>
              </div>

              {editFormData.role === 'HOST' && editingUser.role !== 'HOST' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Secret Password *</label>
                  <input
                    type="password"
                    value={editFormData.secretPassword}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, secretPassword: e.target.value }))}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Enter secret password for HOST"
                    required
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm"
                >
                  Update User
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Secret Password Modal */}
      {showActionSecretModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Action</h2>
            <p className="text-gray-600 mb-4">
              Enter your secret password to confirm this action:
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Secret Password *</label>
              <input
                type="password"
                value={actionSecretPassword}
                onChange={(e) => setActionSecretPassword(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Enter secret password"
                onKeyPress={(e) => e.key === 'Enter' && verifyActionSecret()}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={verifyActionSecret}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowActionSecretModal(false);
                  setActionSecretPassword('');
                  setPendingAction(null);
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

export default UserManagement;