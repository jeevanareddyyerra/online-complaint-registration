import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import feedbackService from '../../services/feedbackService';
import Navbar from '../../components/common/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const FeedbackPage = () => {
  const { complaintId } = useParams();
  const navigate = useNavigate();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Check if feedback already exists for this complaint
  useEffect(() => {
    const checkFeedback = async () => {
      try {
        const res = await feedbackService.getFeedbackDetails(complaintId);
        // Backend returns success: true, data: { feedback: {...} } or null
        const feedback = res.data?.feedback || res.data;
        if (feedback) {
          setExistingFeedback(feedback);
        }
      } catch (err) {
        // A 404 is expected if feedback hasn't been submitted yet, so we don't spam errors
        console.log('No existing feedback found for this complaint.');
      } finally {
        setLoading(false);
      }
    };

    if (complaintId) {
      checkFeedback();
    }
  }, [complaintId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!rating) {
      setFormError('Please select a rating.');
      return;
    }

    const trimmedComment = comment.trim();
    if (trimmedComment.length < 5) {
      setFormError('Comment must be at least 5 characters.');
      return;
    }

    if (trimmedComment.length > 500) {
      setFormError('Comment cannot exceed 500 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await feedbackService.submitFeedback({
        complaintId,
        rating,
        comment: trimmedComment
      });
      toast.success(res.message || 'Feedback submitted successfully!');
      navigate('/user/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="py-5"><LoadingSpinner /></div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container py-5 animate-fade-in">
        <div className="mb-4">
          <Link to={`/user/complaint/${complaintId}`} className="text-info fw-semibold text-decoration-none small">
            &larr; Back to Ticket Details
          </Link>
        </div>

        <div className="w-100 mx-auto" style={{ maxWidth: '600px' }}>
          <div className="glass-panel p-4 p-md-5">
            {existingFeedback ? (
              /* Display Existing Feedback */
              <div>
                <h3 className="text-white fw-bold mb-2 text-center">Your Feedback</h3>
                <p className="text-secondary small text-center mb-4">Ticket ID: #{complaintId.substring(complaintId.length - 6).toUpperCase()}</p>
                
                <div className="text-center mb-4">
                  <div className="d-flex justify-content-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        style={{ 
                          fontSize: '2rem', 
                          color: star <= existingFeedback.rating ? 'var(--accent-cyan)' : 'var(--text-muted)' 
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="badge bg-light bg-opacity-10 text-info mt-2 px-3 py-1">
                    Rating: {existingFeedback.rating} / 5
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-secondary small d-block mb-1">Your Comments</span>
                  <p className="text-light bg-dark bg-opacity-25 p-3 rounded" style={{ whiteSpace: 'pre-wrap' }}>
                    {existingFeedback.comment}
                  </p>
                </div>

                <div className="mb-2 text-secondary small text-center">
                  Submitted on {new Date(existingFeedback.createdAt).toLocaleDateString('en-US', {
                    dateStyle: 'medium'
                  })}
                </div>
              </div>
            ) : (
              /* Submit New Feedback Form */
              <form onSubmit={handleSubmit}>
                <h3 className="text-white fw-bold mb-2 text-center">Share Your Review</h3>
                <p className="text-secondary small text-center mb-4">
                  How satisfied are you with the resolution of ticket #{complaintId.substring(complaintId.length - 6).toUpperCase()}?
                </p>

                {formError && (
                  <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger p-3 mb-4" role="alert">
                    {formError}
                  </div>
                )}

                {/* Star Rating selector */}
                <div className="mb-4 text-center">
                  <label className="form-label text-secondary small fw-medium d-block mb-2">Overall Rating</label>
                  <div className="d-flex justify-content-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        onClick={() => setRating(star)}
                        style={{
                          cursor: 'pointer',
                          fontSize: '2.5rem',
                          color: star <= rating ? 'var(--accent-cyan)' : 'var(--text-muted)',
                          transition: 'color 0.2s ease',
                          userSelect: 'none'
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="badge bg-light bg-opacity-10 text-info mt-2 px-3 py-1">
                    Score: {rating} / 5
                  </span>
                </div>

                {/* Comment Textarea */}
                <div className="mb-4">
                  <label htmlFor="feedbackComment" className="form-label text-secondary small fw-medium">
                    Comments & Suggestions (min 5, max 500 characters)
                  </label>
                  <textarea
                    id="feedbackComment"
                    rows="4"
                    maxLength="500"
                    className="form-control glass-input"
                    placeholder="Provide details about the resolution efficiency, agent conduct, etc..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  ></textarea>
                  <div className="text-end text-muted small mt-1">
                    {comment.length} / 500 characters
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-gradient w-100 py-3 fw-bold"
                >
                  {submitting ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : null}
                  Submit Review
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FeedbackPage;
