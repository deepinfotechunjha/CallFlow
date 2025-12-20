import { useEffect } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useCallStore from '../store/callStore';
import useCarryInServiceStore from '../store/carryInServiceStore';
import useCategoryStore from '../store/categoryStore';
import useServiceCategoryStore from '../store/serviceCategoryStore';

let socket = null;

const useSocket = () => {
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (user && !socket) {
      const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000' : 'https://call-management-7hug.onrender.com');
      
      socket = io(API_URL, {
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        console.log('WebSocket connected');
        socket.emit('register', user.id);
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

      socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
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
