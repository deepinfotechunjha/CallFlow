import { create } from 'zustand';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const useBrandStore = create((set, get) => ({
  brands: [],

  handleBrandCreated: (brand) => {
    set(state => ({
      brands: [...state.brands.filter(b => b.id !== brand.id), brand]
        .sort((a, b) => a.name.localeCompare(b.name))
    }));
  },

  handleBrandUpdated: (brand) => {
    set(state => ({
      brands: state.brands.map(b => b.id === brand.id ? brand : b)
        .sort((a, b) => a.name.localeCompare(b.name))
    }));
  },

  handleBrandDeleted: (data) => {
    set(state => ({ brands: state.brands.filter(b => b.id !== data.id) }));
  },

  fetchBrands: async () => {
    const { brands } = get();
    if (brands.length > 0) return brands;
    try {
      const response = await apiClient.get('/brands');
      set({ brands: response.data });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch brands:', error);
      return [];
    }
  },

  addBrand: async (name, secretPassword) => {
    try {
      const response = await apiClient.post('/brands', { name, secretPassword });
      toast.success('Brand added successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to add brand';
      toast.error(message);
      throw error;
    }
  },

  updateBrand: async (id, name, secretPassword) => {
    try {
      const response = await apiClient.put(`/brands/${id}`, { name, secretPassword });
      toast.success('Brand updated successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update brand';
      toast.error(message);
      throw error;
    }
  },

  deleteBrand: async (id, secretPassword) => {
    try {
      const response = await apiClient.delete(`/brands/${id}`, { data: { secretPassword } });
      toast.success('Brand deleted successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete brand';
      toast.error(message);
      throw error;
    }
  },

  fetchBrandProducts: async (brandName) => {
    try {
      const response = await apiClient.get(`/brands/${encodeURIComponent(brandName)}/products`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch brand products:', error);
      return [];
    }
  },

  importBrandProducts: async (brandName, products, mode) => {
    try {
      const response = await apiClient.post(`/brands/${encodeURIComponent(brandName)}/products`, { products, mode });
      const { count, skipped, mode: resultMode } = response.data;
      if (resultMode === 'replace') {
        toast.success(`${count} products imported for ${brandName}`);
      } else {
        toast.success(`${count} new products added, ${skipped} skipped (duplicates)`);
      }
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to import products';
      toast.error(message);
      throw error;
    }
  },

  clearBrandProducts: async (brandName) => {
    try {
      const response = await apiClient.delete(`/brands/${encodeURIComponent(brandName)}/products`);
      toast.success(`All products cleared for ${brandName}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to clear products';
      toast.error(message);
      throw error;
    }
  }
}));

export default useBrandStore;
