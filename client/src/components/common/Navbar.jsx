import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import NotificationBell from './NotificationBell';
import { useTheme } from '../../context/ThemeContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'Admin') return '/admin/dashboard';
    if (user.role === 'Agent') return '/agent/dashboard';
    return '/user/dashboard';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top px-3 shadow-sm">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to={getDashboardLink()}>
          <span style={{ background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Complaint Registry
          </span>
        </Link>
        
        <button 
          className="navbar-toggler border-0" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarContent" 
          aria-controls="navbarContent" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {user && (
              <>
                <li className="nav-item">
                  <Link 
                    className={`nav-link small fw-semibold ${location.pathname.includes('/dashboard') ? 'active text-info' : 'text-secondary'}`} 
                    to={getDashboardLink()}
                  >
                    Dashboard
                  </Link>
                </li>
                {user.role === 'Ordinary' && (
                  <li className="nav-item">
                    <Link 
                      className={`nav-link small fw-semibold ${location.pathname === '/user/lodge' ? 'active text-info' : 'text-secondary'}`} 
                      to="/user/lodge"
                    >
                      Lodge Complaint
                    </Link>
                  </li>
                )}
                {user.role === 'Admin' && (
                  <>
                    <li className="nav-item">
                      <Link 
                        className={`nav-link small fw-semibold ${location.pathname === '/admin/analytics' ? 'active text-info' : 'text-secondary'}`} 
                        to="/admin/analytics"
                      >
                        Analytics
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link 
                        className={`nav-link small fw-semibold ${location.pathname === '/admin/assignments' ? 'active text-info' : 'text-secondary'}`} 
                        to="/admin/assignments"
                      >
                        Assign Complaints
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link 
                        className={`nav-link small fw-semibold ${location.pathname === '/admin/agents' ? 'active text-info' : 'text-secondary'}`} 
                        to="/admin/agents"
                      >
                        Agents List
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link 
                        className={`nav-link small fw-semibold ${location.pathname === '/admin/users' ? 'active text-info' : 'text-secondary'}`} 
                        to="/admin/users"
                      >
                        Citizens List
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link 
                        className={`nav-link small fw-semibold ${location.pathname === '/admin/feedback' ? 'active text-info' : 'text-secondary'}`} 
                        to="/admin/feedback"
                      >
                        Feedback List
                      </Link>
                    </li>
                  </>
                )}
              </>
            )}
          </ul>

          <div className="d-flex align-items-center gap-3">
            <button
              onClick={toggleTheme}
              className="btn btn-link p-2 nav-theme-toggle-btn"
              style={{ textDecoration: 'none', boxShadow: 'none' }}
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              <span className="fs-5">{theme === 'light' ? '🌙' : '☀️'}</span>
            </button>
            {user ? (
              <>
                <NotificationBell />
                <div className="d-none d-md-flex flex-column align-items-end">
                  <span className="text-dark fw-medium small">{user.name}</span>
                  <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary small" style={{ fontSize: '0.7rem' }}>
                    {user.role} {user.role === 'Agent' && !user.isApproved ? '(Pending)' : ''}
                  </span>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="btn btn-outline-danger btn-sm px-3 py-1.5 fw-semibold"
                  style={{ borderRadius: 'var(--radius-sm)' }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                {location.pathname !== '/login' && (
                  <Link to="/login" className="btn btn-outline-primary btn-sm px-3 py-1.5 fw-semibold">
                    Sign In
                  </Link>
                )}
                {location.pathname !== '/signup' && (
                  <Link to="/signup" className="btn btn-gradient btn-sm px-3 py-1.5 fw-semibold">
                    Get Started
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
