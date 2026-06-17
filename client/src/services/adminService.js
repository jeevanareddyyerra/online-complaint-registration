import api from './api';

const adminService = {
  getDashboardMetrics: async () => {
    const response = await api.get('/admin/dashboard/metrics');
    return response.data;
  },
  getComplaintAnalytics: async () => {
    const response = await api.get('/admin/analytics/complaints');
    return response.data;
  },
  getFeedbackAnalytics: async () => {
    const response = await api.get('/admin/analytics/feedback');
    return response.data;
  },
  getResolutionTrends: async () => {
    const response = await api.get('/admin/analytics/resolution-trends');
    return response.data;
  },
  getUsers: async (page = 1, limit = 10) => {
    const response = await api.get('/auth/users', { params: { page, limit } });
    return response.data;
  },
  getAgents: async (page = 1, limit = 10, approved = '') => {
    const response = await api.get('/agents', { params: { page, limit, approved } });
    return response.data;
  },
  getFeedback: async (page = 1, limit = 10) => {
    const response = await api.get('/feedback', { params: { page, limit } });
    return response.data;
  },
  approveAgent: async (id) => {
    const response = await api.patch(`/agents/${id}/approve`);
    return response.data;
  },
  revokeAgent: async (id) => {
    const response = await api.patch(`/agents/${id}/revoke`);
    return response.data;
  },
  getComplaints: async (params = {}) => {
    const response = await api.get('/complaints', { params });
    return response.data;
  },
  assignComplaint: async (complaintId, agentId) => {
    const response = await api.post('/assignments/assign', { complaintId, agentId });
    return response.data;
  }
};

export default adminService;
