import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useCallStore from '../store/callStore';
import useBrandStore from '../store/brandStore';
import useSocket from '../hooks/useSocket';
import useClickOutside from '../hooks/useClickOutside';
import ConfirmDialog from '../components/ConfirmDialog';
import ExportModal from '../components/ExportModal';
import { exportUsersToExcel } from '../utils/excelExport';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const navigate = useNavigate();
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
    email: '',
    phone: '',
    role: 'ENGINEER',
    secretPassword: '',
    brandName: ''
  });
  const [editFormData, setEditFormData] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
    role: 'ENGINEER',
    secretPassword: '',
    brandName: ''
  });
  
  const { users, fetchUsers, createUser, updateUser, deleteUser, user } = useAuthStore();
  const { calls } = useCallStore();
  const { brands, fetchBrands } = useBrandStore();
  
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
      fetchBrands();
    }
  }, [hasAccess, fetchUsers, fetchBrands]);

  useEffect(() => {
    if (hasAccess && users.length > 0 && user) {
      const userExists = users.find(u => u.id === user.id);
      if (!userExists) {
        alert('Your account has been removed. You will be logged out.');
        window.location.href = '/login';
      }
    }
  }, [users, user, hasAccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.email || !formData.phone) {
      setAlertMessage('Username, password, email, and phone are required');
      setShowAlert(true);
      return;
    }
    if (formData.role === 'COMPANY_BASED_ACCESS' && !formData.brandName.trim()) {
      setAlertMessage('Brand name is required for Company Based Access role');
      setShowAlert(true);
      return;
    }
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
      email: userToEdit.email || '',
      phone: userToEdit.phone || '',
      role: userToEdit.role,
      secretPassword: '',
      brandName: userToEdit.brandName || ''
    });
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.email || !editFormData.phone) {
      setAlertMessage('Email and phone are required');
      setShowAlert(true);
      return;
    }
    if (editFormData.role === 'COMPANY_BASED_ACCESS' && !editFormData.brandName.trim()) {
      setAlertMessage('Brand name is required for Company Based Access role');
      setShowAlert(true);
      return;
    }
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
      role: editFormData.role,
      email: editFormData.email,
      phone: editFormData.phone
    };
    if (editFormData.role === 'COMPANY_BASED_ACCESS') {
      updateData.brandName = editFormData.brandName.trim();
    }
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
        
        try {
          if (pendingAction.type === 'create') {
            await createUser(pendingAction.data);
            setSuccessMessage(`User "${pendingAction.data.username}" has been created successfully.`);
            setShowSuccessAlert(true);
            setFormData({ username: '', password: '', email: '', phone: '', role: 'ENGINEER', secretPassword: '', brandName: '' });
            setShowAddForm(false);
          } else if (pendingAction.type === 'edit') {
            await updateUser(pendingAction.userId, pendingAction.data);
            
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
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {showSecretModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div ref={secretModalRef} className="bg-white rounded-xl p-6 sm:p-8 w-full max-w-md shadow-lg border border-[#E0E2E5]">
              <div className="text-center mb-6">
                <span className="inline-block text-[#FF2E46] text-[11px] font-bold uppercase tracking-widest bg-[#FFE8EB] px-2.5 py-1 rounded-md mb-2 border border-[#FF2E46]/20">
                  SECURITY GATE
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#2C2C2C]">User Management Access</h2>
                <p className="text-xs sm:text-sm text-[#666666] mt-1">
                  Enter your HOST secret password to unlock staff administration
                </p>
              </div>
              
              <div className="mb-5">
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">Secret Password <span className="text-[#FF2E46]">*</span></label>
                <input
                  type="password"
                  value={secretPassword}
                  onChange={(e) => setSecretPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E0E2E5] rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  placeholder="Enter secret password"
                  onKeyPress={(e) => e.key === 'Enter' && verifySecretPassword()}
                  autoFocus
                />
              </div>
              
              <div className="flex gap-2.5 mb-4">
                <button
                  onClick={() => window.history.back()}
                  className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={verifySecretPassword}
                  className="flex-1 bg-[#FF2E46] hover:bg-[#FF5A71] text-white py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-all"
                >
                  Verify Access
                </button>
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => {
                    setShowSecretModal(false);
                    navigate('/forgot-password');
                  }}
                  className="text-xs text-[#666666] hover:text-[#FF2E46] underline transition-colors"
                >
                  Forgot Secret Password?
                </button>
              </div>
            </div>
          </div>
        )}

        {showInitialWrongPassword && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 sm:p-8 w-full max-w-md shadow-lg border border-[#E0E2E5]">
              <div className="w-10 h-10 rounded-lg bg-[#FFE8EB] text-[#FF2E46] flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                ✕
              </div>
              <h2 className="text-lg font-bold text-center text-[#2C2C2C] mb-1.5">Invalid Secret Password</h2>
              <p className="text-xs sm:text-sm text-[#666666] text-center mb-5">The secret key you entered is incorrect. Please verify and try again.</p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => {
                    setShowInitialWrongPassword(false);
                    window.history.back();
                  }}
                  className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowInitialWrongPassword(false);
                    setShowSecretModal(true);
                  }}
                  className="flex-1 bg-[#FF2E46] hover:bg-[#FF5A71] text-white py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-all"
                >
                  Retry
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
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-white p-5 sm:p-6 rounded-xl border border-[#E0E2E5] shadow-xs">
        <div>
          <span className="inline-block text-[#FF2E46] text-[11px] font-bold uppercase tracking-widest bg-[#FFE8EB] px-2.5 py-1 rounded-md mb-2 border border-[#FF2E46]/20">
            TEAM & ACCESS CONTROL
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C]">Role Management</h1>
          <p className="text-[#666666] text-xs sm:text-sm mt-1">Manage team members, roles, credentials, and access permissions</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {user?.role === 'HOST' && (
            <button
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center justify-center gap-2 bg-[#2C2C2C] hover:bg-[#1A1A1A] text-white px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-all flex-1 sm:flex-initial"
            >
              <svg className="w-4 h-4 text-[#FF2E46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Users
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center gap-2 bg-[#FF2E46] hover:bg-[#FF5A71] text-white px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-all flex-1 sm:flex-initial"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Users Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-xs border border-[#E0E2E5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E0E2E5]">
            <thead className="bg-[#2C2C2C]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Username</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Email</th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Role</th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Created At</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#F0F2F5]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#F8F9FA] transition-colors">
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs sm:text-sm font-bold text-[#2C2C2C]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-[#FFE8EB] text-[#FF2E46] font-bold text-xs flex items-center justify-center">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      {u.username}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-[#666666]">
                    {u.email || 'N/A'}
                  </td>
                  <td className="hidden lg:table-cell px-4 py-3.5 whitespace-nowrap text-xs text-[#666666]">
                    {u.phone || 'N/A'}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-md border ${
                      u.role === 'HOST' ? 'bg-[#FFE8EB] text-[#FF2E46] border-[#FF2E46]/30' :
                      u.role === 'ADMIN' ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]' :
                      u.role === 'SALES_EXECUTIVE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      u.role === 'SALES_ADMIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      u.role === 'ACCOUNTANT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      u.role === 'COMPANY_PAYROLL' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                      u.role === 'TALLY_CALLER' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell px-4 py-3.5 whitespace-nowrap text-xs text-[#666666]">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEdit(u)}
                        className="bg-gray-100 hover:bg-gray-200 text-[#2C2C2C] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={isDeleting[u.id]}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                          isDeleting[u.id]
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
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

      {/* Users Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {users.map((u) => (
          <div key={u.id} className="bg-white rounded-xl shadow-xs border border-[#E0E2E5] p-4">
            <div className="flex items-start justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[#FFE8EB] text-[#FF2E46] font-bold text-xs flex items-center justify-center">
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-[#2C2C2C] text-sm">{u.username}</h3>
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md border mt-0.5 ${
                    u.role === 'HOST' ? 'bg-[#FFE8EB] text-[#FF2E46] border-[#FF2E46]/30' :
                    u.role === 'ADMIN' ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]' :
                    'bg-gray-50 text-gray-700 border-gray-200'
                  }`}>
                    {u.role.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-1 mb-3 text-xs text-[#666666]">
              <div>Email: {u.email || 'N/A'}</div>
              <div>Phone: {u.phone || 'N/A'}</div>
              <div>Created: {new Date(u.createdAt).toLocaleDateString()}</div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(u)}
                className="flex-1 bg-gray-100 text-[#2C2C2C] py-1.5 rounded-md text-xs font-semibold hover:bg-gray-200 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(u)}
                disabled={isDeleting[u.id]}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  isDeleting[u.id]
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                }`}
              >
                {isDeleting[u.id] ? 'Pending...' : 'Remove'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add User Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div ref={addModalRef} className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-lg shadow-lg border border-[#E0E2E5] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-[#E0E2E5]">
              <h2 className="text-base font-bold text-[#2C2C2C]">Add New Staff Member</h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setIsCreating(false);
                }}
                className="text-[#666666] hover:text-[#2C2C2C] text-lg font-bold leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Username <span className="text-[#FF2E46]">*</span></label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Email <span className="text-[#FF2E46]">*</span></label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Phone <span className="text-[#FF2E46]">*</span></label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Password <span className="text-[#FF2E46]">*</span></label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Role <span className="text-[#FF2E46]">*</span></label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  required
                >
                  <option value="ENGINEER">Engineer</option>
                  {canCreateAdmin && <option value="ADMIN">Admin</option>}
                  {user?.role === 'HOST' && <option value="HOST">Host</option>}
                  {user?.role === 'HOST' && <option value="SALES_EXECUTIVE">Sales Executive</option>}
                  {user?.role === 'HOST' && <option value="ACCOUNTANT">Accountant</option>}
                  {user?.role === 'HOST' && <option value="COMPANY_PAYROLL">Company Payroll</option>}
                  {user?.role === 'HOST' && <option value="TALLY_CALLER">Tally Caller</option>}
                  {user?.role === 'HOST' && <option value="SALES_ADMIN">Sales Admin</option>}
                  {user?.role === 'HOST' && <option value="COMPANY_BASED_ACCESS">Company Based Access</option>}
                </select>
              </div>

              {formData.role === 'COMPANY_BASED_ACCESS' && (
                <div>
                  <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Brand <span className="text-[#FF2E46]">*</span></label>
                  <select
                    value={formData.brandName}
                    onChange={(e) => setFormData(prev => ({ ...prev, brandName: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                    required
                  >
                    <option value="">— Select brand —</option>
                    {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              )}

              {formData.role === 'HOST' && (
                <div>
                  <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Secret Password <span className="text-[#FF2E46]">*</span></label>
                  <input
                    type="password"
                    value={formData.secretPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, secretPassword: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                    placeholder="Enter secret password for HOST"
                    required={formData.role === 'HOST'}
                  />
                </div>
              )}

              <div className="flex gap-2.5 pt-3 border-t border-[#E0E2E5]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setIsCreating(false);
                  }}
                  className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className={`flex-1 py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-all ${
                    isCreating 
                      ? 'bg-[#FF5A71] text-white cursor-not-allowed' 
                      : 'bg-[#FF2E46] text-white hover:bg-[#FF5A71]'
                  }`}
                >
                  {isCreating ? 'Processing...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditForm && editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div ref={editModalRef} className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-lg shadow-lg border border-[#E0E2E5] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-[#E0E2E5]">
              <h2 className="text-base font-bold text-[#2C2C2C]">Edit Staff Member</h2>
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setIsEditing(false);
                }}
                className="text-[#666666] hover:text-[#2C2C2C] text-lg font-bold leading-none p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Username</label>
                <input
                  type="text"
                  value={editFormData.username}
                  readOnly
                  className="w-full px-3.5 py-2 bg-[#F8F9FA] border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#666666] cursor-not-allowed font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Email <span className="text-[#FF2E46]">*</span></label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Phone <span className="text-[#FF2E46]">*</span></label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  placeholder="Enter new password or leave blank"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Role <span className="text-[#FF2E46]">*</span></label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                  required
                >
                  <option value="ENGINEER">Engineer</option>
                  <option value="ADMIN">Admin</option>
                  <option value="HOST">Host</option>
                  {user?.role === 'HOST' && <option value="SALES_EXECUTIVE">Sales Executive</option>}
                  {user?.role === 'HOST' && <option value="ACCOUNTANT">Accountant</option>}
                  {user?.role === 'HOST' && <option value="COMPANY_PAYROLL">Company Payroll</option>}
                  {user?.role === 'HOST' && <option value="TALLY_CALLER">Tally Caller</option>}
                  {user?.role === 'HOST' && <option value="SALES_ADMIN">Sales Admin</option>}
                  {user?.role === 'HOST' && <option value="COMPANY_BASED_ACCESS">Company Based Access</option>}
                </select>
              </div>

              {editFormData.role === 'COMPANY_BASED_ACCESS' && (
                <div>
                  <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Brand <span className="text-[#FF2E46]">*</span></label>
                  <select
                    value={editFormData.brandName}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, brandName: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                    required
                  >
                    <option value="">— Select brand —</option>
                    {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              )}

              {editFormData.role === 'HOST' && editingUser.role !== 'HOST' && (
                <div>
                  <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Secret Password <span className="text-[#FF2E46]">*</span></label>
                  <input
                    type="password"
                    value={editFormData.secretPassword}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, secretPassword: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                    placeholder="Enter secret password for HOST"
                    required
                  />
                </div>
              )}

              <div className="flex gap-2.5 pt-3 border-t border-[#E0E2E5]">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setIsEditing(false);
                  }}
                  className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className={`flex-1 py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-all ${
                    isEditing 
                      ? 'bg-[#FF5A71] text-white cursor-not-allowed' 
                      : 'bg-[#FF2E46] text-white hover:bg-[#FF5A71]'
                  }`}
                >
                  {isEditing ? 'Updating...' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Secret Password Modal */}
      {showActionSecretModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div ref={actionSecretModalRef} className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md shadow-lg border border-[#E0E2E5]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E0E2E5]">
              <h2 className="text-base font-bold text-[#2C2C2C]">Security Confirmation</h2>
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
                className="text-[#666666] hover:text-[#2C2C2C] text-lg font-bold leading-none p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs sm:text-sm text-[#666666] mb-4">
              Enter your HOST secret password to execute this user action:
            </p>
            
            <div className="mb-4">
              <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1.5">Secret Password <span className="text-[#FF2E46]">*</span></label>
              <input
                type="password"
                value={actionSecretPassword}
                onChange={(e) => setActionSecretPassword(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46] focus:ring-2 focus:ring-[#FF2E46]/20 transition-all"
                placeholder="Enter secret password"
                onKeyPress={(e) => e.key === 'Enter' && verifyActionSecret()}
                autoFocus
              />
            </div>
            
            <div className="flex gap-2.5">
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
                className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs sm:text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={verifyActionSecret}
                disabled={isConfirming}
                className={`flex-1 py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-all ${
                  isConfirming
                    ? 'bg-[#FF5A71] text-white cursor-not-allowed'
                    : 'bg-[#FF2E46] text-white hover:bg-[#FF5A71]'
                }`}
              >
                {isConfirming ? 'Processing...' : 'Confirm Action'}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div ref={hostLimitModalRef} className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md shadow-lg border border-[#E0E2E5]">
            <div className="w-10 h-10 rounded-lg bg-[#FFE8EB] text-[#FF2E46] flex items-center justify-center mx-auto mb-3 text-lg font-bold">
              !
            </div>
            <h2 className="text-base font-bold text-center text-[#2C2C2C] mb-1.5">HOST Limit Reached</h2>
            <p className="text-xs sm:text-sm text-[#666666] text-center mb-5">{hostLimitMessage}</p>
            <button
              onClick={() => setShowHostLimitAlert(false)}
              className="w-full bg-[#2C2C2C] hover:bg-[#1A1A1A] text-white py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all"
            >
              Acknowledged
            </button>
          </div>
        </div>
      )}

      {/* Success Alert Modal */}
      {showSuccessAlert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div ref={successModalRef} className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md shadow-lg border border-[#E0E2E5]">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-lg font-bold">
              ✓
            </div>
            <h2 className="text-base font-bold text-center text-[#2C2C2C] mb-1.5">Action Successful</h2>
            <p className="text-xs sm:text-sm text-[#666666] text-center mb-5">{successMessage}</p>
            <button
              onClick={() => setShowSuccessAlert(false)}
              className="w-full bg-[#FF2E46] hover:bg-[#FF5A71] text-white py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          totalCount={users.length}
          filteredCount={users.length}
          title="Export Users to Excel"
        />
      )}

      {/* Wrong Password Alert - Action Confirmation */}
      {showWrongPasswordAlert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md shadow-lg border border-[#E0E2E5]">
            <div className="w-10 h-10 rounded-lg bg-[#FFE8EB] text-[#FF2E46] flex items-center justify-center mx-auto mb-3 text-lg font-bold">
              ✕
            </div>
            <h2 className="text-base font-bold text-center text-[#2C2C2C] mb-1.5">Invalid Secret Password</h2>
            <p className="text-xs sm:text-sm text-[#666666] text-center mb-5">The secret key entered does not match your credentials. Please try again.</p>
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setShowWrongPasswordAlert(false);
                  setPendingAction(null);
                  setIsCreating(false);
                  setIsEditing(false);
                  setIsDeleting({});
                }}
                className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs sm:text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowWrongPasswordAlert(false);
                  setShowActionSecretModal(true);
                }}
                className="flex-1 bg-[#FF2E46] hover:bg-[#FF5A71] text-white py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-all"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;