import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import useAuthStore from '../store/authStore';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const { user } = useAuthStore();

  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/notifications');
      setNotifications(response.data);
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
      if (notificationIds.length === 1) {
        await apiClient.delete(`/notifications/${notificationIds[0]}`);
      } else {
        await apiClient.post('/notifications/bulk-delete', {
          notificationIds
        });
      }
      setNotifications(prev => {
        const filtered = prev.filter(n => !notificationIds.includes(n.id));
        setSelectedNotifications(new Set());
        setSelectAll(false);
        return filtered;
      });
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to delete notifications:', error);
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
      // Update selectAll state based on whether all notifications are selected
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
      
      // Listen for real-time notification updates
      const handleNotificationUpdate = () => {
        fetchUnreadCount();
        if (showDropdown) {
          fetchNotifications();
        }
      };
      
      window.addEventListener('notification_update', handleNotificationUpdate);
      
      // Poll for new notifications every 30 seconds as backup
      const interval = setInterval(() => {
        fetchUnreadCount();
        if (showDropdown) {
          fetchNotifications(); // Refresh notifications to remove old ones
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
    }
  }, [showDropdown]);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-700 hover:text-blue-600 focus:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-bell" viewBox="0 0 16 16">
  <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6"/>
</svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-lg border z-50 max-h-[80vh] overflow-hidden flex flex-col">
          <div className="p-2 sm:p-3 border-b">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Notifications</h3>
              {notifications.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="flex items-center text-xs">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="mr-1"
                    />
                    All
                  </label>
                  {selectedNotifications.size > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                    >
                      Delete ({selectedNotifications.size})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-2 sm:p-3 border-b hover:bg-gray-50 ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  } ${selectedNotifications.has(notification.id) ? 'bg-yellow-50' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="mt-1 flex-shrink-0"
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
                      <p className={`text-xs sm:text-sm break-words ${!notification.isRead ? 'font-medium' : ''}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-2 sm:p-3 border-t text-center">
              <button
                onClick={() => setShowDropdown(false)}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800"
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