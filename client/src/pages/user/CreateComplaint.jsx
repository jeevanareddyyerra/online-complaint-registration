import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useComplaint from '../../hooks/useComplaint';
import Navbar from '../../components/common/Navbar';

const CreateComplaint = () => {
  const { createComplaint, loading } = useComplaint();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [comment, setComment] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Basic Validations
    if (!name || !category || !comment || !address || !city || !state || !pincode) {
      setFormError('Please fill in all fields.');
      return;
    }

    if (name.trim().length < 3) {
      setFormError('Complaint title must be at least 3 characters.');
      return;
    }

    if (comment.trim().length < 10) {
      setFormError('Comment must be at least 10 characters long.');
      return;
    }

    const pin = pincode.trim();
    if (isNaN(pin) || pin.length !== 6) {
      setFormError('Pincode must be exactly 6 digits.');
      return;
    }

    try {
      await createComplaint({
        name,
        category,
        address,
        city,
        state,
        pincode: Number(pin),
        comment,
        attachments: [],
      });
      navigate('/user/dashboard');
    } catch (err) {
      // Error is already shown by context toast
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-5 animate-fade-in">
        <div className="w-100 mx-auto" style={{ maxWidth: '750px' }}>
          <div className="mb-4">
            <Link to="/user/dashboard" className="text-info fw-semibold text-decoration-none small">
              &larr; Back to Dashboard
            </Link>
          </div>

          <div className="glass-panel p-4 p-md-5">
            <h2 className="text-white mb-4 fw-bold">Lodge a New Complaint</h2>
            <p className="text-secondary mb-4">
              Please provide precise information about the grievance so that our administration can assign the correct field technician.
            </p>

            {formError && (
              <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger p-3 mb-4" role="alert">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="complaintName" className="form-label text-secondary small fw-medium">Complaint Title / Subject</label>
                <input
                  type="text"
                  className="form-control glass-input"
                  id="complaintName"
                  placeholder="e.g. Water leak in sector 5 main pipeline"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="category" className="form-label text-secondary small fw-medium">Complaint Category</label>
                  <select
                    className="form-select glass-input"
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Category</option>
                    <option value="Municipal">Municipal</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Police">Police</option>
                    <option value="Water Leakage">Water Leakage</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="pincode" className="form-label text-secondary small fw-medium">Pincode (6-digit)</label>
                  <input
                    type="text"
                    maxLength="6"
                    className="form-control glass-input"
                    id="pincode"
                    placeholder="e.g. 400001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="comment" className="form-label text-secondary small fw-medium">Detailed Comment / Description</label>
                <textarea
                  className="form-control glass-input"
                  id="comment"
                  rows="4"
                  placeholder="Describe the issue in detail (min 10 characters)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="mb-3">
                <label htmlFor="address" className="form-label text-secondary small fw-medium">Grievance Address / Location</label>
                <input
                  type="text"
                  className="form-control glass-input"
                  id="address"
                  placeholder="Street name, landmark..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="row mb-4">
                <div className="col-md-6 mb-3 mb-md-0">
                  <label htmlFor="city" className="form-label text-secondary small fw-medium">City</label>
                  <input
                    type="text"
                    className="form-control glass-input"
                    id="city"
                    placeholder="e.g. Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="state" className="form-label text-secondary small fw-medium">State</label>
                  <input
                    type="text"
                    className="form-control glass-input"
                    id="state"
                    placeholder="e.g. Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-gradient w-100 py-3 fw-bold"
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : null}
                Lodge Complaint
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateComplaint;
