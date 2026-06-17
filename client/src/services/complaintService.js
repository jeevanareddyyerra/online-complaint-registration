import api from './api';

const complaintService = {
  createComplaint: async (payload) => {
    const response = await api.post('/complaints', payload);
    return response.data;
  },
  getMyComplaints: async (page = 1, limit = 10, status = '') => {
    const response = await api.get('/complaints/my-complaints', {
      params: { page, limit, status }
    });
    return response.data;
  },
  getComplaintById: async (id) => {
    const response = await api.get(`/complaints/${id}`);
    return response.data;
  },
  updateComplaint: async (id, payload) => {
    const response = await api.put(`/complaints/${id}`, payload);
    return response.data;
  },
  cancelComplaint: async (id) => {
    const response = await api.delete(`/complaints/${id}`);
    return response.data;
  },
  reopenComplaint: async (id, reason) => {
    const response = await api.patch(`/complaints/${id}/reopen`, { reason });
    return response.data;
  },
  getActiveTasks: async () => {
    const response = await api.get('/assignments/active-tasks');
    return response.data;
  },
  acceptTask: async (assignmentId) => {
    const response = await api.patch(`/assignments/${assignmentId}/accept`);
    return response.data;
  },
  resolveTask: async (assignmentId, resolutionNotes) => {
    const response = await api.patch(`/assignments/${assignmentId}/resolve`, {
      resolutionNotes,
      resolutionAttachments: []
    });
    return response.data;
  }
};

export default complaintService;
