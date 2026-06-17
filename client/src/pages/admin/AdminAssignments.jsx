import React, { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import adminService from '../../services/adminService';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from 'react-toastify';

const AdminAssignments = () => {
  const [complaints, setComplaints] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  
  // Selected agent IDs for each complaint. Key is complaintId, value is agentId.
  const [selectedAgents, setSelectedAgents] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch unassigned complaints with status Pending
      const compRes = await adminService.getComplaints({
        status: 'Pending',
        unassigned: 'true'
      });

      // Fetch approved agents (up to 100)
      const agentRes = await adminService.getAgents(1, 100, 'true');

      if (compRes.success) {
        setComplaints(compRes.data || []);
      }
      if (agentRes.success) {
        setAgents(agentRes.data?.items || []);
      }
    } catch (err) {
      console.error('Error fetching assignment data:', err);
      toast.error('Failed to load data for complaint assignment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAgentChange = (complaintId, agentId) => {
    setSelectedAgents((prev) => ({
      ...prev,
      [complaintId]: agentId
    }));
  };

  const handleAssign = async (complaintId) => {
    const agentId = selectedAgents[complaintId];
    if (!agentId) {
      toast.warn('Please select an agent to assign.');
      return;
    }

    setAssigningId(complaintId);
    try {
      const res = await adminService.assignComplaint(complaintId, agentId);
      if (res.success) {
        toast.success(res.message || 'Complaint assigned successfully.');
        
        // Remove complaint from local state
        setComplaints((prev) => prev.filter((c) => c._id !== complaintId));
        
        // Clear selection for this complaint
        setSelectedAgents((prev) => {
          const updated = { ...prev };
          delete updated[complaintId];
          return updated;
        });
      } else {
        toast.error(res.message || 'Failed to assign complaint.');
      }
    } catch (err) {
      console.error('Error assigning complaint:', err);
      toast.error(err.response?.data?.message || 'Server error while assigning complaint.');
    } finally {
      setAssigningId(null);
    }
  };

  const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  return (
    <>
      <Navbar />
      <div className="container py-5 animate-fade-in">
        {/* Header Title Section */}
        <div className="mb-5 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h1 className="text-white fw-bold m-0" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Complaint Assignment
            </h1>
            <p className="text-secondary m-0">
              Assign unassigned pending complaints to approved field agents
            </p>
          </div>
          <div className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-3 py-2 fw-semibold fs-6">
            Unassigned: {complaints.length}
          </div>
        </div>

        {loading ? (
          <div className="py-5">
            <LoadingSpinner />
          </div>
        ) : complaints.length === 0 ? (
          <div className="glass-panel p-5 text-center">
            <h4 className="text-muted mb-2">No Complaints to Assign</h4>
            <p className="text-secondary m-0">All pending complaints have been successfully assigned to agents.</p>
          </div>
        ) : (
          <div className="row g-4">
            {complaints.map((complaint) => (
              <div key={complaint._id} className="col-12 col-md-6 col-lg-4">
                <div className="glass-panel p-4 h-100 d-flex flex-column justify-content-between">
                  <div>
                    {/* Header: Title & Status */}
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                      <h5 className="text-white fw-bold m-0 text-truncate" style={{ fontSize: '1.1rem' }} title={complaint.name}>
                        {complaint.name}
                      </h5>
                      <StatusBadge status={complaint.status} />
                    </div>

                    {/* Complaint details */}
                    <div className="mb-4">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted small">Category</span>
                        <span className="badge bg-light bg-opacity-10 text-light small px-2 py-1">{complaint.category}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted small">Location</span>
                        <span className="text-light small fw-medium">{complaint.city}, {complaint.state}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted small">Created Date</span>
                        <span className="text-light small">{formatDate(complaint.createdAt)}</span>
                      </div>
                      {complaint.userId && (
                        <div className="d-flex justify-content-between">
                          <span className="text-muted small">Citizen</span>
                          <span className="text-light small text-truncate fw-medium" style={{ maxWidth: '160px' }} title={complaint.userId.name}>
                            {complaint.userId.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Assignment Actions */}
                  <div className="pt-3 border-top border-light border-opacity-10">
                    <label className="form-label text-muted small fw-semibold mb-2">Select Agent</label>
                    <div className="d-flex gap-2">
                      <select
                        className="form-select bg-dark text-white border-light border-opacity-10 small"
                        style={{ height: '40px', borderRadius: 'var(--radius-sm)' }}
                        value={selectedAgents[complaint._id] || ''}
                        onChange={(e) => handleAgentChange(complaint._id, e.target.value)}
                        disabled={assigningId === complaint._id}
                      >
                        <option value="">-- Choose Agent --</option>
                        {agents.map((agent) => (
                          <option key={agent._id} value={agent._id}>
                            {agent.name}
                          </option>
                        ))}
                      </select>
                      <button
                        className="btn btn-gradient btn-sm px-3 fw-semibold text-nowrap"
                        style={{ height: '40px', borderRadius: 'var(--radius-sm)' }}
                        onClick={() => handleAssign(complaint._id)}
                        disabled={assigningId === complaint._id || !selectedAgents[complaint._id]}
                      >
                        {assigningId === complaint._id ? 'Assigning...' : 'Assign'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default AdminAssignments;
