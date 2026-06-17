import React, { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import adminService from '../../services/adminService';
import { toast } from 'react-toastify';

const AgentListPage = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAgents(page, 10);
      setAgents(res.data?.items || []);
      setTotalPages(res.data?.totalPages || 1);
      setTotalItems(res.data?.totalItems || 0);
    } catch (err) {
      toast.error('Failed to load agents list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [page]);

  const handleApprove = async (id) => {
    setActionLoadingId(id);
    try {
      const res = await adminService.approveAgent(id);
      toast.success(res.message || 'Agent approved successfully.');
      fetchAgents();
    } catch (err) {
      toast.error('Failed to approve agent account.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevoke = async (id) => {
    setActionLoadingId(id);
    try {
      const res = await adminService.revokeAgent(id);
      toast.success(res.message || 'Agent approval revoked.');
      fetchAgents();
    } catch (err) {
      toast.error('Failed to revoke agent account.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-5 animate-fade-in">
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h1 className="text-white fw-bold m-0">Registered Field Agents</h1>
            <p className="text-secondary m-0">Approve new agents or manage active credentials ({totalItems} total)</p>
          </div>
        </div>

        {loading ? (
          <div className="py-5">
            <LoadingSpinner />
          </div>
        ) : agents.length > 0 ? (
          <>
            <div className="glass-panel p-4">
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle mb-0" style={{ background: 'transparent' }}>
                  <thead>
                    <tr className="text-secondary small">
                      <th scope="col" className="border-bottom border-light border-opacity-10 py-3">NAME</th>
                      <th scope="col" className="border-bottom border-light border-opacity-10 py-3">EMAIL</th>
                      <th scope="col" className="border-bottom border-light border-opacity-10 py-3">PHONE</th>
                      <th scope="col" className="border-bottom border-light border-opacity-10 py-3">STATUS</th>
                      <th scope="col" className="border-bottom border-light border-opacity-10 py-3 text-end">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((agent) => (
                      <tr key={agent._id}>
                        <td className="border-bottom border-light border-opacity-5 py-3 text-white fw-medium">{agent.name}</td>
                        <td className="border-bottom border-light border-opacity-5 py-3 text-secondary">{agent.email}</td>
                        <td className="border-bottom border-light border-opacity-5 py-3 text-secondary">{agent.phone}</td>
                        <td className="border-bottom border-light border-opacity-5 py-3">
                          {agent.isApproved ? (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1.5 fw-semibold">
                              Approved
                            </span>
                          ) : (
                            <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2.5 py-1.5 fw-semibold">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="border-bottom border-light border-opacity-5 py-3 text-end">
                          {agent.isApproved ? (
                            <button
                              onClick={() => handleRevoke(agent._id)}
                              disabled={actionLoadingId === agent._id}
                              className="btn btn-sm btn-outline-danger px-3 py-1.5 fw-semibold"
                              style={{ borderRadius: 'var(--radius-sm)' }}
                            >
                              {actionLoadingId === agent._id ? 'Processing...' : 'Revoke'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApprove(agent._id)}
                              disabled={actionLoadingId === agent._id}
                              className="btn btn-sm btn-gradient px-3 py-1.5"
                              style={{ borderRadius: 'var(--radius-sm)' }}
                            >
                              {actionLoadingId === agent._id ? 'Processing...' : 'Approve'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-4 p-3 glass-panel">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="btn btn-sm btn-outline-secondary text-secondary border-secondary border-opacity-25 px-4 py-2"
                >
                  Previous
                </button>
                <span className="text-secondary small fw-medium">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
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
            <h4 className="text-white mb-2">No agents registered</h4>
            <p className="text-secondary small m-0">No field agent accounts have been created yet.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default AgentListPage;
