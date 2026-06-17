import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';

const ComplaintCard = ({ complaint, unreadCount }) => {
  const { _id, name, category, comment, status, city, state, createdAt } = complaint;

  // Format date
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Truncate description text
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className="glass-card h-100 d-flex flex-column justify-content-between p-4">
      <div>
        <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
          <h5 className="mb-0 text-white fw-bold text-truncate" style={{ maxWidth: '180px' }} title={name}>{name}</h5>
          <StatusBadge status={status} />
        </div>
        
        <span className="badge bg-light bg-opacity-10 text-info small mb-3" style={{ fontSize: '0.75rem' }}>
          {category}
        </span>
        
        <p className="text-secondary small mb-2">
          Filed on: <span className="text-light">{formatDate(createdAt)}</span>
        </p>

        <p className="text-secondary small mb-3">
          Location: <span className="text-light">{city}, {state}</span>
        </p>
        
        <p className="text-secondary mb-4 small" style={{ minHeight: '40px' }}>
          {truncateText(comment, 100)}
        </p>
      </div>

      <div className="border-top border-light border-opacity-10 pt-3 d-flex justify-content-between align-items-center gap-2">
        <span className="text-muted small">ID: #{_id.substring(_id.length - 6).toUpperCase()}</span>
        <div className="d-flex gap-2">
          {(status === 'In Progress' || status === 'Work Started') && (
            <Link to={`/user/chat/${_id}`} className="btn btn-outline-info btn-sm px-2.5 text-decoration-none small d-flex align-items-center">
              💬 Chat {unreadCount > 0 ? `(${unreadCount})` : ''}
            </Link>
          )}
          <Link to={`/user/complaint/${_id}`} className="btn btn-gradient btn-sm px-3 text-decoration-none">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ComplaintCard;
