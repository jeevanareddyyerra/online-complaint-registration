import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import useComplaint from '../../hooks/useComplaint';
import ComplaintCard from '../../components/complaint/ComplaintCard';
import Navbar from '../../components/common/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import chatService from '../../services/chatService';
import { getSocket } from '../../services/socket';

const MyComplaints = () => {
  const { complaints, getMyComplaints, loading } = useComplaint();
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadMap, setUnreadMap] = useState({});

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [dashboardMetrics, setDashboardMetrics] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });

  // Load complaints with page and status parameters
  const loadComplaints = useCallback(async () => {
    const statusQuery = statusFilter === 'All' ? '' : statusFilter;
    const res = await getMyComplaints(page, 10, statusQuery);
    if (res) {
      setTotalPages(res.totalPages || 1);
      setTotalItems(res.totalItems || 0);
      if (res.metrics) {
        setDashboardMetrics(res.metrics);
      }
    }
  }, [getMyComplaints, page, statusFilter]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  // Reset page to 1 when changing status filter
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // Fetch unread chat message counts
  const fetchUnreadCounts = async () => {
    try {
      const res = await chatService.getUnreadCounts();
      if (res.success && res.data) {
        const counts = {};
        res.data.forEach((item) => {
          counts[item.complaintId] = item.unreadCount;
        });
        setUnreadMap(counts);
      }
    } catch (err) {
      console.error('Error fetching unread chat counts:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCounts();

    const socket = getSocket();
    if (socket) {
      const handleRealtimeUnread = (n) => {
        if (n.title === 'New Chat Message' && n.relatedComplaintId) {
          setUnreadMap((prev) => ({
            ...prev,
            [n.relatedComplaintId]: (prev[n.relatedComplaintId] || 0) + 1,
          }));
        }
      };

      socket.on('notification', handleRealtimeUnread);
      return () => {
        socket.off('notification', handleRealtimeUnread);
      };
    }
  }, []);

  // Aggregate Metrics Calculations (drawn from overall stats)
  const metrics = {
    total: dashboardMetrics.total || 0,
    pending: dashboardMetrics.pending || 0,
    inProgress: dashboardMetrics.inProgress || 0,
    resolved: dashboardMetrics.resolved || 0,
  };

  // Filter complaints list by search term
  const filteredComplaints = complaints.filter((c) => {
    const nameStr = c.name || '';
    const categoryStr = c.category || '';
    const commentStr = c.comment || '';
    const idStr = c._id || '';
    const matchesSearch = nameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          categoryStr.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          commentStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          idStr.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      <Navbar />
      <div className="container py-5 animate-fade-in">
        {/* Header Section */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-5 gap-3">
          <div>
            <h1 className="text-white fw-bold m-0">My Complaints</h1>
            <p className="text-secondary m-0">Lodge, track progress, and review your registered grievances</p>
          </div>
          <Link to="/user/lodge" className="btn btn-gradient px-4 py-2 text-decoration-none">
            + Lodge a Complaint
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="row g-4 mb-5">
          <div className="col-6 col-md-3">
            <div className="glass-panel p-3 text-center">
              <span className="text-muted small fw-semibold d-block mb-1">TOTAL LODGED</span>
              <h3 className="text-white fw-bold m-0">{metrics.total}</h3>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="glass-panel p-3 text-center border-start border-warning border-3">
              <span className="text-warning small fw-semibold d-block mb-1">PENDING</span>
              <h3 className="text-white fw-bold m-0">{metrics.pending}</h3>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="glass-panel p-3 text-center border-start border-info border-3">
              <span className="text-info small fw-semibold d-block mb-1">IN PROGRESS</span>
              <h3 className="text-white fw-bold m-0">{metrics.inProgress}</h3>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="glass-panel p-3 text-center border-start border-success border-3">
              <span className="text-success small fw-semibold d-block mb-1">RESOLVED</span>
              <h3 className="text-white fw-bold m-0">{metrics.resolved}</h3>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="glass-panel p-4 mb-4">
          <div className="row g-3 align-items-center">
            {/* Search */}
            <div className="col-md-5">
              <input
                type="text"
                className="form-control glass-input"
                placeholder="Search subject, category or comment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Status Tabs */}
            <div className="col-md-7">
              <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                {['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`btn btn-sm px-3 py-2 fw-semibold ${statusFilter === status ? 'btn-gradient' : 'btn-outline-secondary text-secondary border-secondary border-opacity-25'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Complaints List Grid */}
        {loading ? (
          <div className="py-5">
            <LoadingSpinner />
          </div>
        ) : filteredComplaints.length > 0 ? (
          <>
            <div className="row g-4">
              {filteredComplaints.map((complaint) => (
                <div key={complaint._id} className="col-md-6 col-lg-4">
                  <ComplaintCard 
                    complaint={complaint} 
                    unreadCount={unreadMap[complaint._id] || 0} 
                  />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-5 p-3 glass-panel">
                <button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="btn btn-sm btn-outline-secondary text-secondary border-secondary border-opacity-25 px-4 py-2"
                >
                  Previous
                </button>
                <span className="text-secondary small fw-medium">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="btn btn-sm btn-outline-secondary text-secondary border-secondary border-opacity-25 px-4 py-2"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="glass-panel p-5 text-center my-4">
            <h4 className="text-white mb-2">No complaints found</h4>
            <p className="text-secondary small mb-4">
              {searchTerm || statusFilter !== 'All' 
                ? "No tickets match your filters. Try adjusting search queries." 
                : "You have not lodged any complaints yet."}
            </p>
            {!searchTerm && statusFilter === 'All' && (
              <Link to="/user/lodge" className="btn btn-gradient px-4 py-2">
                File a Grievance Now
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default MyComplaints;
