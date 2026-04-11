import { create } from 'zustand';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';
import useAuthStore from './authStore';

const useOrderStore = create((set, get) => ({
  orders: [],
  loading: false,

  handleOrderCreated: (order) => {
    const { user } = useAuthStore.getState();
    const isPersonalRole = ['SALES_EXECUTIVE', 'COMPANY_PAYROLL'].includes(user?.role);
    if (isPersonalRole && order.createdBy !== user?.username) return;
    set(state => ({ orders: [order, ...state.orders.filter(o => o.id !== order.id)] }));
  },

  handleOrderUpdated: (order) => {
    const { user } = useAuthStore.getState();
    const isPersonalRole = ['SALES_EXECUTIVE', 'COMPANY_PAYROLL'].includes(user?.role);
    if (isPersonalRole && order.createdBy !== user?.username) return;
    set(state => ({ orders: state.orders.map(o => o.id === order.id ? order : o) }));
  },

  fetchOrders: async (filters = {}) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      const url = `/orders${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get(url);
      set({ orders: response.data, loading: false });
    } catch (err) {
      toast.error('Failed to fetch orders');
      set({ loading: false });
    }
  },

  searchFirms: async (query) => {
    try {
      const response = await apiClient.get(`/sales-entries/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (err) {
      toast.error('Failed to search firms');
      return [];
    }
  },

  createOrder: async (data) => {
    try {
      const response = await apiClient.post('/orders', data);
      toast.success('Order created successfully');
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create order';
      toast.error(msg);
      throw err;
    }
  },

  holdOrder: async (id, remark) => {
    try {
      const response = await apiClient.post(`/orders/${id}/hold`, { remark });
      toast.success('Order put on hold');
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to hold order';
      toast.error(msg);
      throw err;
    }
  },

  billOrder: async (id, billingRemark) => {
    try {
      const response = await apiClient.post(`/orders/${id}/bill`, { billingRemark });
      toast.success('Order billed successfully');
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to bill order';
      toast.error(msg);
      throw err;
    }
  },

  completeOrder: async (id, completionRemark) => {
    try {
      const response = await apiClient.post(`/orders/${id}/complete`, { completionRemark });
      toast.success('Order transported successfully');
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to transport order';
      toast.error(msg);
      throw err;
    }
  },

  cancelOrder: async (id) => {
    try {
      const response = await apiClient.post(`/orders/${id}/cancel`);
      toast.success('Order cancelled');
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to cancel order';
      toast.error(msg);
      throw err;
    }
  },

  revertOrder: async (id, secretPassword, targetStatus, remark) => {
    try {
      const response = await apiClient.post(`/orders/${id}/revert`, { secretPassword, targetStatus, remark });
      set(state => ({ orders: state.orders.map(o => o.id === id ? response.data : o) }));
      toast.success('Order reverted successfully');
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to revert order';
      toast.error(msg);
      throw err;
    }
  },
}));

export default useOrderStore;
