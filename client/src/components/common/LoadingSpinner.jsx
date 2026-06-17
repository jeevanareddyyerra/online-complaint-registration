import React from 'react';

const LoadingSpinner = ({ fullPage = false }) => {
  const spinnerClass = fullPage 
    ? "d-flex justify-content-center align-items-center min-vh-100 bg-dark text-white"
    : "d-flex justify-content-center align-items-center p-5";

  return (
    <div className={spinnerClass}>
      <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
