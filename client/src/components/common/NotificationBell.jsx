import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import notificationService from '../../services/notificationService';
import { initiateSocket, getSocket } from '../../services/socket';
import { toast } from 'react-toastify';

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res.data?.notifications || res.data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err.message);
    }
  };

  // Fetch initial notifications and setup Socket.IO listener
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect / retrieve global socket
    const socket = initiateSocket(token);
    if (!socket.connected) {
      socket.connect();
    }

    const handleRealtimeNotification = (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
      toast.info(`🔔 ${newNotification.title}: ${newNotification.message}`);
    };

    socket.on('notification', handleRealtimeNotification);

    // Watchdog timer to auto-reconnect socket if any page disconnects it
    const connectionWatchdog = setInterval(() => {
      const currentSocket = getSocket();
      if (currentSocket && !currentSocket.connected) {
        currentSocket.connect();
      }
    }, 5000);

    return () => {
      socket.off('notification', handleRealtimeNotification);
      clearInterval(connectionWatchdog);
    };
  }, [user]);

  const handleNotificationClick = async (n) => {
    // 1. Mark as read on backend (if not already read)
    if (!n.isRead) {
      try {
        await notificationService.markAsRead(n._id);
        setNotifications((prev) =>
          prev.map((item) => (item._id === n._id ? { ...item, isRead: true } : item))
        );
      } catch (err) {
        console.error('Failed to mark notification as read:', err.message);
      }
    }

    // 2. Navigate based on notification details
    if (n.title === 'New Agent Registration') {
      navigate('/admin/agents');
      return;
    }

    if (!n.relatedComplaintId) return;

    const isChatMessage = n.title === 'New Chat Message';
    if (user.role === 'Ordinary') {
      if (isChatMessage) {
        navigate(`/user/chat/${n.relatedComplaintId}`);
      } else {
        navigate(`/user/complaint/${n.relatedComplaintId}`);
      }
    } else if (user.role === 'Agent') {
      if (isChatMessage) {
        navigate(`/agent/chat/${n.relatedComplaintId}`);
      } else {
        navigate(`/agent/dashboard`);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error('Failed to mark notifications as read.');
    }
  };

  if (!user) return null;

  return (
    <div className="dropdown">
      <button
        className="btn btn-link text-dark position-relative p-2"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        style={{ textDecoration: 'none', boxShadow: 'none' }}
      >
        <span className="fs-5">🔔</span>
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-danger border border-white"
            style={{ fontSize: '0.65rem', padding: '0.25em 0.4em' }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      <ul
        className="dropdown-menu dropdown-menu-end glass-panel p-3 mt-2 animate-fade-in shadow"
        style={{
          width: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-10">
          <span className="text-dark fw-bold small">Notifications</span>
          {unreadCount > 0 && (
            <button
              className="btn btn-link btn-sm text-primary p-0 text-decoration-none small fw-semibold"
              style={{ fontSize: '0.75rem' }}
              onClick={handleMarkAllRead}
            >
              Mark all read
            </button>
          )}
        </div>

        {notifications.length > 0 ? (
          notifications.map((n) => (
            <li
              key={n._id}
              className={`p-2 mb-1 rounded ${!n.isRead ? 'bg-primary bg-opacity-10' : 'bg-transparent'}`}
              style={{ cursor: 'pointer', transition: 'background-color 0.2s ease' }}
              onClick={() => handleNotificationClick(n)}
            >
              <div className="d-flex flex-column text-start">
                <span className={`small text-dark ${!n.isRead ? 'fw-bold text-primary' : ''}`}>
                  {n.title}
                </span>
                <span
                  className="text-secondary small mt-1 text-wrap"
                  style={{ fontSize: '0.75rem', lineHeight: '1.25', wordBreak: 'break-word' }}
                >
                  {n.message}
                </span>
                <span className="text-muted mt-1" style={{ fontSize: '0.65rem' }}>
                  {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </li>
          ))
        ) : (
          <div className="text-center text-secondary small py-4">No notifications yet</div>
        )}
      </ul>
    </div>
  );
};

export default NotificationBell;
