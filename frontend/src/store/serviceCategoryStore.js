import { create } from 'zustand';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const useServiceCategoryStore = create((set, get) => ({
  serviceCategories: [],
  lastFetched: null,
  
  // WebSocket event handlers
  handleServiceCategoryCreated: (category) => {
    set(state => ({
      serviceCategories: [...state.serviceCategories.filter(c => c.id !== category.id), category]
        .sort((a, b) => a.name.localeCompare(b.name)),
      lastFetched: Date.now()
    }));
  },
  
  handleServiceCategoryUpdated: (category) => {
    set(state => ({
      serviceCategories: state.serviceCategories.map(c => c.id === category.id ? category : c)
        .sort((a, b) => a.name.localeCompare(b.name)),
      lastFetched: Date.now()
    }));
  },
  
  handleServiceCategoryDeleted: (deletedCategory) => {
    set(state => ({
      serviceCategories: state.serviceCategories.filter(c => c.id !== deletedCategory.id),
      lastFetched: Date.now()
    }));
  },
  
  fetchServiceCategories: async (forceRefresh = false) => {
    const { lastFetched, serviceCategories } = get();
    
    if (!forceRefresh && lastFetched && serviceCategories.length > 0) {
      const cacheAge = Date.now() - lastFetched;
      if (cacheAge < CACHE_DURATION) {
        return serviceCategories;
      }
    }
    
    try {
      const response = await apiClient.get('/service-categories');
      set({ 
        serviceCategories: response.data,
        lastFetched: Date.now()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch service categories:', error);
      return serviceCategories;
    }
  },
  
  addServiceCategory: async (name) => {
    try {
      const response = await apiClient.post('/service-categories', { name });
      // Don't update state here - WebSocket will handle it
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
      // Don't update state here - WebSocket will handle it
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
      // Don't update state here - WebSocket will handle it
      toast.success('Service category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete service category');
      throw error;
    }
  },
  
  clearCache: () => {
    set({ lastFetched: null });
  }
}));

export default useServiceCategoryStore;
