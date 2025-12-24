import { create } from 'zustand';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const useServiceCategoryStore = create((set, get) => ({
  serviceCategories: [],
  
  // WebSocket event handlers
  handleServiceCategoryCreated: (category) => {
    set(state => ({
      serviceCategories: [...state.serviceCategories.filter(c => c.id !== category.id), category]
        .sort((a, b) => a.name.localeCompare(b.name))
    }));
  },
  
  handleServiceCategoryUpdated: (category) => {
    set(state => ({
      serviceCategories: state.serviceCategories.map(c => c.id === category.id ? category : c)
        .sort((a, b) => a.name.localeCompare(b.name))
    }));
  },
  
  handleServiceCategoryDeleted: (deletedCategory) => {
    set(state => ({
      serviceCategories: state.serviceCategories.filter(c => c.id !== deletedCategory.id)
    }));
  },
  
  fetchServiceCategories: async () => {
    try {
      const response = await apiClient.get('/service-categories');
      set({ serviceCategories: response.data });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch service categories:', error);
      return [];
    }
  },
  
  addServiceCategory: async (name) => {
    try {
      const response = await apiClient.post('/service-categories', { name });
      toast.success('Service category added successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to add service category';
      toast.error(message);
      throw error;
    }
  },
  
  updateServiceCategory: async (id, name) => {
    try {
      const response = await apiClient.put(`/service-categories/${id}`, { name });
      toast.success('Service category updated successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update service category';
      toast.error(message);
      throw error;
    }
  },
  
  deleteServiceCategory: async (id) => {
    try {
      await apiClient.delete(`/service-categories/${id}`);
      toast.success('Service category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete service category');
      throw error;
    }
  }
}));

export default useServiceCategoryStore;
