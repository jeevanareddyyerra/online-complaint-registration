import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import adminService from '../../services/adminService';
import notificationService from '../../services/notificationService';
import { initiateSocket, getSocket } from '../../services/socket';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const metricsRes = await adminService.getDashboardMetrics();
      if (metricsRes.success) {
        setMetrics(metricsRes.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      toast.error('Failed to load dashboard metrics.');
    }
  };

  const fetchNotifications = async () => {
    try {
      const notifRes = await notificationService.getNotifications();
      // Expecting array of notifications from API
      const notifs = notifRes.data?.notifications || notifRes.data || [];
      setNotifications(notifs.slice(0, 5)); // show only latest 5
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      await Promise.all([fetchDashboardData(), fetchNotifications()]);
      setLoading(false);
    };
    initPage();
  }, []);

  // Setup Socket.IO listener for notifications and live updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = initiateSocket(token);
    if (!socket.connected) {
      socket.connect();
    }

    const handleRealtimeNotification = (newNotification) => {
      // Prepend and keep only top 5
      setNotifications((prev) => [newNotification, ...prev].slice(0, 5));
      // Refresh dashboard counters in case a new ticket or agent registered
      fetchDashboardData();
    };

    socket.on('notification', handleRealtimeNotification);

    return () => {
      socket.off('notification', handleRealtimeNotification);
    };
  }, []);

  const handleNotificationClick = async (n) => {
    setActionLoadingId(n._id);
    if (!n.isRead) {
      try {
        await notificationService.markAsRead(n._id);
        setNotifications((prev) =>
          prev.map((item) => (item._id === n._id ? { ...item, isRead: true } : item))
        );
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
    setActionLoadingId(null);

    // Route navigation based on notification type/details
    if (n.title === 'New Agent Registration') {
      navigate('/admin/agents');
    } else if (n.relatedComplaintId) {
      // Navigate to chat or details as admin
      navigate(`/admin/dashboard`); // default fallback or details if exists
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="py-5">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  const compStats = metrics?.complaints || {};
  const agentStats = metrics?.agents || {};
  const unassignedCount = metrics?.unassignedComplaints || 0;

  return (
    <>
      <Navbar />
      <div className="container py-5 animate-fade-in">
        {/* Header Title Section */}
        <div className="mb-5">
          <h1 className="text-white fw-bold m-0" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Admin Dashboard
          </h1>
          <p className="text-secondary m-0">
            System overview and quick administration actions
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="glass-panel p-4 mb-5">
          <h5 className="text-white mb-3 small fw-semibold uppercase tracking-wider">Quick Actions</h5>
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <Link to="/admin/agents" className="btn btn-gradient w-100 py-3 fw-semibold d-flex align-items-center justify-content-center gap-2">
                <span>Approve Agents</span>
                {agentStats.unapproved > 0 && (
                  <span className="badge bg-danger text-white">{agentStats.unapproved}</span>
                )}
              </Link>
            </div>
            <div className="col-12 col-md-4">
              <Link to="/admin/assignments" className="btn btn-outline-info w-100 py-3 fw-semibold d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: 'var(--radius-sm)' }}>
                <span>Assign Complaints</span>
                {unassignedCount > 0 && (
                  <span className="badge bg-info text-dark">{unassignedCount}</span>
                )}
              </Link>
            </div>
            <div className="col-12 col-md-4">
              <Link to="/admin/analytics" className="btn btn-outline-light w-100 py-3 fw-semibold d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: 'var(--radius-sm)' }}>
                <span>View Analytics</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Dashboard Counters Grid */}
        <div className="row g-4 mb-5">
          {/* Total Complaints */}
          <div className="col-6 col-md-4">
            <div className="glass-panel p-4 text-center h-100 border-start border-primary border-3" style={{ borderColor: 'var(--accent-primary)' }}>
              <span className="text-muted small fw-semibold d-block mb-1">TOTAL COMPLAINTS</span>
              <h2 className="text-white fw-bold m-0" style={{ background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {compStats.total || 0}
              </h2>
            </div>
          </div>

          {/* Pending Complaints */}
          <div className="col-6 col-md-4">
            <div className="glass-panel p-4 text-center h-100 border-start border-warning border-3">
              <span className="text-warning small fw-semibold d-block mb-1">PENDING COMPLAINTS</span>
              <h2 className="text-white fw-bold m-0">
                {compStats.pending || 0}
              </h2>
            </div>
          </div>

          {/* In Progress Complaints */}
          <div className="col-6 col-md-4">
            <div className="glass-panel p-4 text-center h-100 border-start border-info border-3">
              <span className="text-info small fw-semibold d-block mb-1">IN PROGRESS</span>
              <h2 className="text-white fw-bold m-0">
                {compStats.inProgress || 0}
              </h2>
            </div>
          </div>

          {/* Resolved Complaints */}
          <div className="col-6 col-md-4">
            <div className="glass-panel p-4 text-center h-100 border-start border-success border-3">
              <span className="text-success small fw-semibold d-block mb-1">RESOLVED COMPLAINTS</span>
              <h2 className="text-white fw-bold m-0">
                {compStats.resolved || 0}
              </h2>
            </div>
          </div>

          {/* Pending Agent Approvals */}
          <div className="col-6 col-md-4">
            <div className="glass-panel p-4 text-center h-100 border-start border-violet border-3" style={{ borderColor: 'var(--accent-violet)' }}>
              <span className="small fw-semibold d-block mb-1" style={{ color: 'var(--accent-violet)' }}>PENDING AGENT APPROVALS</span>
              <h2 className="text-white fw-bold m-0">
                {agentStats.unapproved || 0}
              </h2>
            </div>
          </div>

          {/* Unassigned Complaints */}
          <div className="col-6 col-md-4">
            <div className="glass-panel p-4 text-center h-100 border-start border-danger border-3" style={{ borderColor: 'var(--accent-error)' }}>
              <span className="text-danger small fw-semibold d-block mb-1">UNASSIGNED COMPLAINTS</span>
              <h2 className="text-white fw-bold m-0">
                {unassignedCount}
              </h2>
            </div>
          </div>
        </div>

        {/* Recent Notifications List */}
        <div className="glass-panel p-4">
          <h5 className="text-white mb-4 small fw-semibold uppercase tracking-wider">Recent Notifications</h5>
          {notifications.length === 0 ? (
            <p className="text-secondary small m-0 text-center py-4">No recent notifications.</p>
          ) : (
            <div className="d-flex flex-column gap-3">
              {notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 border-bottom border-light border-opacity-10 cursor-pointer ${
                    !n.isRead ? 'bg-light bg-opacity-5' : ''
                  }`}
                  style={{
                    borderRadius: 'var(--radius-sm)',
                    transition: 'background-color 0.2s ease',
                    cursor: actionLoadingId === n._id ? 'not-allowed' : 'pointer'
                  }}
                >
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className={`fw-semibold small ${!n.isRead ? 'text-info' : 'text-light'}`}>
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span className="badge bg-info text-dark" style={{ fontSize: '0.65rem' }}>
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-secondary small m-0">{n.message}</p>
                  </div>
                  <span className="text-muted small text-nowrap">{formatDate(n.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
