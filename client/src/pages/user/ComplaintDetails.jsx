import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useComplaint from '../../hooks/useComplaint';
import Navbar from '../../components/common/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';

const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getComplaintDetails, currentComplaint, updateComplaint, cancelComplaint, reopenComplaint, loading } = useComplaint();

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [comment, setComment] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Reopen States
  const [isReopening, setIsReopening] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  // Local Validation Error
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (id) {
      getComplaintDetails(id);
    }
  }, [id, getComplaintDetails]);

  // Populate edit fields when complaint is loaded or edit mode starts
  useEffect(() => {
    if (currentComplaint) {
      setName(currentComplaint.name || '');
      setCategory(currentComplaint.category || '');
      setComment(currentComplaint.comment || '');
      setAddress(currentComplaint.address || '');
      setCity(currentComplaint.city || '');
      setState(currentComplaint.state || '');
      setPincode(String(currentComplaint.pincode || ''));
    }
  }, [currentComplaint, isEditing]);

  if (loading && !currentComplaint) {
    return (
      <>
        <Navbar />
        <div className="py-5"><LoadingSpinner /></div>
      </>
    );
  }

  if (!currentComplaint) {
    return (
      <>
        <Navbar />
        <div className="container py-5 text-center">
          <div className="glass-panel p-5">
            <h3 className="text-danger">Complaint Not Found</h3>
            <p className="text-secondary">We could not retrieve the details for this ticket ID.</p>
            <Link to="/user/dashboard" className="btn btn-gradient mt-3">Back to Dashboard</Link>
          </div>
        </div>
      </>
    );
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name || !category || !comment || !address || !city || !state || !pincode) {
      setFormError('Please fill in all fields.');
      return;
    }

    if (name.trim().length < 3) {
      setFormError('Complaint title must be at least 3 characters.');
      return;
    }

    if (comment.trim().length < 10) {
      setFormError('Comment must be at least 10 characters.');
      return;
    }

    const pin = pincode.trim();
    if (isNaN(pin) || pin.length !== 6) {
      setFormError('Pincode must be exactly 6 digits.');
      return;
    }

    try {
      await updateComplaint(id, {
        name,
        category,
        address,
        city,
        state,
        pincode: Number(pin),
        comment,
      });
      setIsEditing(false);
    } catch (err) {
      // Caught in context toast
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this complaint?')) {
      try {
        await cancelComplaint(id);
        navigate('/user/dashboard');
      } catch (err) {
        // Caught in context
      }
    }
  };

  const handleReopen = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) {
      setFormError('Please provide a reason to reopen the complaint.');
      return;
    }

    try {
      await reopenComplaint(id, reopenReason);
      setIsReopening(false);
      setReopenReason('');
    } catch (err) {
      // Caught in context
    }
  };

  // Get active step index for visual timeline
  const getTimelineStep = (statusVal) => {
    switch (statusVal) {
      case 'Pending': return 1;
      case 'In Progress': return 2;
      case 'Work Started': return 3;
      case 'Resolved': return 4;
      default: return 0; // Cancelled / Rejected
    }
  };
  const timelineStep = getTimelineStep(currentComplaint.status);

  console.log("Complaint Status:", currentComplaint.status);
  console.log(currentComplaint);
  return (
    <>
      <Navbar />
      <div className="container py-5 animate-fade-in">
        <div className="mb-4">
          <Link to="/user/dashboard" className="text-info fw-semibold text-decoration-none small">
            &larr; Back to Dashboard
          </Link>
        </div>

        {/* Timeline Progress Tracker */}
        {currentComplaint.status !== 'Cancelled' && currentComplaint.status !== 'Rejected' && (
          <div className="glass-panel p-4 mb-5">
            <h5 className="text-white mb-4 small fw-semibold tracking-wider text-uppercase">Tracking Timeline</h5>
            <div className="d-flex justify-content-between align-items-center position-relative py-3">
              {/* Progress Line */}
              <div
                className="position-absolute bg-secondary opacity-25"
                style={{ height: '3px', top: '50%', left: '10%', right: '10%', transform: 'translateY(-50%)', zIndex: 0 }}
              ></div>
              <div
                className="position-absolute bg-cyan"
                style={{
                  height: '3px',
                  top: '50%',
                  left: '10%',
                  width: `${timelineStep > 1 ? (timelineStep - 1) * 33.33 : 0}%`,
                  transform: 'translateY(-50%)',
                  zIndex: 0,
                  transition: 'width 0.4s ease'
                }}
              ></div>

              {/* Steps */}
              {['Submitted', 'Assigned', 'In Progress', 'Resolved'].map((label, index) => {
                const stepNum = index + 1;
                const isCompleted = timelineStep >= stepNum;
                const isActive = timelineStep === stepNum;
                return (
                  <div key={label} className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 1, width: '25%' }}>
                    <div
                      className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${isCompleted ? 'bg-success text-white' : 'bg-dark text-secondary border border-secondary border-opacity-50'
                        }`}
                      style={{ width: '36px', height: '36px', fontSize: '0.9rem', transition: 'all 0.3s ease' }}
                    >
                      {stepNum}
                    </div>
                    <span className={`small mt-2 text-center d-none d-md-block ${isCompleted ? 'text-light' : 'text-muted'}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="row g-4">
          {/* Main Details Panel */}
          <div className="col-lg-8">
            <div className="glass-panel p-4 p-md-5 h-100">
              {formError && (
                <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger p-3 mb-4">
                  {formError}
                </div>
              )}

              {!isEditing ? (
                <>
                  <div className="d-flex justify-content-between align-items-start mb-4 gap-2 border-bottom border-light border-opacity-10 pb-3">
                    <div>
                      <span className="text-info small fw-bold tracking-wider text-uppercase">{currentComplaint.category}</span>
                      <h2 className="text-white fw-bold mt-1 mb-0">{currentComplaint.name}</h2>
                    </div>
                    <StatusBadge status={currentComplaint.status} />
                  </div>

                  <div className="mb-4">
                    <h6 className="text-secondary small fw-medium">Detailed Grievance / Comment</h6>
                    <p className="text-light fs-6" style={{ whiteSpace: 'pre-wrap' }}>
                      {currentComplaint.comment}
                    </p>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <h6 className="text-secondary small fw-medium">Grievance Location</h6>
                      <p className="text-light m-0">{currentComplaint.address}</p>
                      <p className="text-muted small m-0">{currentComplaint.city}, {currentComplaint.state} - {currentComplaint.pincode}</p>
                    </div>
                    <div className="col-md-6">
                      <h6 className="text-secondary small fw-medium">Lodged On</h6>
                      <p className="text-light m-0">
                        {new Date(currentComplaint.createdAt).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Action triggers depending on states */}
                  {currentComplaint.status === 'Pending' && (
                    <div className="d-flex gap-3 border-top border-light border-opacity-10 pt-4 mt-4">
                      <button onClick={() => setIsEditing(true)} className="btn btn-outline-light px-4 py-2 small fw-semibold">
                        Edit Complaint
                      </button>
                      <button onClick={handleCancel} className="btn btn-outline-danger px-4 py-2 small fw-semibold">
                        Cancel Complaint
                      </button>
                    </div>
                  )}

                  {currentComplaint.status === 'Resolved' && (
                    <div className="d-flex flex-column gap-3 border-top border-light border-opacity-10 pt-4 mt-4">
                      {!isReopening ? (
                        <div className="d-flex gap-3">
                          <button onClick={() => setIsReopening(true)} className="btn btn-gradient px-4 py-2">
                            Reopen Complaint
                          </button>
                          <Link to={`/user/feedback/${currentComplaint._id}`} className="btn btn-outline-success px-4 py-2 text-decoration-none">
                            Submit Feedback & Star Rating
                          </Link>
                        </div>
                      ) : (
                        <form onSubmit={handleReopen} className="w-100">
                          <div className="mb-3">
                            <label htmlFor="reopenReason" className="form-label text-warning small fw-medium">
                              Reason for Reopening (Maximum 3 reopens allowed)
                            </label>
                            <textarea
                              id="reopenReason"
                              rows="3"
                              className="form-control glass-input"
                              placeholder="Please describe why the grievance resolution was unsatisfactory..."
                              value={reopenReason}
                              onChange={(e) => setReopenReason(e.target.value)}
                              required
                            ></textarea>
                          </div>
                          <div className="d-flex gap-2">
                            <button type="submit" disabled={loading} className="btn btn-warning text-dark px-4">
                              Confirm Reopen
                            </button>
                            <button type="button" onClick={() => { setIsReopening(false); setFormError(''); }} className="btn btn-outline-secondary text-secondary">
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Edit Mode Form */
                <form onSubmit={handleUpdate}>
                  <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-light border-opacity-10 pb-3">
                    <h3 className="text-white fw-bold m-0">Edit Grievance</h3>
                    <button type="button" onClick={() => setIsEditing(false)} className="btn btn-outline-secondary btn-sm">
                      Cancel
                    </button>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="editName" className="form-label text-secondary small">Complaint Title / Subject</label>
                    <input
                      type="text"
                      id="editName"
                      className="form-control glass-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="editCategory" className="form-label text-secondary small">Category</label>
                      <select
                        id="editCategory"
                        className="form-select glass-input"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                      >
                        <option value="Municipal">Municipal</option>
                        <option value="Electricity">Electricity</option>
                        <option value="Police">Police</option>
                        <option value="Water Leakage">Water Leakage</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="editPincode" className="form-label text-secondary small">Pincode</label>
                      <input
                        type="text"
                        id="editPincode"
                        maxLength="6"
                        className="form-control glass-input"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="editComment" className="form-label text-secondary small">Detailed Comment / Description</label>
                    <textarea
                      id="editComment"
                      rows="4"
                      className="form-control glass-input"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="editAddress" className="form-label text-secondary small">Address</label>
                    <input
                      type="text"
                      id="editAddress"
                      className="form-control glass-input"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row mb-4">
                    <div className="col-md-6 mb-3 mb-md-0">
                      <label htmlFor="editCity" className="form-label text-secondary small">City</label>
                      <input
                        type="text"
                        id="editCity"
                        className="form-control glass-input"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="editState" className="form-label text-secondary small">State</label>
                      <input
                        type="text"
                        id="editState"
                        className="form-control glass-input"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="btn btn-gradient w-100 py-3 fw-bold">
                    Save Changes
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar Metadata (Technician & Chat options) */}
          <div className="col-lg-4">
            <div className="glass-panel p-4 h-100">
              <h5 className="text-white mb-4 small fw-semibold tracking-wider text-uppercase border-bottom border-light border-opacity-10 pb-2">
                Task Management
              </h5>

              {/* Assignment info */}
              {(currentComplaint.status === 'In Progress' || currentComplaint.status === 'Work Started') ? (
                <div className="mb-4">
                  <span className="text-secondary small d-block mb-1">Assigned Agent</span>
                  <p className="text-light fw-bold m-0">
                    {currentComplaint.assignedAgent?.name || 
                     currentComplaint.assignedAgentId?.name || 
                     currentComplaint.assignment?.agentName || 
                     'Technician Assigned'}
                  </p>
                  {(currentComplaint.assignedAgent?.phone || currentComplaint.assignedAgentId?.phone) && (
                    <p className="text-muted small m-0">
                      {currentComplaint.assignedAgent?.phone || currentComplaint.assignedAgentId?.phone}
                    </p>
                  )}

                  {/* Chat Trigger (Only active during In Progress / Work Started) */}
                  <div className="mt-4">
                    <Link to={`/user/chat/${currentComplaint._id}`} className="btn btn-gradient w-100 py-2.5 text-decoration-none small text-center d-block">
                      💬 Open Chat with Agent
                    </Link>
                  </div>
                </div>
              ) : currentComplaint.status === 'Resolved' ? (
                <div className="p-3 bg-success bg-opacity-10 rounded border border-success border-opacity-25 mb-4 text-center">
                  <p className="text-success small m-0">Grievance resolved successfully.</p>
                </div>
              ) : (
                <div className="text-center py-4 bg-dark bg-opacity-25 rounded p-3 mb-4">
                  <p className="text-secondary small m-0">Awaiting assignment by portal administrator.</p>
                </div>
              )}

              {/* Reopen Tally (For auditing) */}
              <div className="mt-4 pt-3 border-top border-light border-opacity-10">
                <span className="text-secondary small d-block mb-1">Reopen History</span>
                <p className="text-light m-0">
                  Total Reopens: <strong className="text-warning">{currentComplaint.reopenCount || 0} / 3</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ComplaintDetails;
