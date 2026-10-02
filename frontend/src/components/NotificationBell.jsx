import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/apiClient';
import useAuthStore from '../store/authStore';
import { animateBellRing, animateModalSpring } from '../utils/animations';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const { user } = useAuthStore();
  const bellRef = useRef(null);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    if (unreadCount > 0 && bellRef.current) {
      animateBellRing(bellRef.current);
    }
  }, [unreadCount]);

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/notifications');
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const deleteNotifications = async (notificationIds) => {
    try {
      setNotifications(prev => {
        const filtered = prev.filter(n => !notificationIds.includes(n.id));
        setSelectedNotifications(new Set());
        setSelectAll(false);
        return filtered;
      });
      
      if (notificationIds.length === 1) {
        await apiClient.delete(`/notifications/${notificationIds[0]}`);
      } else {
        await apiClient.post('/notifications/bulk-delete', {
          notificationIds
        });
      }
      
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to delete notifications:', error);
      fetchNotifications();
      fetchUnreadCount();
    }
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      setSelectAll(newSet.size === notifications.length);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleDeleteSelected = () => {
    if (selectedNotifications.size > 0) {
      deleteNotifications(Array.from(selectedNotifications));
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      
      const handleNotificationUpdate = (event) => {
        fetchUnreadCount();
        if (showDropdown) {
          fetchNotifications();
        }
        
        if (event.detail && event.detail.userId === user.username) {
          setUnreadCount(prev => prev + 1);
          if (bellRef.current) animateBellRing(bellRef.current);
          if (showDropdown) {
            setTimeout(fetchNotifications, 100);
          }
        }
      };
      
      window.addEventListener('notification_update', handleNotificationUpdate);
      
      const interval = setInterval(() => {
        fetchUnreadCount();
        if (showDropdown) {
          fetchNotifications();
        }
      }, 30000);
      
      return () => {
        window.removeEventListener('notification_update', handleNotificationUpdate);
        clearInterval(interval);
      };
    }
  }, [user, showDropdown]);

  useEffect(() => {
    if (showDropdown) {
      fetchNotifications();
      setSelectedNotifications(new Set());
      setSelectAll(false);
      if (dropdownRef.current) {
        animateModalSpring(dropdownRef.current);
      }
    }
  }, [showDropdown]);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={() => setShowDropdown(!showDropdown)}
        className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          showDropdown ? 'bg-[#FFE8EB] text-[#FF2E46]' : 'text-gray-600 hover:text-[#FF2E46] hover:bg-gray-100'
        }`}
        title="Notifications"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#FF2E46] text-white text-[10px] font-bold rounded-md px-1 min-w-[16px] h-4 flex items-center justify-center shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div ref={dropdownRef} className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-[#E0E2E5] z-50 max-h-[80vh] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#E0E2E5] bg-[#F8F9FA] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#FFE8EB] text-[#FF2E46] flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="font-bold text-[#2C2C2C] text-sm">Notifications</h3>
            </div>
            {notifications.length > 0 && (
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="accent-[#FF2E46] rounded"
                  />
                  All
                </label>
                {selectedNotifications.size > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="bg-[#FF2E46] text-white px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-[#E02038] transition-colors shadow-xs"
                  >
                    Delete ({selectedNotifications.size})
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-[#E0E2E5]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs font-medium">
                No notifications to display
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3.5 transition-colors ${
                    !notification.isRead && notification.type !== 'VISITED_DUPLICATE_CALL' ? 'bg-[#FFE8EB]/20' : 'hover:bg-gray-50'
                  } ${selectedNotifications.has(notification.id) ? 'bg-amber-50/50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="mt-1 flex-shrink-0 accent-[#FF2E46] rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <p className={`text-xs break-words leading-relaxed ${
                        !notification.isRead ? 'font-bold text-[#2C2C2C]' : 'text-gray-600'
                      } ${
                        notification.type === 'VISITED_DUPLICATE_CALL' ? 'text-[#FF2E46] font-bold' : ''
                      }`}>
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-[#FF2E46]"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-2.5 border-t border-[#E0E2E5] bg-[#F8F9FA] text-center">
              <button
                onClick={() => setShowDropdown(false)}
                className="text-xs font-bold text-gray-500 hover:text-[#2C2C2C] uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;