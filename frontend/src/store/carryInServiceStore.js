import { create } from 'zustand';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const useCarryInServiceStore = create((set, get) => ({
  services: [],
  loading: false,

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
      set(state => ({ services: [response.data, ...state.services] }));
      toast.success('Service added successfully');
      return response.data;
    } catch (error) {
      toast.error('Failed to add service');
      throw error;
    }
  },

  completeService: async (serviceId) => {
    try {
      const response = await apiClient.post(`/carry-in-services/${serviceId}/complete`);
      set(state => ({
        services: state.services.map(service =>
          service.id === serviceId ? response.data : service
        )
      }));
      toast.success('Service marked as completed');
      return response.data;
    } catch (error) {
      toast.error('Failed to complete service');
      throw error;
    }
  },

  deliverService: async (serviceId) => {
    try {
      const response = await apiClient.post(`/carry-in-services/${serviceId}/deliver`);
      set(state => ({
        services: state.services.map(service =>
          service.id === serviceId ? response.data : service
        )
      }));
      toast.success('Service delivered to customer');
      return response.data;
    } catch (error) {
      toast.error('Failed to deliver service');
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
  }
}));

export default useCarryInServiceStore;