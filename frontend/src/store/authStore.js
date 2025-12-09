import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      users: [],
      
      login: async (username, password) => {
        try {
          const response = await apiClient.post('/auth/login', { username, password });
          const { token, user } = response.data;
          set({ user, token });
          toast.success(`Welcome back, ${user.username}!`);
          return true;
        } catch (err) {
          toast.error('Invalid credentials');
          return false;
        }
      },
      
      logout: () => {
        set({ user: null, token: null });
        toast.success('Logged out successfully');
      },
      
      fetchUsers: async () => {
        const state = useAuthStore.getState();
        if (!state.user || !['HOST', 'ADMIN'].includes(state.user.role)) {
          return;
        }
        try {
          const response = await apiClient.get('/users');
          set({ users: response.data });
        } catch (err) {
          if (err.response?.status === 403 || err.response?.status === 401) {
            // Silently handle permission errors
            return;
          }
          console.error('Failed to fetch users', err);
        }
      },

      createUser: async (userData) => {
        try {
          const response = await apiClient.post('/users', userData);
          // append the created user to the list
          set(state => ({ users: [...state.users, response.data] }));
          toast.success('User created successfully');
          return response.data;
        } catch (err) {
          toast.error('Failed to create user');
          throw err;
        }
      },

      updateUserRole: async (userId, newRole, secretPassword = null) => {
        try {
          const payload = { role: newRole };
          if (secretPassword) {
            payload.secretPassword = secretPassword;
          }
          const response = await apiClient.put(`/users/${userId}`, payload);
          set(state => ({ users: state.users.map(u => u.id === userId ? response.data : u) }));
          toast.success('User role updated successfully');
        } catch (err) {
          toast.error('Failed to update role');
          throw err;
        }
      },

      updateUser: async (userId, userData) => {
        try {
          const response = await apiClient.put(`/users/${userId}`, userData);
          set(state => ({ users: state.users.map(u => u.id === userId ? response.data : u) }));
          toast.success('User updated successfully');
          return response.data;
        } catch (err) {
          toast.error('Failed to update user');
          throw err;
        }
      },

      deleteUser: async (userId) => {
        try {
          await apiClient.delete(`/users/${userId}`);
          set(state => ({ users: state.users.filter(u => u.id !== userId) }));
          toast.success('User deleted successfully');
        } catch (err) {
          toast.error('Failed to delete user');
          throw err;
        }
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;