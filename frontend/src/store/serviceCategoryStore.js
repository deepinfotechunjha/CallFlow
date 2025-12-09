import { create } from 'zustand';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const useServiceCategoryStore = create((set, get) => ({
  serviceCategories: [],
  lastFetched: null,
  
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
      set(state => ({
        serviceCategories: [...state.serviceCategories, response.data].sort((a, b) => 
          a.name.localeCompare(b.name)
        ),
        lastFetched: Date.now()
      }));
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
      set(state => ({
        serviceCategories: state.serviceCategories.map(cat => 
          cat.id === id ? response.data : cat
        ).sort((a, b) => a.name.localeCompare(b.name)),
        lastFetched: Date.now()
      }));
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
      set(state => ({
        serviceCategories: state.serviceCategories.filter(cat => cat.id !== id),
        lastFetched: Date.now()
      }));
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
