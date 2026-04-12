import { create } from 'zustand';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const useCarryInServiceStore = create((set, get) => ({
  services: [],
  loading: false,

  // WebSocket event handlers
  handleServiceCreated: (service) => {
    set(state => ({
      services: [service, ...state.services.filter(s => s.id !== service.id)]
    }));
  },
  
  handleServiceUpdated: (service) => {
    set(state => ({
      services: state.services.map(s => s.id === service.id ? service : s)
    }));
  },

  handleServicesBulkDeleted: (data) => {
    set(state => ({
      services: state.services.filter(s => !data.serviceIds?.includes(s.id))
    }));
  },

  fetchServices: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get('/carry-in-services');
      set({ services: response.data, loading: false });
    } catch (error) {
      toast.error('Failed to fetch services');
      set({ loading: false });
    }
  },

  addService: async (serviceData) => {
    try {
      const response = await apiClient.post('/carry-in-services', serviceData);
      toast.success('Service added successfully');
      return response.data;
    } catch (error) {
      toast.error('Failed to add service');
      throw error;
    }
  },

  updateService: async (serviceId, serviceData) => {
    try {
      const response = await apiClient.put(`/carry-in-services/${serviceId}`, serviceData);
      toast.success('Service updated successfully');
      return response.data;
    } catch (error) {
      toast.error('Failed to update service');
      throw error;
    }
  },

  completeService: async (serviceId, completeRemark) => {
    try {
      const response = await apiClient.post(`/carry-in-services/${serviceId}/complete`, { completeRemark });
      toast.success('Service marked as completed');
      return response.data;
    } catch (error) {
      toast.error('Failed to complete service');
      throw error;
    }
  },

  deliverService: async (serviceId, deliverRemark) => {
    try {
      const response = await apiClient.post(`/carry-in-services/${serviceId}/deliver`, { deliverRemark });
      toast.success('Service delivered to customer');
      return response.data;
    } catch (error) {
      toast.error('Failed to deliver service');
      throw error;
    }
  },

  checkService: async (serviceId, checkRemark) => {
    try {
      const response = await apiClient.post(`/carry-in-services/${serviceId}/check`, { checkRemark });
      toast.success('Service checked successfully');
      return response.data;
    } catch (error) {
      toast.error('Failed to check service');
      throw error;
    }
  },

  findCustomerByPhone: async (phone) => {
    try {
      const response = await apiClient.get(`/carry-in-customers/phone/${phone}`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  bulkDeleteServices: async (serviceIds, secretPassword) => {
    try {
      const response = await apiClient.post('/carry-in-services/bulk-delete', {
        serviceIds,
        secretPassword
      });
      toast.success(`Successfully deleted ${response.data.deletedCount} services`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete services';
      toast.error(errorMessage);
      throw error;
    }
  }
}));

export default useCarryInServiceStore;