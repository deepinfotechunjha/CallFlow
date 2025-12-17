import { useEffect } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

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
        // Register user with their ID
        socket.emit('register', user.id);
      });

      socket.on('user_deleted', (data) => {
        // Show alert and logout
        alert(data.message || 'Your account has been removed. You will be logged out.');
        logout();
        window.location.href = '/login';
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
