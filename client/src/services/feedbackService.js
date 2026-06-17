import api from './api';

const feedbackService = {
  submitFeedback: async (payload) => {
    const response = await api.post('/feedback', payload);
    return response.data;
  },
  getFeedbackDetails: async (complaintId) => {
    const response = await api.get(`/feedback/${complaintId}`);
    return response.data;
  }
};

export default feedbackService;
