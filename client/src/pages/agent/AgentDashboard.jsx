import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import complaintService from '../../services/complaintService';
import Navbar from '../../components/common/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from 'react-toastify';
import chatService from '../../services/chatService';
import { getSocket } from '../../services/socket';

const AgentDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [unreadMap, setUnreadMap] = useState({});

  // Fetch unread chat counts for assigned tasks
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
  
  // Resolution form states
  const [activeResolveId, setActiveResolveId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch agent tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await complaintService.getActiveTasks();
      const fetched = res.data?.assignments || res.data || [];
      setAssignments(fetched);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load assigned tasks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Accept task handler
  const handleAccept = async (assignmentId) => {
    try {
      const res = await complaintService.acceptTask(assignmentId);
      toast.success(res.message || 'Task accepted successfully.');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept task.');
    }
  };

  // Resolve task handler
  const handleResolveSubmit = async (e, assignmentId) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      toast.error('Please provide resolution details.');
      return;
    }
    if (resolutionNotes.trim().length < 5) {
      toast.error('Resolution notes must be at least 5 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await complaintService.resolveTask(assignmentId, resolutionNotes);
      toast.success(res.message || 'Complaint marked as resolved.');
      setActiveResolveId(null);
      setResolutionNotes('');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve task.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Metrics for Dashboard stats
  const metrics = {
    total: assignments.length,
    assigned: assignments.filter(a => a.status === 'Technician Assigned').length,
    active: assignments.filter(a => a.status === 'Work Started').length,
    resolved: assignments.filter(a => a.status === 'Resolved').length,
  };

  // Filtered assignments
  const filteredAssignments = assignments.filter((a) => {
    if (statusFilter === 'All') return true;
    return a.status === statusFilter;
  });

  return (
    <>
      <Navbar />
      <div className="container py-5 animate-fade-in">
        {/* Welcome Header */}
        <div className="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-3">
          <div>
            <h1 className="text-white fw-bold m-0">Officer Task Queue</h1>
            <p className="text-secondary m-0">Welcome back, <span className="text-light fw-semibold">{user?.name}</span>. Review and resolve assignments.</p>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="row g-4 mb-5">
          <div className="col-6 col-md-3">
            <div className="glass-panel p-3 text-center">
              <span className="text-muted small fw-semibold d-block mb-1">ASSIGNED JOBS</span>
              <h3 className="text-white fw-bold m-0">{metrics.total}</h3>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="glass-panel p-3 text-center border-start border-warning border-3">
              <span className="text-warning small fw-semibold d-block mb-1">AWAITING ACCEPTANCE</span>
              <h3 className="text-white fw-bold m-0">{metrics.assigned}</h3>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="glass-panel p-3 text-center border-start border-info border-3">
              <span className="text-info small fw-semibold d-block mb-1">ACTIVE RESOLUTIONS</span>
              <h3 className="text-white fw-bold m-0">{metrics.active}</h3>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="glass-panel p-3 text-center border-start border-success border-3">
              <span className="text-success small fw-semibold d-block mb-1">RESOLVED TASKS</span>
              <h3 className="text-white fw-bold m-0">{metrics.resolved}</h3>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="glass-panel p-3 mb-4">
          <div className="d-flex flex-wrap gap-2 justify-content-start">
            {[
              { label: 'All Jobs', filter: 'All' },
              { label: 'Awaiting Acceptance', filter: 'Technician Assigned' },
              { label: 'In Progress', filter: 'Work Started' },
              { label: 'Resolved', filter: 'Resolved' }
            ].map((tab) => (
              <button
                key={tab.filter}
                onClick={() => setStatusFilter(tab.filter)}
                className={`btn btn-sm px-3 py-2 fw-semibold ${statusFilter === tab.filter ? 'btn-gradient' : 'btn-outline-secondary text-secondary border-secondary border-opacity-25'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Task Grid */}
        {loading ? (
          <div className="py-5">
            <LoadingSpinner />
          </div>
        ) : filteredAssignments.length > 0 ? (
          <div className="row g-4">
            {filteredAssignments.map((assignment) => {
              const ticket = assignment.complaintId;
              
              // Handle case where complaint reference might be deleted/missing
              if (!ticket) return null;

              const isResolving = activeResolveId === assignment._id;

              return (
                <div key={assignment._id} className="col-md-6">
                  <div className="glass-card h-100 p-4 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
                        <h5 className="text-white fw-bold m-0 text-truncate" title={ticket.name}>{ticket.name}</h5>
                        <StatusBadge status={assignment.status} />
                      </div>
                      
                      <div className="mb-3">
                        <span className="badge bg-light bg-opacity-10 text-info small">{ticket.category}</span>
                      </div>

                      <div className="mb-3 text-secondary small">
                        <p className="m-0 mb-1">
                          <strong>Location:</strong> {ticket.address}, {ticket.city}, {ticket.state} - {ticket.pincode}
                        </p>
                        <p className="m-0 mb-1">
                          <strong>Assigned On:</strong> {formatDate(assignment.assignedAt)}
                        </p>
                        {assignment.resolvedAt && (
                          <p className="m-0 text-success">
                            <strong>Resolved On:</strong> {formatDate(assignment.resolvedAt)}
                          </p>
                        )}
                      </div>

                      <p className="text-secondary small bg-dark bg-opacity-25 p-3 rounded mb-4" style={{ minHeight: '60px' }}>
                        {ticket.comment}
                      </p>
                    </div>

                    {/* Action Panel */}
                    <div className="border-top border-light border-opacity-10 pt-3 mt-auto">
                      {assignment.status === 'Technician Assigned' && (
                        <button
                          onClick={() => handleAccept(assignment._id)}
                          className="btn btn-gradient w-100 py-2 fw-semibold"
                        >
                          Accept Assignment
                        </button>
                      )}

                      {assignment.status === 'Work Started' && !isResolving && (
                        <div className="d-flex flex-column gap-2">
                          <Link
                            to={`/agent/chat/${ticket._id}`}
                            className="btn btn-gradient w-100 py-2 fw-semibold text-center text-decoration-none"
                          >
                            💬 Open Chat {unreadMap[ticket._id] > 0 ? `(${unreadMap[ticket._id]})` : ''}
                          </Link>
                          <button
                            onClick={() => setActiveResolveId(assignment._id)}
                            className="btn btn-outline-info text-info border-info border-opacity-50 hover-bg-info w-100 py-2 fw-semibold"
                          >
                            Submit Resolution Notes
                          </button>
                        </div>
                      )}

                      {isResolving && (
                        <form onSubmit={(e) => handleResolveSubmit(e, assignment._id)} className="animate-fade-in">
                          <div className="mb-3">
                            <label htmlFor={`notes-${assignment._id}`} className="form-label text-info small fw-medium">
                              Resolution notes / Description of fix
                            </label>
                            <textarea
                              id={`notes-${assignment._id}`}
                              rows="3"
                              className="form-control glass-input small"
                              placeholder="Describe actions taken to fix the issue..."
                              value={resolutionNotes}
                              onChange={(e) => setResolutionNotes(e.target.value)}
                              required
                            ></textarea>
                          </div>
                          <div className="d-flex gap-2">
                            <button type="submit" disabled={submitting} className="btn btn-gradient btn-sm px-3 flex-grow-1">
                              {submitting ? 'Submitting...' : 'Confirm Fix'}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setActiveResolveId(null); setResolutionNotes(''); }}
                              className="btn btn-outline-secondary btn-sm text-secondary px-3"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}

                      {assignment.status === 'Resolved' && (
                        <div className="p-3 bg-success bg-opacity-10 rounded border border-success border-opacity-25">
                          <span className="text-success small fw-semibold d-block mb-1">Resolution Details</span>
                          <p className="text-light small m-0 italic">"{assignment.resolutionNotes}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel p-5 text-center my-4">
            <h4 className="text-white mb-2">No jobs in queue</h4>
            <p className="text-secondary small m-0">
              {statusFilter !== 'All' 
                ? "No tasks match your filter criteria." 
                : "You are currently caught up with all assignments."}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default AgentDashboard;
