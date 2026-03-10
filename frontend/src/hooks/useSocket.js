import { useEffect } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useCallStore from '../store/callStore';
import useCarryInServiceStore from '../store/carryInServiceStore';
import useCategoryStore from '../store/categoryStore';
import useServiceCategoryStore from '../store/serviceCategoryStore';
import useDCStore from '../store/dcStore';
import useSalesStore from '../store/salesStore';

let socket = null;

const useSocket = () => {
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (user && !socket) {
      // Use environment variable for API URL, fallback to localhost if not set
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      
      socket = io(API_URL, {
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        console.log('Connected to server');
        socket.emit('register', user.id);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          socket.connect();
        }
      });

      // User management events
      socket.on('user_deleted', (data) => {
        alert(data.message || 'Your account has been removed. You will be logged out.');
        logout();
        window.location.href = '/login';
      });

      socket.on('force_logout', (data) => {
        alert(data.message || 'Your account has been updated. Please log in again.');
        logout();
        window.location.href = '/login';
      });

      socket.on('user_created', (user) => {
        useAuthStore.getState().handleUserCreated(user);
      });

      socket.on('user_updated', (user) => {
        useAuthStore.getState().handleUserUpdated(user);
      });

      socket.on('user_deleted_broadcast', (deletedUser) => {
        useAuthStore.getState().handleUserDeleted(deletedUser);
      });

      // Call management events
      socket.on('call_created', (call) => {
        useCallStore.getState().handleCallCreated(call);
      });

      socket.on('call_updated', (call) => {
        useCallStore.getState().handleCallUpdated(call);
      });

      socket.on('call_assigned', (call) => {
        useCallStore.getState().handleCallAssigned(call);
      });

      socket.on('call_completed', (call) => {
        useCallStore.getState().handleCallCompleted(call);
        if (call.dcRequired) {
          useDCStore.getState().handleCallCompleted(call);
        }
      });

      socket.on('call_visited', (call) => {
        useCallStore.getState().handleCallVisited(call);
      });

      socket.on('dc_completed', (call) => {
        useCallStore.getState().handleCallUpdate(call);
        useDCStore.getState().handleDCCompleted(call);
      });

      socket.on('calls_bulk_deleted', (data) => {
        useCallStore.getState().handleCallsBulkDeleted(data);
        useDCStore.getState().handleCallsBulkDeleted(data);
      });

      socket.on('customer_updated', (customer) => {
        useCallStore.getState().handleCustomerUpdated(customer);
        useDCStore.getState().handleCustomerUpdated(customer);
      });

      socket.on('services_bulk_deleted', (data) => {
        useCarryInServiceStore.getState().handleServicesBulkDeleted(data);
      });

      // Carry-in service events
      socket.on('service_created', (service) => {
        useCarryInServiceStore.getState().handleServiceCreated(service);
      });

      socket.on('service_updated', (service) => {
        useCarryInServiceStore.getState().handleServiceUpdated(service);
      });

      // Category events
      socket.on('category_created', (category) => {
        useCategoryStore.getState().handleCategoryCreated(category);
      });

      socket.on('category_updated', (category) => {
        useCategoryStore.getState().handleCategoryUpdated(category);
      });

      socket.on('category_deleted', (deletedCategory) => {
        useCategoryStore.getState().handleCategoryDeleted(deletedCategory);
      });

      // Service category events
      socket.on('service_category_created', (category) => {
        useServiceCategoryStore.getState().handleServiceCategoryCreated(category);
      });

      socket.on('service_category_updated', (category) => {
        useServiceCategoryStore.getState().handleServiceCategoryUpdated(category);
      });

      socket.on('service_category_deleted', (deletedCategory) => {
        useServiceCategoryStore.getState().handleServiceCategoryDeleted(deletedCategory);
      });

      // Notification events
      socket.on('notification_created', (notification) => {
        // Trigger notification bell to refresh with notification data
        window.dispatchEvent(new CustomEvent('notification_update', { 
          detail: notification 
        }));
      });

      // Sales Executive events
      socket.on('sales_entry_created', (entry) => {
        useSalesStore.getState().handleSalesEntryCreated(entry);
      });

      socket.on('sales_entry_updated', (entry) => {
        useSalesStore.getState().handleSalesEntryUpdated(entry);
      });

      socket.on('sales_log_created', (data) => {
        useSalesStore.getState().handleSalesLogCreated(data);
      });
    }

    return () => {
      if (socket && !user) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [user, logout]);
};

export default useSocket;
