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
          // Also save token directly to localStorage for compatibility
          localStorage.setItem('token', token);
          toast.success(`Welcome back, ${user.username}!`);
          return true;
        } catch (err) {
          toast.error('Invalid credentials');
          return false;
        }
      },
      
      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('token');
        toast.success('Logged out successfully');
      },
      
      fetchUsers: async () => {
        const state = useAuthStore.getState();
        if (!state.user || state.user.role !== 'HOST') {
          console.log('Only HOST can fetch users');
          return;
        }
        try {
          const response = await apiClient.get('/users');
          set({ users: response.data });
        } catch (err) {
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

      updateUserRole: async (userId, newRole) => {
        try {
          const response = await apiClient.put(`/users/${userId}`, { role: newRole });
          set(state => ({ users: state.users.map(u => u.id === userId ? response.data : u) }));
          toast.success('User role updated successfully');
        } catch (err) {
          toast.error('Failed to update role');
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