import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'Admin') {
      navigate('/admin/dashboard');
    } else if (user.role === 'Agent') {
      navigate('/agent/dashboard');
    } else {
      navigate('/user/dashboard');
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 animate-fade-in">
      <div className="w-100 text-center" style={{ maxWidth: '450px' }}>
        <div className="glass-panel p-5">
          <div className="mb-4">
            <span className="text-danger fw-bold" style={{ fontSize: '4rem' }}>🛑</span>
          </div>
          <h2 className="mb-3 text-danger">Access Denied</h2>
          <p className="text-secondary mb-4">
            You do not have the permissions required to view this dashboard page.
          </p>
          <button onClick={handleGoBack} className="btn btn-gradient w-100 py-3">
            Go to My Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
