import { create } from 'zustand';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const useLocationStore = create((set, get) => ({
  locations: [],

  handleLocationCreated: (location) => {
    set(state => ({
      locations: [...state.locations.filter(l => l.id !== location.id), location]
        .sort((a, b) => a.name.localeCompare(b.name))
    }));
  },

  handleLocationUpdated: (location) => {
    set(state => ({
      locations: state.locations.map(l => l.id === location.id ? location : l)
        .sort((a, b) => a.name.localeCompare(b.name))
    }));
  },

  handleLocationDeleted: (data) => {
    set(state => ({ locations: state.locations.filter(l => l.id !== data.id) }));
  },

  fetchLocations: async () => {
    const { locations } = get();
    if (locations.length > 0) return locations;
    try {
      const response = await apiClient.get('/locations');
      set({ locations: response.data });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      return [];
    }
  },

  addLocation: async (name, secretPassword) => {
    try {
      const response = await apiClient.post('/locations', { name, secretPassword });
      toast.success('Location added successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to add location';
      toast.error(message);
      throw error;
    }
  },

  updateLocation: async (id, name, secretPassword) => {
    try {
      const response = await apiClient.put(`/locations/${id}`, { name, secretPassword });
      toast.success('Location updated successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update location';
      toast.error(message);
      throw error;
    }
  },

  deleteLocation: async (id, secretPassword) => {
    try {
      const response = await apiClient.delete(`/locations/${id}`, { data: { secretPassword } });
      toast.success('Location deleted successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete location';
      toast.error(message);
      throw error;
    }
  }
}));

export default useLocationStore;
