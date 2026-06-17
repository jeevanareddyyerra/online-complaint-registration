import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login, error, clearError, user } = useAuth();
  const navigate = useNavigate();

  // Clear global auth errors when mounting
  useEffect(() => {
    clearError();
    setFormError('');
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      redirectUser(user.role);
    }
  }, [user]);

  const redirectUser = (role) => {
    if (role === 'Admin') {
      navigate('/admin/dashboard');
    } else if (role === 'Agent') {
      navigate('/agent/dashboard');
    } else {
      navigate('/user/dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!email || !password) {
      setFormError('Please fill in all fields.');
      return;
    }

    try {
      const loggedInUser = await login(email, password);
      redirectUser(loggedInUser.role);
    } catch (err) {
      // Handled by AuthContext, error state will be set
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 animate-fade-in">
      <div className="w-100" style={{ maxWidth: '450px' }}>
        <div className="text-center mb-4">
          <h1 className="fw-bold" style={{ background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Complaint Registry
          </h1>
          <p className="text-secondary">Secure Portal Access</p>
        </div>

        <div className="glass-panel p-4 p-md-5">
          <h3 className="mb-4 text-center">Sign In</h3>

          {(formError || error) && (
            <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger p-3 mb-4" role="alert">
              {formError || error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label text-secondary small fw-medium">Email Address</label>
              <input
                type="email"
                className="form-control glass-input"
                id="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label text-secondary small fw-medium">Password</label>
              <input
                type="password"
                className="form-control glass-input"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-gradient w-100 py-3 mb-3">
              Sign In
            </button>
          </form>

          <div className="text-center mt-4 small">
            <span className="text-secondary">Don't have an account? </span>
            <Link to="/signup" className="text-info fw-semibold text-decoration-none">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
