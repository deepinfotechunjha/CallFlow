import { create } from 'zustand';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

const useSalesStore = create((set, get) => ({
  entries: [],
  loading: false,

  handleSalesEntryCreated: (entry) => {
    set(state => ({
      entries: [entry, ...state.entries.filter(e => e.id !== entry.id)]
    }));
  },

  handleSalesEntryUpdated: (entry) => {
    set(state => ({
      entries: state.entries.map(e => e.id === entry.id ? { ...e, ...entry } : e)
    }));
  },

  handleSalesLogCreated: (data) => {
    set(state => ({
      entries: state.entries.map(entry => {
        if (entry.id === data.salesEntryId) {
          const isVisit = data.log.logType === 'VISIT';
          return {
            ...entry,
            visitCount: (entry.visitCount || 0) + (isVisit ? 1 : 0),
            callCount: (entry.callCount || 0) + (isVisit ? 0 : 1)
          };
        }
        return entry;
      })
    }));
  },

  fetchEntries: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get('/sales-entries');
      set({ entries: response.data, loading: false });
    } catch (error) {
      toast.error('Failed to fetch sales entries');
      set({ loading: false });
    }
  },

  addEntry: async (entryData) => {
    try {
      const response = await apiClient.post('/sales-entries', entryData);
      toast.success('Entry added successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to add entry';
      toast.error(message);
      throw error;
    }
  },

  updateEntry: async (entryId, entryData) => {
    try {
      const response = await apiClient.put(`/sales-entries/${entryId}`, entryData);
      toast.success('Entry updated successfully');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update entry';
      toast.error(message);
      throw error;
    }
  },

  logVisit: async (entryId, remark) => {
    try {
      const response = await apiClient.post(`/sales-entries/${entryId}/visit`, { remark });
      toast.success('Visit logged successfully');
      return response.data;
    } catch (error) {
      toast.error('Failed to log visit');
      throw error;
    }
  },

  logCall: async (entryId, callType, remark) => {
    try {
      const response = await apiClient.post(`/sales-entries/${entryId}/call`, { callType, remark });
      toast.success('Call logged successfully');
      return response.data;
    } catch (error) {
      toast.error('Failed to log call');
      throw error;
    }
  },

  getEntryDetails: async (entryId) => {
    try {
      const response = await apiClient.get(`/sales-entries/${entryId}`);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch entry details');
      throw error;
    }
  }
}));

export default useSalesStore;
