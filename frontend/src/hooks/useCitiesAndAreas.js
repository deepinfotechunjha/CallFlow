import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

const useCitiesAndAreas = () => {
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch cities
  const fetchCities = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/cities');
      setCities(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch cities');
      console.error('Error fetching cities:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch areas by city
  const fetchAreas = async (cityId = null) => {
    try {
      setLoading(true);
      const url = cityId ? `/areas?cityId=${cityId}` : '/areas';
      const response = await apiClient.get(url);
      setAreas(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch areas');
      console.error('Error fetching areas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new city
  const addCity = async (name) => {
    try {
      const response = await apiClient.post('/cities', { name });
      setCities(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to add city';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Add new area
  const addArea = async (name, cityId) => {
    try {
      const response = await apiClient.post('/areas', { name, cityId });
      setAreas(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to add area';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Update city
  const updateCity = async (id, name) => {
    try {
      const response = await apiClient.put(`/cities/${id}`, { name });
      setCities(prev =>
        prev.map(city => city.id === id ? response.data : city)
      );
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update city';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Update area
  const updateArea = async (id, name, cityId) => {
    try {
      const response = await apiClient.put(`/areas/${id}`, { name, cityId });
      setAreas(prev =>
        prev.map(area => area.id === id ? response.data : area)
      );
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update area';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Delete city
  const deleteCity = async (id) => {
    try {
      await apiClient.delete(`/cities/${id}`);
      setCities(prev => prev.filter(city => city.id !== id));
      // Also remove areas from this city
      setAreas(prev => prev.filter(area => area.cityId !== id));
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to delete city';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Delete area
  const deleteArea = async (id) => {
    try {
      await apiClient.delete(`/areas/${id}`);
      setAreas(prev => prev.filter(area => area.id !== id));
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to delete area';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  return {
    cities,
    areas,
    loading,
    error,
    fetchCities,
    fetchAreas,
    addCity,
    addArea,
    updateCity,
    updateArea,
    deleteCity,
    deleteArea,
    setError
  };
};

export default useCitiesAndAreas;