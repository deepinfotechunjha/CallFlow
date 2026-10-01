import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';

const AdminUserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
    role: 'ENGINEER',
    secretPassword: ''
  });
  const [editFormData, setEditFormData] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
    role: 'ENGINEER',
    secretPassword: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/secreturl');
      return;
    }
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiClient.get('/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
      if (error?.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/secreturl');
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      await apiClient.post('/users', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User created successfully');
      setShowAddForm(false);
      setFormData({ username: '', password: '', email: '', phone: '', role: 'ENGINEER', secretPassword: '' });
      fetchUsers();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to create user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditFormData({
      username: user.username,
      password: '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      secretPassword: ''
    });
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const updateData = {
        role: editFormData.role,
        email: editFormData.email,
        phone: editFormData.phone
      };
      if (editFormData.password) updateData.password = editFormData.password;
      if (editFormData.secretPassword) updateData.secretPassword = editFormData.secretPassword;
      
      await apiClient.put(`/users/${editingUser.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User updated successfully');
      setShowEditForm(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDelete = (user) => {
    setConfirmConfig({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete user "${user.username}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('adminToken');
          await apiClient.delete(`/users/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          toast.success('User deleted successfully');
          fetchUsers();
        } catch (error) {
          toast.error(error?.response?.data?.error || 'Failed to delete user');
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FA]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#FF2E46] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-bold text-[#2C2C2C]">Loading administrative portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#2C2C2C] text-white border-b border-[#3D3D3D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#FF2E46] text-white rounded-lg flex items-center justify-center font-bold text-xs shadow-xs">
                DI
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold leading-none">Deep Infotech</h1>
                <p className="text-[11px] text-[#E0E2E5] mt-0.5">Admin Management Console</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-[#FF2E46] hover:bg-[#FF5A71] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#2C2C2C]">All Registered Users</h2>
            <p className="text-xs text-[#666666] mt-0.5">Total accounts: {users.length}</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-[#FF2E46] hover:bg-[#FF5A71] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add New User
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-[#E0E2E5] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E0E2E5]">
              <thead className="bg-[#2C2C2C]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#3D3D3D]">Created At</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#F0F2F5]">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs sm:text-sm font-bold text-[#2C2C2C]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-[#FFE8EB] text-[#FF2E46] font-bold text-xs flex items-center justify-center">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        {user.username}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-[#666666]">{user.email || 'N/A'}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-[#666666]">{user.phone || 'N/A'}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-md border ${
                        user.role === 'HOST' ? 'bg-[#FFE8EB] text-[#FF2E46] border-[#FF2E46]/30' :
                        user.role === 'ADMIN' ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-[#666666]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEdit(user)}
                          className="bg-gray-100 hover:bg-gray-200 text-[#2C2C2C] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md shadow-lg border border-[#E0E2E5]">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-[#E0E2E5]">
              <h2 className="text-base font-bold text-[#2C2C2C]">Add New User</h2>
              <button onClick={() => setShowAddForm(false)} className="text-[#666666] hover:text-[#2C2C2C] text-lg font-bold leading-none p-1">✕</button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Username *</label>
                <input type="text" value={formData.username} onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))} className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46]" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Email *</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46]" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Phone *</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46]" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Password *</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46]" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Role *</label>
                <select value={formData.role} onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))} className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46]">
                  <option value="ENGINEER">Engineer</option>
                  <option value="ADMIN">Admin</option>
                  <option value="HOST">Host</option>
                </select>
              </div>
              {formData.role === 'HOST' && (
                <div>
                  <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Secret Password *</label>
                  <input type="password" value={formData.secretPassword} onChange={(e) => setFormData(prev => ({ ...prev, secretPassword: e.target.value }))} className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46]" required />
                </div>
              )}
              <div className="flex gap-2.5 pt-3 border-t border-[#E0E2E5]">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs sm:text-sm font-semibold transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-[#FF2E46] hover:bg-[#FF5A71] text-white py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-all">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditForm && editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md shadow-lg border border-[#E0E2E5]">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-[#E0E2E5]">
              <h2 className="text-base font-bold text-[#2C2C2C]">Edit User</h2>
              <button onClick={() => setShowEditForm(false)} className="text-[#666666] hover:text-[#2C2C2C] text-lg font-bold leading-none p-1">✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Username</label>
                <input type="text" value={editFormData.username} readOnly className="w-full px-3.5 py-2 bg-[#F8F9FA] border border-[#E0E2E5] rounded-lg text-xs sm:text-sm font-bold text-[#666666] cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Email *</label>
                <input type="email" value={editFormData.email} onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46]" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Phone *</label>
                <input type="tel" value={editFormData.phone} onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46]" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">New Password (leave blank to keep current)</label>
                <input type="password" value={editFormData.password} onChange={(e) => setEditFormData(prev => ({ ...prev, password: e.target.value }))} className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46]" placeholder="Leave blank to keep current" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Role *</label>
                <select value={editFormData.role} onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value }))} className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46]">
                  <option value="ENGINEER">Engineer</option>
                  <option value="ADMIN">Admin</option>
                  <option value="HOST">Host</option>
                </select>
              </div>
              {editFormData.role === 'HOST' && editingUser.role !== 'HOST' && (
                <div>
                  <label className="block text-xs font-bold text-[#2C2C2C] uppercase tracking-wider mb-1">Secret Password *</label>
                  <input type="password" value={editFormData.secretPassword} onChange={(e) => setEditFormData(prev => ({ ...prev, secretPassword: e.target.value }))} className="w-full px-3.5 py-2 bg-white border border-[#E0E2E5] rounded-lg text-xs sm:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#FF2E46]" required />
                </div>
              )}
              <div className="flex gap-2.5 pt-3 border-t border-[#E0E2E5]">
                <button type="button" onClick={() => setShowEditForm(false)} className="flex-1 py-2 border border-[#E0E2E5] rounded-lg text-[#2C2C2C] hover:bg-[#F0F2F5] text-xs sm:text-sm font-semibold transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-[#FF2E46] hover:bg-[#FF5A71] text-white py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-all">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
};

export default AdminUserManagement;
