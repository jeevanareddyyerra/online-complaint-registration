import React from 'react';

const StatusBadge = ({ status }) => {
  const getBadgeClass = (statusVal) => {
    switch (statusVal) {
      case 'Pending':
        return 'badge-status-pending';
      case 'In Progress':
      case 'Work Started':
        return 'badge-status-inprogress';
      case 'Resolved':
        return 'badge-status-resolved';
      case 'Rejected':
        return 'badge-status-rejected';
      default:
        return 'bg-light text-dark border';
    }
  };

  return (
    <span className={`badge rounded-pill px-3 py-2 fw-semibold small ${getBadgeClass(status)}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
