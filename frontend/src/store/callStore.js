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

      getCustomer: async (phone, email) => {
        try {
          const response = await apiClient.get(`/customers/search?phone=${phone}&email=${email || ''}`);
          return response.data;
        } catch (error) {
          return null;
        }
      },

      saveCustomer: async (customerData) => {
        try {
          const response = await apiClient.post('/customers', customerData);
          set(state => ({
            customers: [...state.customers.filter(c => c.id !== response.data.id), response.data]
          }));
          return response.data;
        } catch (error) {
          console.error('Failed to save customer:', error);
          throw error;
        }
      },

      updateCallAndCustomer: async (callId, callData, customerData) => {
        try {
          // Update customer first
          await apiClient.post('/customers', customerData);
          
          // Then update call
          const response = await apiClient.put(`/calls/${callId}`, callData);
          
          set(state => ({
            calls: state.calls.map(call => 
              call.id === callId ? response.data : call
            )
          }));
          
          toast.success('Call and customer updated successfully');
          return response.data;
        } catch (error) {
          toast.error('Failed to update call and customer');
          throw error;
        }
      }
    }),
    {
      name: 'call-storage',
    }
  )
);

export default useCallStore;