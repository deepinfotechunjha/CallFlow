import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import EngineerAnalytics from './pages/EngineerAnalytics';
import CategorySettings from './pages/CategorySettings';
import CustomerDirectory from './pages/CustomerDirectory';
import CarryInService from './pages/CarryInService';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import useAuthStore from './store/authStore';
import useSocket from './hooks/useSocket';

function App() {
  const { pathname } = useLocation();
  const { user, isInitialized, initializeAuth } = useAuthStore();
  const showNavbar = user && pathname !== '/login';
  
  // Initialize auth on app startup
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  
  // Initialize WebSocket connection for real-time notifications
  useSocket();

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {showNavbar && <Navbar />}
      <main className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute allowedRoles={['HOST']}><UserManagement /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute allowedRoles={['HOST']}><EngineerAnalytics /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute allowedRoles={['HOST']}><CustomerDirectory /></ProtectedRoute>} />
          <Route path="/carry-in-service" element={<ProtectedRoute><CarryInService /></ProtectedRoute>} />
          <Route path="/settings/categories" element={<ProtectedRoute allowedRoles={['HOST']}><CategorySettings /></ProtectedRoute>} />
        </Routes>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}

export default App
