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

export default apiClient;