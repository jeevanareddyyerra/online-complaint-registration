import React from 'react';
import useAuth from '../hooks/useAuth';

const AwaitingApproval = () => {
  const { logout, user } = useAuth();

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 animate-fade-in">
      <div className="w-100 text-center" style={{ maxWidth: '500px' }}>
        <div className="glass-panel p-5">
          <div className="mb-4">
            <i className="bi bi-shield-lock text-warning" style={{ fontSize: '4rem' }}></i>
            {/* Bootstrap icons warning icon fallback if bootstrap-icons isn't loaded */}
            <div className="text-warning fw-bold fs-1">⚠️</div>
          </div>
          <h2 className="mb-3">Awaiting Approval</h2>
          <p className="text-secondary mb-4">
            Hello <strong className="text-white">{user?.name}</strong>, your account has been registered as a <strong className="text-info">Field Agent / Officer</strong>.
          </p>
          <p className="text-muted small mb-5">
            To maintain platform integrity, system administrators must verify and activate your account. You will receive access as soon as your account is approved.
          </p>
          <button onClick={logout} className="btn btn-gradient w-100 py-3">
            Back to Sign In (Logout)
          </button>
        </div>
      </div>
    </div>
  );
};

export default AwaitingApproval;
