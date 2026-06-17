import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Ordinary');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { register, error, clearError, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
    setFormError('');
  }, []);

  // Redirect if logged in
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
    setSuccessMsg('');

    if (!name || !email || !password || !phone) {
      setFormError('Please fill in all fields.');
      return;
    }

    // Phone number verification (10 digits)
    const phoneNum = Number(phone);
    if (isNaN(phoneNum) || phone.length !== 10) {
      setFormError('Phone number must be exactly 10 digits.');
      return;
    }

    try {
      const createdUser = await register(name, email, password, phoneNum, role);
      if (createdUser.role === 'Agent') {
        setSuccessMsg('Registration successful! Your agent account is awaiting administrator approval before you can log in.');
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setRole('Agent');
      } else {
        redirectUser(createdUser.role);
      }
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 animate-fade-in py-5">
      <div className="w-100" style={{ maxWidth: '480px' }}>
        <div className="text-center mb-4">
          <h1 className="fw-bold" style={{ background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Complaint Registry
          </h1>
          <p className="text-secondary">Create your secure gateway account</p>
        </div>

        <div className="glass-panel p-4 p-md-5">
          <h3 className="mb-4 text-center">Sign Up</h3>

          {successMsg && (
            <div className="alert alert-success border-0 bg-success bg-opacity-10 text-success p-3 mb-4" role="alert">
              {successMsg}
            </div>
          )}

          {(formError || error) && (
            <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger p-3 mb-4" role="alert">
              {formError || error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="name" className="form-label text-secondary small fw-medium">Full Name</label>
              <input
                type="text"
                className="form-control glass-input"
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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

            <div className="mb-3">
              <label htmlFor="phone" className="form-label text-secondary small fw-medium">Phone Number</label>
              <input
                type="tel"
                className="form-control glass-input"
                id="phone"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label text-secondary small fw-medium">Password</label>
              <input
                type="password"
                className="form-control glass-input"
                id="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label text-secondary small fw-medium">I am registering as an:</label>
              <div className="d-flex gap-4 mt-1">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="role"
                    id="roleOrdinary"
                    value="Ordinary"
                    checked={role === 'Ordinary'}
                    onChange={() => setRole('Ordinary')}
                  />
                  <label className="form-check-label text-light" htmlFor="roleOrdinary">
                    Citizen
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="role"
                    id="roleAgent"
                    value="Agent"
                    checked={role === 'Agent'}
                    onChange={() => setRole('Agent')}
                  />
                  <label className="form-check-label text-light" htmlFor="roleAgent">
                    Field Agent (Officer)
                  </label>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-gradient w-100 py-3 mb-3">
              Sign Up
            </button>
          </form>

          <div className="text-center mt-4 small">
            <span className="text-secondary">Already have an account? </span>
            <Link to="/login" className="text-info fw-semibold text-decoration-none">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
