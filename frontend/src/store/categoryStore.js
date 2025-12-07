import { create } from 'zustand';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const useCategoryStore = create((set, get) => ({
  categories: [],
  lastFetched: null,
  
  fetchCategories: async (forceRefresh = false) => {
    const { lastFetched, categories } = get();
    
    // Check if cache is still valid
    if (!forceRefresh && lastFetched && categories.length > 0) {
      const cacheAge = Date.now() - lastFetched;
      if (cacheAge < CACHE_DURATION) {
        return categories;
      }
    }
    
    try {
      const response = await apiClient.get('/categories');
      set({ 
        categories: response.data,
        lastFetched: Date.now()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Return cached categories if fetch fails
      return categories;
    }
  },
  
  addCategory: async (name) => {
    try {
      const response = await apiClient.post('/categories', { name });
      set(state => ({
        categories: [...state.categories, response.data].sort((a, b) => 
          a.name.localeCompare(b.name)
        ),
        lastFetched: Date.now()
      }));
      toast.success('Category added successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to add category';
      toast.error(message);
      throw error;
    }
  },
  
  updateCategory: async (id, name) => {
    try {
      const response = await apiClient.put(`/categories/${id}`, { name });
      set(state => ({
        categories: state.categories.map(cat => 
          cat.id === id ? response.data : cat
        ).sort((a, b) => a.name.localeCompare(b.name)),
        lastFetched: Date.now()
      }));
      toast.success('Category updated successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update category';
      toast.error(message);
      throw error;
    }
  },
  
  deleteCategory: async (id) => {
    try {
      await apiClient.delete(`/categories/${id}`);
      set(state => ({
        categories: state.categories.filter(cat => cat.id !== id),
        lastFetched: Date.now()
      }));
      toast.success('Category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete category');
      throw error;
    }
  },
  
  clearCache: () => {
    set({ lastFetched: null });
  }
}));

export default useCategoryStore;
