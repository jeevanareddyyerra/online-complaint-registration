import React, { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import adminService from '../../services/adminService';
import { toast } from 'react-toastify';

const UserListPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers(page, 10);
      setUsers(res.data?.items || []);
      setTotalPages(res.data?.totalPages || 1);
      setTotalItems(res.data?.totalItems || 0);
    } catch (err) {
      toast.error('Failed to load users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  return (
    <>
      <Navbar />
      <div className="container py-5 animate-fade-in">
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h1 className="text-white fw-bold m-0">Registered Citizens</h1>
            <p className="text-secondary m-0">Review profiles and contact details of registered portal users ({totalItems} total)</p>
          </div>
        </div>

        {loading ? (
          <div className="py-5">
            <LoadingSpinner />
          </div>
        ) : users.length > 0 ? (
          <>
            <div className="glass-panel p-4">
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle mb-0" style={{ background: 'transparent' }}>
                  <thead>
                    <tr className="text-secondary small">
                      <th scope="col" className="border-bottom border-light border-opacity-10 py-3">NAME</th>
                      <th scope="col" className="border-bottom border-light border-opacity-10 py-3">EMAIL</th>
                      <th scope="col" className="border-bottom border-light border-opacity-10 py-3">PHONE</th>
                      <th scope="col" className="border-bottom border-light border-opacity-10 py-3">REGISTERED ON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((citizen) => (
                      <tr key={citizen._id}>
                        <td className="border-bottom border-light border-opacity-5 py-3 text-white fw-medium">{citizen.name}</td>
                        <td className="border-bottom border-light border-opacity-5 py-3 text-secondary">{citizen.email}</td>
                        <td className="border-bottom border-light border-opacity-5 py-3 text-secondary">{citizen.phone}</td>
                        <td className="border-bottom border-light border-opacity-5 py-3 text-muted small">
                          {new Date(citizen.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
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
            <h4 className="text-white mb-2">No users registered</h4>
            <p className="text-secondary small m-0">No citizen profiles have been created on the portal yet.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default UserListPage;
