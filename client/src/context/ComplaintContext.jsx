import React, { createContext, useState, useCallback } from 'react';
import complaintService from '../services/complaintService';
import { toast } from 'react-toastify';

export const ComplaintContext = createContext();

export const ComplaintProvider = ({ children }) => {
  const [complaints, setComplaints] = useState([]);
  const [currentComplaint, setCurrentComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getMyComplaints = useCallback(async (page = 1, limit = 10, status = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await complaintService.getMyComplaints(page, limit, status);
      const fetched = res.data?.items || res.data?.complaints || res.data || [];
      setComplaints(fetched);
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to fetch complaints.';
      setError(errMsg);
      toast.error(errMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getComplaintDetails = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await complaintService.getComplaintById(id);
      const fetched = res.data?.complaint || res.data || null;
      setCurrentComplaint(fetched);
      return fetched;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to fetch complaint details.';
      setError(errMsg);
      toast.error(errMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createComplaint = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await complaintService.createComplaint(payload);
      const newComplaint = res.data?.complaint || res.data;
      setComplaints((prev) => [newComplaint, ...prev]);
      toast.success(res.message || 'Complaint registered successfully.');
      return newComplaint;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to register complaint.';
      setError(errMsg);
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateComplaint = async (id, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await complaintService.updateComplaint(id, payload);
      const updated = res.data?.complaint || res.data;
      setComplaints((prev) =>
        prev.map((c) => (c._id === id ? updated : c))
      );
      if (currentComplaint && currentComplaint._id === id) {
        setCurrentComplaint(updated);
      }
      toast.success(res.message || 'Complaint updated successfully.');
      return updated;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update complaint.';
      setError(errMsg);
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelComplaint = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await complaintService.cancelComplaint(id);
      const updated = res.data?.complaint || res.data;
      setComplaints((prev) =>
        prev.map((c) => (c._id === id ? updated : c))
      );
      if (currentComplaint && currentComplaint._id === id) {
        setCurrentComplaint(updated);
      }
      toast.success(res.message || 'Complaint cancelled successfully.');
      return updated;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to cancel complaint.';
      setError(errMsg);
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reopenComplaint = async (id, reason) => {
    setLoading(true);
    setError(null);
    try {
      const res = await complaintService.reopenComplaint(id, reason);
      const updated = res.data?.complaint || res.data;
      setComplaints((prev) =>
        prev.map((c) => (c._id === id ? updated : c))
      );
      if (currentComplaint && currentComplaint._id === id) {
        setCurrentComplaint(updated);
      }
      toast.success(res.message || 'Complaint reopened successfully.');
      return updated;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to reopen complaint.';
      setError(errMsg);
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <ComplaintContext.Provider
      value={{
        complaints,
        currentComplaint,
        loading,
        error,
        getMyComplaints,
        getComplaintDetails,
        createComplaint,
        updateComplaint,
        cancelComplaint,
        reopenComplaint,
        clearError,
      }}
    >
      {children}
    </ComplaintContext.Provider>
  );
};
