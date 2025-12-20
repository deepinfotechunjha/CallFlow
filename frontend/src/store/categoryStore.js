import { create } from 'zustand';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const useCategoryStore = create((set, get) => ({
  categories: [],
  lastFetched: null,
  
  // WebSocket event handlers
  handleCategoryCreated: (category) => {
    set(state => ({
      categories: [...state.categories.filter(c => c.id !== category.id), category]
        .sort((a, b) => a.name.localeCompare(b.name)),
      lastFetched: Date.now()
    }));
  },
  
  handleCategoryUpdated: (category) => {
    set(state => ({
      categories: state.categories.map(c => c.id === category.id ? category : c)
        .sort((a, b) => a.name.localeCompare(b.name)),
      lastFetched: Date.now()
    }));
  },
  
  handleCategoryDeleted: (deletedCategory) => {
    set(state => ({
      categories: state.categories.filter(c => c.id !== deletedCategory.id),
      lastFetched: Date.now()
    }));
  },
  
  fetchCategories: async (forceRefresh = false) => {
    const { lastFetched, categories } = get();
    
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
      return categories;
    }
  },
  
  addCategory: async (name) => {
    try {
      const response = await apiClient.post('/categories', { name });
      // Don't update state here - WebSocket will handle it
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
      // Don't update state here - WebSocket will handle it
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
      // Don't update state here - WebSocket will handle it
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
