import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import SalesDashboard from './pages/SalesDashboard';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import EngineerAnalytics from './pages/EngineerAnalytics';
import CategorySettings from './pages/CategorySettings';
import BrandSettings from './pages/BrandSettings';
import LocationSettings from './pages/LocationSettings';
import CustomerDirectory from './pages/CustomerDirectory';
import CarryInService from './pages/CarryInService';
import DCPage from './pages/DCPage';
import OrdersPage from './pages/OrdersPage';
import AdminLogin from './pages/AdminLogin';
import AdminUserManagement from './pages/AdminUserManagement';
import PublicCallForm from './pages/PublicCallForm';
import PublicServiceForm from './pages/PublicServiceForm';
import PublicSalesForm from './pages/PublicSalesForm';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import useAuthStore from './store/authStore';
import useSocket from './hooks/useSocket';

function App() {
  const { pathname } = useLocation();
  const { user, isInitialized, initializeAuth } = useAuthStore();
  const showNavbar = user && pathname !== '/login' && !pathname.startsWith('/secreturl') && !pathname.startsWith('/share');
  
  // Initialize auth on app startup
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  
  // Initialize WebSocket connection for real-time notifications
  useSocket();

  // Global scroll lock: lock body scroll whenever any modal overlay is present
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const hasModal = !!document.querySelector('.fixed.inset-0.bg-black');
      document.body.style.overflow = hasModal ? 'hidden' : '';
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      document.body.style.overflow = '';
    };
  }, []);

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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/share/:linkId" element={<PublicCallForm />} />
          <Route path="/share/sales/:linkId" element={<PublicSalesForm />} />
          <Route path="/share-service/:linkId" element={<PublicServiceForm />} />
          <Route path="/secreturl" element={<AdminLogin />} />
          <Route path="/secreturl/manage" element={<AdminUserManagement />} />
          <Route path="/" element={
            <ProtectedRoute>
              {['SALES_EXECUTIVE', 'TALLY_CALLER', 'SALES_ADMIN'].includes(user?.role)
              ? <Navigate to="/sales-dashboard" replace />
              : ['ACCOUNTANT', 'COMPANY_PAYROLL', 'COMPANY_BASED_ACCESS'].includes(user?.role)
              ? <Navigate to="/orders" replace />
              : <Dashboard />}
            </ProtectedRoute>
          } />
          <Route path="/sales-dashboard" element={<ProtectedRoute allowedRoles={['HOST', 'SALES_EXECUTIVE', 'TALLY_CALLER', 'SALES_ADMIN']}><SalesDashboard /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute allowedRoles={['HOST', 'ACCOUNTANT', 'SALES_EXECUTIVE', 'COMPANY_PAYROLL', 'SALES_ADMIN', 'COMPANY_BASED_ACCESS']}><OrdersPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute allowedRoles={['HOST']}><UserManagement /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute allowedRoles={['HOST']}><EngineerAnalytics /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute allowedRoles={['HOST']}><CustomerDirectory /></ProtectedRoute>} />
          <Route path="/carry-in-service" element={<ProtectedRoute><CarryInService /></ProtectedRoute>} />
          <Route path="/dc" element={<ProtectedRoute allowedRoles={['HOST', 'ADMIN']}><DCPage /></ProtectedRoute>} />
          <Route path="/settings/categories" element={<ProtectedRoute allowedRoles={['HOST']}><CategorySettings /></ProtectedRoute>} />
          <Route path="/settings/brands" element={<ProtectedRoute allowedRoles={['HOST']}><BrandSettings /></ProtectedRoute>} />
          <Route path="/settings/locations" element={<ProtectedRoute allowedRoles={['HOST']}><LocationSettings /></ProtectedRoute>} />
        </Routes>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}

export default App
