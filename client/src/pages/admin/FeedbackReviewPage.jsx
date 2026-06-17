import React, { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import adminService from '../../services/adminService';
import { toast } from 'react-toastify';

const FeedbackReviewPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await adminService.getFeedback(page, 10);
      setFeedbacks(res.data?.items || []);
      setTotalPages(res.data?.totalPages || 1);
      setTotalItems(res.data?.totalItems || 0);
    } catch (err) {
      toast.error('Failed to load feedback review list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [page]);

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <>
      <Navbar />
      <div className="container py-5 animate-fade-in">
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h1 className="text-white fw-bold m-0">Citizen Reviews & Feedback</h1>
            <p className="text-secondary m-0">Audit citizen ratings and comments on resolved grievances ({totalItems} total)</p>
          </div>
        </div>

        {loading ? (
          <div className="py-5">
            <LoadingSpinner />
          </div>
        ) : feedbacks.length > 0 ? (
          <>
            <div className="row g-4">
              {feedbacks.map((f) => (
                <div key={f._id} className="col-12 col-md-6">
                  <div className="glass-panel p-4 h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <span className="text-info small fw-bold tracking-wider text-uppercase">
                            {f.complaintId?.category || 'General'}
                          </span>
                          <h5 className="text-white fw-bold m-0 text-truncate mt-1" style={{ maxWidth: '240px' }}>
                            {f.complaintId?.name || 'Deleted Complaint'}
                          </h5>
                        </div>
                        <span className="text-warning fw-bold fs-6">
                          {renderStars(f.rating)}
                        </span>
                      </div>

                      <p className="text-secondary small bg-dark bg-opacity-20 p-3 rounded italic mb-3">
                        "{f.comment}"
                      </p>
                    </div>

                    <div className="border-top border-light border-opacity-5 pt-3 mt-3 d-flex justify-content-between align-items-center">
                      <div className="d-flex flex-column">
                        <span className="text-light small fw-medium">{f.userId?.name || 'Citizen User'}</span>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>{f.userId?.email || 'N/A'}</span>
                      </div>
                      <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {new Date(f.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-5 p-3 glass-panel">
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
            <h4 className="text-white mb-2">No feedback reviews recorded</h4>
            <p className="text-secondary small m-0">No ratings or comments have been submitted yet.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default FeedbackReviewPage;
