import axios from 'axios';
import useAuthStore from '../store/authStore';

// Use Vite environment variable for the API base URL when available.
// During development this will default to the local backend. In production
// set `VITE_API_URL` in your deployment to point to the deployed API.
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000' : 'https://call-management-7hug.onrender.com');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Silently handle 404 errors for requests marked as silent
    if (error.response?.status === 404 && error.config?.headers?.['X-Silent-404']) {
      // Create a custom error that won't be logged by the browser
      const silentError = new Error('Customer not found');
      silentError.response = error.response;
      silentError.config = error.config;
      return Promise.reject(silentError);
    }
    
    if (error.response?.status === 401 && error.response?.data?.error === 'Invalid token') {
      // Token is invalid, user might have been deleted
      const { logout } = useAuthStore.getState();
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;