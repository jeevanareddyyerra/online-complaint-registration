import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Home = () => {
  const { user } = useAuth();

  // Redirect to respective dashboard if user is already logged in
  if (user) {
    if (user.role === 'Admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'Agent') return <Navigate to="/agent/dashboard" replace />;
    return <Navigate to="/user/dashboard" replace />;
  }

  return (
    <div className="container min-vh-100 d-flex flex-column justify-content-between py-4 animate-fade-in">
      <header className="d-flex justify-content-between align-items-center py-2 border-bottom border-light border-opacity-10">
        <h3 className="fw-bold m-0" style={{ background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Complaint Registry
        </h3>
        <div className="d-flex gap-2">
          <Link to="/login" className="btn btn-outline-light px-3 py-2 small fw-semibold text-decoration-none">
            Sign In
          </Link>
          <Link to="/signup" className="btn btn-gradient px-3 py-2 small fw-semibold text-decoration-none">
            Get Started
          </Link>
        </div>
      </header>

      <main className="row align-items-center my-5 py-4">
        <div className="col-lg-7 text-center text-lg-start mb-5 mb-lg-0">
          <h1 className="display-4 fw-extrabold mb-3" style={{ lineHeight: '1.2' }}>
            A Modern Platform for <br />
            <span style={{ background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Transparent Resolutions
            </span>
          </h1>
          <p className="lead text-secondary mb-4 fs-5" style={{ maxWidth: '600px' }}>
            Submit, track, and resolve municipal, electrical, and public complaints in real time. We bridge communication between citizens and field technicians.
          </p>
          <div className="d-flex flex-wrap justify-content-center justify-content-lg-start gap-3">
            <Link to="/signup" className="btn btn-gradient px-4 py-3 btn-lg text-decoration-none">
              Lodge a Complaint
            </Link>
            <Link to="/login" className="btn btn-outline-secondary px-4 py-3 btn-lg text-decoration-none text-light border-light border-opacity-25">
              Portal Login
            </Link>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="glass-panel p-4 p-md-5">
            <h4 className="mb-4">Platform Features</h4>
            <ul className="list-unstyled d-flex flex-column gap-4">
              <li className="d-flex gap-3">
                <span className="fs-3 text-cyan">📱</span>
                <div>
                  <h6 className="mb-1 text-light">Real-Time Tracking</h6>
                  <p className="text-secondary small m-0">Monitor ticket status updates from submission to resolution.</p>
                </div>
              </li>
              <li className="d-flex gap-3">
                <span className="fs-3 text-violet">💬</span>
                <div>
                  <h6 className="mb-1 text-light">User-Officer Chat</h6>
                  <p className="text-secondary small m-0">Chat directly with the officer handling your ticket to share details.</p>
                </div>
              </li>
              <li className="d-flex gap-3">
                <span className="fs-3 text-success">🔔</span>
                <div>
                  <h6 className="mb-1 text-light">Automated Updates</h6>
                  <p className="text-secondary small m-0">Receive instant email updates for milestones and field logs.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="text-center py-3 border-top border-light border-opacity-10 text-muted small">
        &copy; {new Date().getFullYear()} Online Complaint Registration Portal. DeepMind Antigravity Design.
      </footer>
    </div>
  );
};

export default Home;
