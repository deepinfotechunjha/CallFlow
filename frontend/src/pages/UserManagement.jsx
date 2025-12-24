import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import useCallStore from '../store/callStore';
import useSocket from '../hooks/useSocket';
import useClickOutside from '../hooks/useClickOutside';
import ConfirmDialog from '../components/ConfirmDialog';
import ExportModal from '../components/ExportModal';
import { exportUsersToExcel } from '../utils/excelExport';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showSecretModal, setShowSecretModal] = useState(true);
  const [showActionSecretModal, setShowActionSecretModal] = useState(false);
  const [actionSecretPassword, setActionSecretPassword] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [secretPassword, setSecretPassword] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: null });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showHostLimitAlert, setShowHostLimitAlert] = useState(false);
  const [hostLimitMessage, setHostLimitMessage] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState({});
  const [isConfirming, setIsConfirming] = useState(false);
  const [showWrongPasswordAlert, setShowWrongPasswordAlert] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'ENGINEER',
    secretPassword: ''
  });
  const [editFormData, setEditFormData] = useState({
    username: '',
    password: '',
    role: 'ENGINEER',
    secretPassword: ''
  });
  
  const { users, fetchUsers, createUser, updateUser, deleteUser, user } = useAuthStore();
  const { calls } = useCallStore();
  
  // Initialize WebSocket connection
  useSocket();

  const secretModalRef = useClickOutside(() => {
    if (showSecretModal) window.history.back();
  });
  const addModalRef = useClickOutside(() => {
    setShowAddForm(false);
    setIsCreating(false);
  });
  const editModalRef = useClickOutside(() => {
    setShowEditForm(false);
    setIsEditing(false);
  });
  const actionSecretModalRef = useClickOutside(() => {
    setShowActionSecretModal(false);
    setActionSecretPassword('');
    setPendingAction(null);
    setIsCreating(false);
    setIsEditing(false);
    setIsDeleting({});
    setIsConfirming(false);
  });
  const hostLimitModalRef = useClickOutside(() => setShowHostLimitAlert(false));
  const successModalRef = useClickOutside(() => setShowSuccessAlert(false));

  useEffect(() => {
    if (hasAccess) {
      fetchUsers();
    }
  }, [hasAccess, fetchUsers]);

  useEffect(() => {
    // Check if current user still exists in the users list
    if (hasAccess && users.length > 0 && user) {
      const userExists = users.find(u => u.id === user.id);
      if (!userExists) {
        // Current user was deleted, logout
        alert('Your account has been removed. You will be logged out.');
        window.location.href = '/login';
      }
    }
  }, [users, user, hasAccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.role === 'HOST' && !formData.secretPassword.trim()) {
      setAlertMessage('Secret password is required for HOST role');
      setShowAlert(true);
      return;
    }
    if (formData.role === 'HOST') {
      const hostCount = users.filter(u => u.role === 'HOST').length;
      if (hostCount >= 3) {
        setHostLimitMessage('Maximum 3 HOSTs allowed. Cannot create more HOST users.');
        setShowHostLimitAlert(true);
        return;
      }
    }
    setIsCreating(true);
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
      setAlertMessage('Secret password is required when promoting to HOST role');
      setShowAlert(true);
      return;
    }
    if (editFormData.role === 'HOST' && editingUser.role !== 'HOST') {
      const hostCount = users.filter(u => u.role === 'HOST').length;
      if (hostCount >= 3) {
        setHostLimitMessage('Maximum 3 HOSTs allowed. Cannot promote more users to HOST.');
        setShowHostLimitAlert(true);
        return;
      }
    }
    const updateData = {
      role: editFormData.role
    };
    if (editFormData.password) {
      updateData.password = editFormData.password;
    }
    if (editFormData.secretPassword) {
      updateData.secretPassword = editFormData.secretPassword;
    }
    setIsEditing(true);
    setPendingAction({ type: 'edit', data: updateData, userId: editingUser.id });
    setShowActionSecretModal(true);
  };

  const handleDelete = async (userToDelete) => {
    if (userToDelete.role === 'HOST') {
      const hostCount = users.filter(u => u.role === 'HOST').length;
      if (hostCount <= 1) {
        setHostLimitMessage('Cannot delete the last HOST. At least 1 HOST is required.');
        setShowHostLimitAlert(true);
        return;
      }
    }
    setConfirmConfig({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete user "${userToDelete.username}"? This action cannot be undone.`,
      onConfirm: () => {
        setIsDeleting(prev => ({ ...prev, [userToDelete.id]: true }));
        setPendingAction({ type: 'delete', userId: userToDelete.id });
        setShowActionSecretModal(true);
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const verifyActionSecret = async () => {
    if (!actionSecretPassword.trim()) {
      setAlertMessage('Please enter the secret password');
      setShowAlert(true);
      setIsConfirming(false);
      return;
    }
    
    if (isConfirming) return;
    setIsConfirming(true);
    
    try {
      const response = await apiClient.post('/auth/verify-secret', {
        secretPassword: actionSecretPassword
      });
      
      const data = response.data;
      
      if (data.success && data.hasAccess) {
        // Check if deleting current user
        if (pendingAction.type === 'delete' && pendingAction.userId === user.id) {
          setAlertMessage('You cannot delete your own account');
          setShowAlert(true);
          setShowActionSecretModal(false);
          setActionSecretPassword('');
          setPendingAction(null);
          setIsCreating(false);
          setIsEditing(false);
          setIsDeleting({});
          setIsConfirming(false);
          return;
        }
        
        // Execute the pending action
        try {
          if (pendingAction.type === 'create') {
            await createUser(pendingAction.data);
            setSuccessMessage(`User "${pendingAction.data.username}" has been created successfully.`);
            setShowSuccessAlert(true);
            setFormData({ username: '', password: '', role: 'USER', secretPassword: '' });
            setShowAddForm(false);
          } else if (pendingAction.type === 'edit') {
            const result = await updateUser(pendingAction.userId, pendingAction.data);
            
            // Check if user was changed to HOST and show feedback about call unassignment
            if (pendingAction.data.role === 'HOST' && editingUser.role !== 'HOST') {
              setSuccessMessage(`User "${editingUser.username}" has been promoted to HOST. Any assigned calls have been automatically unassigned and set to PENDING status.`);
              setShowSuccessAlert(true);
            } else {
              setSuccessMessage(`User "${editingUser.username}" has been updated successfully.`);
              setShowSuccessAlert(true);
            }
            
            setShowEditForm(false);
            setEditingUser(null);
          } else if (pendingAction.type === 'delete') {
            await deleteUser(pendingAction.userId);
            setSuccessMessage('User has been deleted successfully. Any assigned calls have been automatically unassigned and set to PENDING status.');
            setShowSuccessAlert(true);
          }
        } catch (error) {
          const errorMessage = error?.response?.data?.error || error?.message || 'Failed to execute action. Please try again.';
          setAlertMessage(errorMessage);
          setShowAlert(true);
        }
        
        setShowActionSecretModal(false);
        setActionSecretPassword('');
        setPendingAction(null);
        setIsCreating(false);
        setIsEditing(false);
        setIsDeleting({});
        setIsConfirming(false);
      } else {
        setShowActionSecretModal(false);
        setActionSecretPassword('');
        setIsConfirming(false);
        setShowWrongPasswordAlert(true);
      }
    } catch (error) {
      setShowActionSecretModal(false);
      setActionSecretPassword('');
      setIsConfirming(false);
      setShowWrongPasswordAlert(true);
    }
  };

  const [showInitialWrongPassword, setShowInitialWrongPassword] = useState(false);

  const verifySecretPassword = async () => {
    if (!secretPassword.trim()) {
      setAlertMessage('Please enter the secret password');
      setShowAlert(true);
      return;
    }
    
    try {
      const response = await apiClient.post('/auth/verify-secret', {
        secretPassword
      });
      
      const data = response.data;
      
      if (data.success && data.hasAccess) {
        setHasAccess(true);
        setShowSecretModal(false);
      } else {
        setShowSecretModal(false);
        setSecretPassword('');
        setShowInitialWrongPassword(true);
      }
    } catch (error) {
      setShowSecretModal(false);
      setSecretPassword('');
      setShowInitialWrongPassword(true);
    }
  };

  const canCreateAdmin = user?.role === 'HOST';

  const handleExport = async (exportType, password) => {
    try {
      const response = await apiClient.post('/auth/verify-secret', {
        secretPassword: password
      });
      
      const data = response.data;
      
      if (data.success && data.hasAccess) {
        exportUsersToExcel(users, calls);
        toast.success(`Successfully exported ${users.length} users to Excel`);
        setShowExportModal(false);
      } else {
        toast.error('Invalid secret password');
      }
    } catch (error) {
      toast.error('Failed to verify password');
    }
  };

  if (!hasAccess) {
    return (
      <div className="max-w-6xl mx-auto">
        {showSecretModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div ref={secretModalRef} className="bg-white rounded-lg p-6 w-full max-w-md">
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

        {showInitialWrongPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-red-600">Invalid Secret</h2>
              <p className="text-gray-700 mb-6">The secret you entered is incorrect. Please try again.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowInitialWrongPassword(false);
                    setShowSecretModal(true);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium"
                >
                  Retry
                </button>
                <button
                  onClick={() => {
                    setShowInitialWrongPassword(false);
                    window.history.back();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={showAlert}
          title="Notice"
          message={alertMessage}
          onConfirm={() => setShowAlert(false)}
          onCancel={() => setShowAlert(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">Engineer Management 👥</h1>
          <p className="text-gray-600">Manage team members and their roles</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {user?.role === 'HOST' && (
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 font-medium text-sm sm:text-base flex items-center gap-2 shadow-sm transition-all"
            >
              📊 Export
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium text-sm sm:text-base shadow-sm transition-all"
          >
            + Add Engineer
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span>👥</span> Team Members
          </h2>
        </div>
        <div className="overflow-x-auto">
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
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👤</span>
                      {u.username}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
                      u.role === 'HOST' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                      u.role === 'ADMIN' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      'bg-green-100 text-green-800 border-green-200'
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
                        className="bg-blue-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-600 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={isDeleting[u.id]}
                        className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                          isDeleting[u.id]
                            ? 'bg-red-400 text-white cursor-not-allowed'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        {isDeleting[u.id] ? 'Pending...' : 'Remove'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={addModalRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Add New Engineer</h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setIsCreating(false);
                }}
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
                  <option value="ENGINEER">Engineer</option>
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
                  disabled={isCreating}
                  className={`flex-1 py-2 rounded text-sm ${
                    isCreating 
                      ? 'bg-blue-400 text-white cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isCreating ? 'Pending...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setIsCreating(false);
                  }}
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
          <div ref={editModalRef} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Edit Engineer</h2>
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setIsEditing(false);
                }}
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
                  readOnly
                  className="w-full p-2 border rounded bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
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
                  <option value="ENGINEER">Engineer</option>
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
                  disabled={isEditing}
                  className={`flex-1 py-2 rounded text-sm ${
                    isEditing 
                      ? 'bg-blue-400 text-white cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isEditing ? 'Pending...' : 'Update'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setIsEditing(false);
                  }}
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
          <div ref={actionSecretModalRef} className="bg-white rounded-lg p-6 w-full max-w-md">
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
                disabled={isConfirming}
                className={`flex-1 py-2 rounded font-medium ${
                  isConfirming
                    ? 'bg-blue-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isConfirming ? 'Pending...' : 'Confirm'}
              </button>
              <button
                onClick={() => {
                  setShowActionSecretModal(false);
                  setActionSecretPassword('');
                  setPendingAction(null);
                  setIsCreating(false);
                  setIsEditing(false);
                  setIsDeleting({});
                  setIsConfirming(false);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => {
          setShowConfirm(false);
          setIsDeleting({});
        }}
      />

      <ConfirmDialog
        isOpen={showAlert}
        title="Notice"
        message={alertMessage}
        onConfirm={() => setShowAlert(false)}
        onCancel={() => setShowAlert(false)}
      />

      {/* HOST Limit Alert Modal */}
      {showHostLimitAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={hostLimitModalRef} className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">HOST Limit Reached</h2>
            <p className="text-gray-700 mb-6">{hostLimitMessage}</p>
            <button
              onClick={() => setShowHostLimitAlert(false)}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Success Alert Modal */}
      {showSuccessAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={successModalRef} className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-green-600">Success</h2>
            <p className="text-gray-700 mb-6">{successMessage}</p>
            <button
              onClick={() => setShowSuccessAlert(false)}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          totalCount={users.length}
          filteredCount={users.length}
          title="Export Users to Excel"
        />
      )}

      {/* Wrong Password Alert - Action Confirmation */}
      {showWrongPasswordAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">Invalid Secret</h2>
            <p className="text-gray-700 mb-6">The secret you entered is incorrect. Please try again.</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowWrongPasswordAlert(false);
                  setShowActionSecretModal(true);
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium"
              >
                Retry
              </button>
              <button
                onClick={() => {
                  setShowWrongPasswordAlert(false);
                  setPendingAction(null);
                  setIsCreating(false);
                  setIsEditing(false);
                  setIsDeleting({});
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