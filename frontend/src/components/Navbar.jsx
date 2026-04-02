import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import NotificationBell from './NotificationBell';

const SALES_DASHBOARD_ROLES = ['HOST', 'SALES_EXECUTIVE', 'TALLY_CALLER', 'SALES_ADMIN'];
const ORDERS_ROLES = ['HOST', 'ACCOUNTANT', 'SALES_EXECUTIVE', 'COMPANY_PAYROLL', 'SALES_ADMIN'];
const HIDE_MAIN_DASHBOARD = ['SALES_EXECUTIVE', 'TALLY_CALLER', 'SALES_ADMIN', 'ACCOUNTANT', 'COMPANY_PAYROLL'];

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLink = (to, label, extraClass = '') => (
    <Link
      to={to}
      className={`relative px-1.5 xl:px-2 py-2 text-xs xl:text-sm font-medium whitespace-nowrap transition-all duration-300 ${extraClass} ${
        isActive(to) ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600'
      }`}
    >
      {label}
      {isActive(to) && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 via-blue-600 to-purple-600 rounded-full"></div>
      )}
    </Link>
  );

  const mobileLink = (to, label) => (
    <Link
      to={to}
      onClick={() => setShowMobileMenu(false)}
      className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="w-full px-2 sm:px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <Link to="/" className="flex items-center">
              <img src="/deep.png" alt="Deep Infotech" className="h-8 sm:h-9 lg:h-10 w-auto max-w-none" />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex space-x-1 xl:space-x-5">
              {!HIDE_MAIN_DASHBOARD.includes(user?.role) && navLink('/', 'Dashboard')}

              {user?.role !== 'SALES_EXECUTIVE' && user?.role !== 'TALLY_CALLER' && user?.role !== 'SALES_ADMIN' && user?.role !== 'ACCOUNTANT' && user?.role !== 'COMPANY_PAYROLL' && navLink('/carry-in-service', 'CarryInService')}

              {(user?.role === 'HOST' || user?.role === 'ADMIN') && navLink('/dc', 'DC')}

              {user?.role === 'HOST' && (
                <>
                  {navLink('/users', 'Role Management')}
                  {navLink('/customers', 'Customers')}
                  {navLink('/analytics', 'Engineer Analytics')}
                  {navLink('/settings/categories', 'Categories')}
                </>
              )}

              {SALES_DASHBOARD_ROLES.includes(user?.role) && navLink('/sales-dashboard', 'Sales Dashboard')}

              {ORDERS_ROLES.includes(user?.role) && navLink('/orders', 'Orders')}
            </div>
          </div>

          <div className="flex items-center space-x-0.5 sm:space-x-1">
            <NotificationBell />

            <span className="text-xs text-gray-700">
              {user?.username} <span className="hidden xl:inline">({user?.role})</span>
            </span>

            <Link
              to="/profile"
              className={`relative hidden sm:block px-1 sm:px-2 py-2 text-xs sm:text-sm font-medium transition-all duration-300 ${
                isActive('/profile') ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Profile
              {isActive('/profile') && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 via-blue-600 to-purple-600 rounded-full"></div>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-1.5 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-gray-200 py-2">
            <div className="flex flex-col space-y-1">
              {!HIDE_MAIN_DASHBOARD.includes(user?.role) && mobileLink('/', 'Dashboard')}

              {user?.role !== 'SALES_EXECUTIVE' && user?.role !== 'TALLY_CALLER' && user?.role !== 'SALES_ADMIN' && user?.role !== 'ACCOUNTANT' && user?.role !== 'COMPANY_PAYROLL' && mobileLink('/carry-in-service', 'CarryInService')}

              {(user?.role === 'HOST' || user?.role === 'ADMIN') && mobileLink('/dc', 'DC')}

              {user?.role === 'HOST' && (
                <>
                  {mobileLink('/users', 'Role Management')}
                  {mobileLink('/customers', 'Customers')}
                  {mobileLink('/analytics', 'Engineer Analytics')}
                  {mobileLink('/settings/categories', 'Categories')}
                </>
              )}

              {SALES_DASHBOARD_ROLES.includes(user?.role) && mobileLink('/sales-dashboard', 'Sales Dashboard')}

              {ORDERS_ROLES.includes(user?.role) && mobileLink('/orders', 'Orders')}

              {mobileLink('/profile', 'Profile')}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
