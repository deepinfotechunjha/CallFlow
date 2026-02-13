import { create } from 'zustand';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const useDCStore = create((set, get) => ({
  dcCalls: [],
  loading: false,

  fetchDCCalls: async (status = 'all') => {
    set({ loading: true });
    try {
      const params = status !== 'all' ? { status } : {};
      const response = await apiClient.get('/calls/dc', { params });
      set({ dcCalls: response.data, loading: false });
    } catch (error) {
      console.error('Failed to fetch DC calls:', error);
      toast.error('Failed to fetch DC calls');
      set({ loading: false });
    }
  },

  completeDC: async (callId) => {
    try {
      const response = await apiClient.post(`/calls/${callId}/complete-dc`);
      
      // Update local state
      set((state) => ({
        dcCalls: state.dcCalls.map((call) =>
          call.id === callId ? response.data : call
        ),
      }));
      
      toast.success('DC marked as completed');
      return response.data;
    } catch (error) {
      console.error('Failed to complete DC:', error);
      toast.error(error.response?.data?.error || 'Failed to complete DC');
      throw error;
    }
  },

  // Real-time updates
  handleDCCompleted: (updatedCall) => {
    set((state) => ({
      dcCalls: state.dcCalls.map((call) =>
        call.id === updatedCall.id ? updatedCall : call
      ),
    }));
  },

  handleCallCompleted: (newCall) => {
    if (newCall.dcRequired) {
      set((state) => ({
        dcCalls: [newCall, ...state.dcCalls],
      }));
    }
  },
}));

export default useDCStore;
