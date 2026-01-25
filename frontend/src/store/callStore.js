import { create } from 'zustand';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const useCallStore = create((set, get) => ({
  calls: [],
  customers: [],
  
  // WebSocket event handlers
  handleCallCreated: (call) => {
    set(state => ({
      calls: [call, ...state.calls.filter(c => c.id !== call.id)]
    }));
  },
  
  handleCallUpdate: (call) => {
    set(state => ({
      calls: state.calls.map(c => c.id === call.id ? call : c)
    }));
  },
  
  handleCallUpdated: (call) => get().handleCallUpdate(call),
  handleCallAssigned: (call) => get().handleCallUpdate(call),
  handleCallCompleted: (call) => get().handleCallUpdate(call),
  
  handleCallsBulkDeleted: (data) => {
    console.log('Handling bulk delete:', data);
    set(state => ({
      calls: state.calls.filter(c => !data.callIds?.includes(c.id))
    }));
  },
  
  handleCustomerUpdated: (customer) => {
    set(state => ({
      customers: state.customers.map(c => c.id === customer.id ? customer : c)
    }));
  },
  
  addCall: async (callData) => {
    try {
      const response = await apiClient.post('/calls', callData);
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
      toast.error('Failed to fetch calls');
    }
  },

  updateCall: async (callId, updates) => {
    try {
      const response = await apiClient.put(`/calls/${callId}`, updates);
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
      toast.error('Failed to fetch customers');
    }
  },

  updateCustomer: async (customerId, updates) => {
    try {
      const response = await apiClient.put(`/customers/${customerId}`, updates);
      set(state => ({
        customers: state.customers.map(c => c.id === customerId ? response.data : c)
      }));
      toast.success('Customer updated successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update customer';
      toast.error(message);
      throw error;
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
      return null;
    }
  },

  assignCall: async (callId, assignee, engineerRemark) => {
    try {
      const response = await apiClient.post(`/calls/${callId}/assign`, {
        assignee,
        engineerRemark
      });
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
      toast.success('Call completed successfully');
      return response.data;
    } catch (error) {
      toast.error('Failed to complete call');
      throw error;
    }
  },

  bulkDeleteCalls: async (callIds, secretPassword) => {
    try {
      const response = await apiClient.post('/calls/bulk-delete', {
        callIds,
        secretPassword
      });
      
      // Immediately update the UI by removing deleted calls
      get().handleCallsBulkDeleted({ callIds });
      
      toast.success(`Successfully deleted ${response.data.deletedCount} calls`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete calls';
      toast.error(message);
      throw error;
    }
  }
}));

export default useCallStore;