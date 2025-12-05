import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const useCallStore = create(
  persist(
    (set, get) => ({
      calls: [],
      customers: [],
      
      addCall: async (callData) => {
        try {
          const response = await apiClient.post('/calls', callData);
          
          set(state => ({
            calls: [response.data, ...state.calls]
          }));
          
          toast.success('Call added successfully');
          return response.data;
        } catch (error) {
          toast.error('Failed to add call. Please try again.');
          throw error;
        }
      },

      fetchCalls: async () => {
        try {
          const response = await apiClient.get('/calls');
          set({ calls: response.data });
        } catch (error) {
          console.error('Failed to fetch calls:', error);
        }
      },

      updateCall: async (callId, updates) => {
        try {
          const response = await apiClient.put(`/calls/${callId}`, updates);
          set(state => ({
            calls: state.calls.map(call => 
              call.id === callId ? response.data : call
            )
          }));
          toast.success('Call updated successfully');
          return response.data;
        } catch (error) {
          toast.error('Failed to update call');
          throw error;
        }
      },

      findCustomerByPhone: (phone) => {
        const { calls } = get();
        return calls.find(call => call.phone === phone);
      },




    }),
    {
      name: 'call-storage',
    }
  )
);

export default useCallStore;