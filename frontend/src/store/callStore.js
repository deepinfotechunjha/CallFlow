import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const useCallStore = create(
  persist(
    (set, get) => ({
      calls: [],
      customers: [],
      
      // WebSocket event handlers
      handleCallCreated: (call) => {
        set(state => ({
          calls: [call, ...state.calls.filter(c => c.id !== call.id)]
        }));
      },
      
      handleCallUpdated: (call) => {
        set(state => ({
          calls: state.calls.map(c => c.id === call.id ? call : c)
        }));
      },
      
      handleCallAssigned: (call) => {
        set(state => ({
          calls: state.calls.map(c => c.id === call.id ? call : c)
        }));
      },
      
      handleCallCompleted: (call) => {
        set(state => ({
          calls: state.calls.map(c => c.id === call.id ? call : c)
        }));
      },
      
      addCall: async (callData) => {
        try {
          const response = await apiClient.post('/calls', callData);
          // Don't update state here - WebSocket will handle it
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
          // Don't update state here - WebSocket will handle it
          toast.success('Call updated successfully');
          return response.data;
        } catch (error) {
          toast.error('Failed to update call');
          throw error;
        }
      },

      fetchCustomers: async () => {
        try {
          const response = await apiClient.get('/customers');
          set({ customers: response.data });
        } catch (error) {
          console.error('Failed to fetch customers:', error);
        }
      },

      findCustomerByPhone: async (phone) => {
        if (!phone) return null;
        try {
          const response = await apiClient.get(`/customers/phone/${phone}`, {
            headers: { 'X-Silent-404': 'true' }
          });
          return response.data;
        } catch (error) {
          if (error.response?.status === 404) {
            return null;
          }
          return null;
        }
      },

      assignCall: async (callId, assignee, engineerRemark) => {
        try {
          const response = await apiClient.post(`/calls/${callId}/assign`, {
            assignee,
            engineerRemark
          });
          // Don't update state here - WebSocket will handle it
          toast.success('Call assigned successfully');
          return response.data;
        } catch (error) {
          toast.error('Failed to assign call');
          throw error;
        }
      },

      completeCall: async (callId, remark) => {
        try {
          const response = await apiClient.post(`/calls/${callId}/complete`, {
            remark
          });
          // Don't update state here - WebSocket will handle it
          toast.success('Call completed successfully');
          return response.data;
        } catch (error) {
          toast.error('Failed to complete call');
          throw error;
        }
      }
    }),
    {
      name: 'call-storage',
      partialize: (state) => ({ calls: state.calls, customers: state.customers })
    }
  )
);

export default useCallStore;