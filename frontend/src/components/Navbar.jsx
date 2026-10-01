import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import NotificationBell from './NotificationBell';

const SALES_DASHBOARD_ROLES = ['HOST', 'SALES_EXECUTIVE', 'TALLY_CALLER', 'SALES_ADMIN'];
const ORDERS_ROLES = ['HOST', 'ACCOUNTANT', 'SALES_EXECUTIVE', 'COMPANY_PAYROLL', 'SALES_ADMIN', 'COMPANY_BASED_ACCESS'];
const HIDE_MAIN_DASHBOARD = ['SALES_EXECUTIVE', 'TALLY_CALLER', 'SALES_ADMIN', 'ACCOUNTANT', 'COMPANY_PAYROLL', 'COMPANY_BASED_ACCESS'];

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLink = (to, label, extraClass = '') => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        className={`relative px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-all duration-150 whitespace-nowrap ${extraClass} ${
          active
            ? 'text-[#FF2E46] bg-[#FFE8EB]/70 font-semibold'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/70'
        }`}
      >
        {label}
        {active && (
          <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#FF2E46] rounded-full" />
        )}
      </Link>
    );
  };

  const mobileLink = (to, label) => (
    <Link
      to={to}
      onClick={() => setShowMobileMenu(false)}
      className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive(to)
          ? 'text-[#FF2E46] bg-[#FFE8EB] font-semibold'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-white shadow-xs border-b border-gray-200">
      {/* Top Utility Bar */}
      <div className="bg-[#2C2C2C] text-white text-[11px] sm:text-xs py-1 px-4 sm:px-6">
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#FF2E46]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2E46]"></span>
              Since 2003 • 20+ Years of Trust
            </span>
            <span className="hidden md:inline text-gray-500">|</span>
            <span className="hidden md:inline text-gray-300">Unjha • Mehsana • Ahmedabad, Gujarat</span>
          </div>
          <div className="flex items-center gap-4 text-gray-300">
            <span className="hidden sm:inline">Authorized Dell &amp; HP Dealer</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-200 font-medium">CallFlow Enterprise</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Left: Hamburger & Brand */}
          <div className="flex items-center space-x-3 lg:space-x-6">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <Link to="/" className="flex items-center gap-2">
              <img
                src="/deep.png"
                alt="Deep Infotech"
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation links */}
            <div className="hidden lg:flex items-center space-x-1">
              {!HIDE_MAIN_DASHBOARD.includes(user?.role) && navLink('/', 'Dashboard')}

              {user?.role !== 'SALES_EXECUTIVE' && user?.role !== 'TALLY_CALLER' && user?.role !== 'SALES_ADMIN' && user?.role !== 'ACCOUNTANT' && user?.role !== 'COMPANY_PAYROLL' && user?.role !== 'COMPANY_BASED_ACCESS' && navLink('/carry-in-service', 'Carry In Service')}

              {(user?.role === 'HOST' || user?.role === 'ADMIN') && navLink('/dc', 'DC')}

              {user?.role === 'HOST' && (
                <>
                  {navLink('/users', 'Role Management')}
                  {navLink('/customers', 'Customers')}
                  {navLink('/analytics', 'Engineer Analytics')}

                  {/* Settings dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSettingsDropdown((prev) => !prev)}
                      className={`relative px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-all duration-150 flex items-center gap-1 ${
                        isActive('/settings')
                          ? 'text-[#FF2E46] bg-[#FFE8EB]/70 font-semibold'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/70'
                      }`}
                    >
                      Settings
                      <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform ${showSettingsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showSettingsDropdown && (
                      <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[170px] py-1 animate-fadeIn">
                        <Link
                          to="/settings/categories"
                          onClick={() => setShowSettingsDropdown(false)}
                          className="block px-4 py-2 text-xs xl:text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#FF2E46]"
                        >
                          Categories
                        </Link>
                        <Link
                          to="/settings/brands"
                          onClick={() => setShowSettingsDropdown(false)}
                          className="block px-4 py-2 text-xs xl:text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#FF2E46]"
                        >
                          Brands
                        </Link>
                        <Link
                          to="/settings/locations"
                          onClick={() => setShowSettingsDropdown(false)}
                          className="block px-4 py-2 text-xs xl:text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#FF2E46]"
                        >
                          Locations
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}

              {SALES_DASHBOARD_ROLES.includes(user?.role) && navLink('/sales-dashboard', 'Sales Dashboard')}
              {ORDERS_ROLES.includes(user?.role) && navLink('/orders', 'Orders')}
            </div>
          </div>

          {/* Right: Notification, Profile, Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-gray-900 leading-none">{user?.username}</span>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mt-0.5">{user?.role}</span>
            </div>

            <Link
              to="/profile"
              className={`hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isActive('/profile')
                  ? 'border-[#FF2E46]/30 bg-[#FFE8EB] text-[#FF2E46]'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Profile
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#FF2E46] hover:bg-[#FF5A71] shadow-xs transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-gray-200 py-3 animate-fadeIn">
            <div className="flex flex-col space-y-1">
              {!HIDE_MAIN_DASHBOARD.includes(user?.role) && mobileLink('/', 'Dashboard')}

              {user?.role !== 'SALES_EXECUTIVE' && user?.role !== 'TALLY_CALLER' && user?.role !== 'SALES_ADMIN' && user?.role !== 'ACCOUNTANT' && user?.role !== 'COMPANY_PAYROLL' && user?.role !== 'COMPANY_BASED_ACCESS' && mobileLink('/carry-in-service', 'Carry In Service')}

              {(user?.role === 'HOST' || user?.role === 'ADMIN') && mobileLink('/dc', 'DC')}

              {user?.role === 'HOST' && (
                <>
                  {mobileLink('/users', 'Role Management')}
                  {mobileLink('/customers', 'Customers')}
                  {mobileLink('/analytics', 'Engineer Analytics')}
                  <div className="pt-2 pb-1 px-3.5 text-[11px] font-bold uppercase text-gray-500 tracking-wider">
                    Settings
                  </div>
                  {mobileLink('/settings/categories', '• Categories')}
                  {mobileLink('/settings/brands', '• Brands')}
                  {mobileLink('/settings/locations', '• Locations')}
                </>
              )}

              {SALES_DASHBOARD_ROLES.includes(user?.role) && mobileLink('/sales-dashboard', 'Sales Dashboard')}
              {ORDERS_ROLES.includes(user?.role) && mobileLink('/orders', 'Orders')}
              {mobileLink('/profile', 'My Profile')}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
