import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 sm:space-x-8">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            
            <Link to="/" className="text-lg sm:text-2xl font-bold text-blue-600 whitespace-nowrap">
              Deep Infotech
            </Link>
            
            <div className="hidden md:flex space-x-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              
              {user?.role === 'HOST' && (
                <>
                  <Link
                    to="/users"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                  >
                    User Management
                  </Link>
                  <Link
                    to="/customers"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                  >
                    Customer Directory
                  </Link>
                  <Link
                    to="/analytics"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                  >
                    Engineer Analytics
                  </Link>
                  <Link
                    to="/settings/categories"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                  >
                    Category Settings
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-4">
            <NotificationBell />
            
            <span className="text-xs sm:text-sm text-gray-700">
              {user?.username} ({user?.role})
            </span>
            
            <Link
              to="/profile"
              className="hidden sm:block text-gray-700 hover:text-blue-600 px-2 sm:px-3 py-2 rounded-md text-sm font-medium"
            >
              Profile
            </Link>
            
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <div className="flex flex-col space-y-1">
              <Link
                to="/"
                onClick={() => setShowMobileMenu(false)}
                className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              
              <Link
                to="/profile"
                onClick={() => setShowMobileMenu(false)}
                className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
              >
                Profile
              </Link>
              
              {user?.role === 'HOST' && (
                <>
                  <Link
                    to="/users"
                    onClick={() => setShowMobileMenu(false)}
                    className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    User Management
                  </Link>
                  <Link
                    to="/customers"
                    onClick={() => setShowMobileMenu(false)}
                    className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Customer Directory
                  </Link>
                  <Link
                    to="/analytics"
                    onClick={() => setShowMobileMenu(false)}
                    className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Engineer Analytics
                  </Link>
                  <Link
                    to="/settings/categories"
                    onClick={() => setShowMobileMenu(false)}
                    className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Category Settings
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;